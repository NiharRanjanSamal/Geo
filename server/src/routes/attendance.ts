import { Router, Response } from 'express';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { AttendanceReportRow, SiteBreakdownRow } from '../types/index.js';
import type { Row } from '../config/db.js';

const router = Router();

/** Body for POST /attendance/mark (mobile app sync) */
interface MarkAttendanceBody {
  zoneId: string | null;
  siteId: string | null;
  type: 'IN' | 'OUT';
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

function toReportRow(r: Row): AttendanceReportRow {
  const dateNum = r.attendance_date as number;
  const year = Math.floor(dateNum / 10000);
  const month = Math.floor((dateNum % 10000) / 100);
  const day = dateNum % 100;
  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  let checkInTime: string | null = null;
  let checkOutTime: string | null = null;
  if (r.first_in_time != null) {
    checkInTime = new Date((r.first_in_time as number) * 1000).toISOString();
  }
  if (r.last_out_time != null) {
    checkOutTime = new Date((r.last_out_time as number) * 1000).toISOString();
  }

  const totalSeconds = (r.total_work_seconds as number) ?? 0;
  const totalMinutes = totalSeconds > 0 ? Math.round(totalSeconds / 60) : null;

  return {
    employeeId: String(r.employee_id),
    employeeCode: (r.employee_code as string) ?? '',
    employeeName: [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || (r.employee_code as string),
    siteId: r.site_id != null ? String(r.site_id) : '',
    siteName: (r.site_name as string) ?? '',
    date,
    checkInTime,
    checkOutTime,
    totalMinutes,
    status: (r.status as AttendanceReportRow['status']) ?? 'present',
  };
}

router.post('/mark', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.jwt!.employeeId;
    if (employeeId == null) {
      res.status(403).json({ message: 'No employee linked to this account; cannot mark attendance' });
      return;
    }

    const body = req.body as MarkAttendanceBody;
    const { zoneId, siteId, type, latitude, longitude, accuracy, timestamp } = body;
    if (!type || (type !== 'IN' && type !== 'OUT') || typeof timestamp !== 'number') {
      res.status(400).json({ message: 'Invalid body: type (IN|OUT), and timestamp (number) required' });
      return;
    }

    // siteId and zoneId are optional when employee has "no location required"
    // Use site_id = NULL for "no location required" attendance (avoids FK violation)
    let siteIdNum: number | null = siteId ? Number(siteId) : null;
    if (siteId && (siteIdNum === null || Number.isNaN(siteIdNum))) {
      res.status(400).json({ message: 'siteId must be a number' });
      return;
    }

    // If no siteId provided, check if employee has "no location required"
    if (!siteId) {
      const [noLocRow] = await query<Row[]>(
        `SELECT 1 FROM employee_zone_assignment WHERE employee_id = ? AND no_location = 1 AND status = 'active' LIMIT 1`,
        [employeeId]
      );
      const hasNoLocation = Boolean(Array.isArray(noLocRow) ? noLocRow[0] : noLocRow);
      if (!hasNoLocation) {
        res.status(400).json({ message: 'siteId is required unless employee has "no location" assignment' });
        return;
      }
      siteIdNum = null; // NULL = "no location required"
    }

    const d = new Date(timestamp * 1000);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate();
    const attendanceDate = y * 10000 + m * 100 + day;

    const existing = await query<Row[]>(
      `SELECT id, first_in_time, last_out_time, total_work_seconds FROM attendance_day
       WHERE employee_id = ? AND ((? IS NULL AND site_id IS NULL) OR (site_id = ?)) AND attendance_date = ?
       LIMIT 1`,
      [employeeId, siteIdNum, siteIdNum, attendanceDate]
    );
    const row = Array.isArray(existing) ? existing[0] : existing;

    const now = Math.floor(Date.now() / 1000);
    if (!row) {
      if (type === 'IN') {
        await query(
          `INSERT INTO attendance_day (employee_id, site_id, attendance_date, first_in_time, session_count, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, 'present', ?, ?)`,
          [employeeId, siteIdNum, attendanceDate, timestamp, now, now]
        );
      } else {
        await query(
          `INSERT INTO attendance_day (employee_id, site_id, attendance_date, last_out_time, session_count, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 1, 'present', ?, ?)`,
          [employeeId, siteIdNum, attendanceDate, timestamp, now, now]
        );
      }
    } else {
      const id = row.id as number;
      if (type === 'IN') {
        if (row.first_in_time == null) {
          await query(
            `UPDATE attendance_day SET first_in_time = ?, session_count = 1, updated_at = ? WHERE id = ?`,
            [timestamp, now, id]
          );
        }
      } else {
        const firstIn = (row.first_in_time as number) ?? timestamp;
        const lastOut = timestamp;
        const totalSeconds = Math.max(0, lastOut - firstIn);
        await query(
          `UPDATE attendance_day SET last_out_time = ?, total_work_seconds = ?, updated_at = ? WHERE id = ?`,
          [timestamp, totalSeconds, now, id]
        );
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Mark attendance error:', err);
    res.status(500).json({ message: 'Internal server error', detail: message });
  }
});

router.get('/report', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dateParam = req.query.date as string | undefined;
    const siteIdParam = req.query.siteId as string | undefined;
    const limit = Math.min(Number(req.query.limit) || 500, 1000);
    const offset = Number(req.query.offset) || 0;

    let attendanceDate: number | null = null;
    if (dateParam) {
      const [y, m, d] = dateParam.split('-').map(Number);
      if (y && m && d) attendanceDate = y * 10000 + m * 100 + d;
    }
    if (attendanceDate == null) {
      const today = new Date();
      attendanceDate = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    }

    const jwt = req.jwt!;
    const role = jwt.role;
    const companyIdNum = jwt.companyId != null ? Number(jwt.companyId) : null;
    const siteIdNum = jwt.siteId != null ? Number(jwt.siteId) : null;
    const companyId = companyIdNum != null && !Number.isNaN(companyIdNum) ? companyIdNum : null;
    const siteId = siteIdNum != null && !Number.isNaN(siteIdNum) ? siteIdNum : null;

    // Aggregate by employee + date so one row per employee per day (merge No Location + site rows)
    let sql = `
      SELECT ad.employee_id,
             NULL AS site_id,
             ad.attendance_date,
             MIN(ad.first_in_time) AS first_in_time,
             MAX(ad.last_out_time) AS last_out_time,
             GREATEST(0, COALESCE(MAX(ad.last_out_time), 0) - COALESCE(MIN(ad.first_in_time), 0)) AS total_work_seconds,
             MAX(ad.status) AS status,
             e.employee_code, e.first_name, e.last_name,
             CASE WHEN COUNT(*) > 1 THEN 'Multiple' ELSE COALESCE(MAX(s.name), 'No Location') END AS site_name
      FROM attendance_day ad
      INNER JOIN employee e ON e.id = ad.employee_id
      LEFT JOIN site s ON s.id = ad.site_id
      WHERE ad.attendance_date = ?
    `;
    const params: (number | string)[] = [attendanceDate];

    // Filter by site for site_admin
    if (role === 'site_admin' && siteId != null) {
      sql += ' AND ad.site_id = ?';
      params.push(siteId);
    }
    // Filter by company if user has a companyId (regardless of role)
    else if (companyId != null) {
      sql += ' AND e.company_id = ?';
      params.push(companyId);
    }

    if (siteIdParam) {
      sql += ' AND ad.site_id = ?';
      params.push(Number(siteIdParam));
    }

    sql += ` GROUP BY ad.employee_id, ad.attendance_date, e.employee_code, e.first_name, e.last_name, e.company_id`;

    const safeLimit = Math.floor(Number(limit)) || 500;
    const safeOffset = Math.floor(Number(offset)) || 0;
    sql += ` ORDER BY e.first_name, e.last_name LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const rows = await query<Row[]>(sql, params);
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    const data = list.map(toReportRow) as AttendanceReportRow[];

    // For "Multiple" site rows, fetch per-site breakdown (check-in/check-out per location)
    const multipleEmployeeIds = data.filter((r) => r.siteName === 'Multiple').map((r) => r.employeeId);
    if (multipleEmployeeIds.length > 0) {
      let rawSql = `
        SELECT ad.employee_id, ad.first_in_time, ad.last_out_time,
               COALESCE(s.name, 'No Location') AS site_name
        FROM attendance_day ad
        LEFT JOIN site s ON s.id = ad.site_id
        INNER JOIN employee e ON e.id = ad.employee_id
        WHERE ad.attendance_date = ? AND ad.employee_id IN (${multipleEmployeeIds.join(',')})
      `;
      const rawParams: (number | string)[] = [attendanceDate];
      if (role === 'site_admin' && siteId != null) {
        rawSql += ' AND ad.site_id = ?';
        rawParams.push(siteId);
      } else if (companyId != null) {
        rawSql += ' AND e.company_id = ?';
        rawParams.push(companyId);
      }
      if (siteIdParam) {
        rawSql += ' AND ad.site_id = ?';
        rawParams.push(Number(siteIdParam));
      }
      rawSql += ' ORDER BY ad.employee_id, ad.site_id';
      const rawRows = await query<Row[]>(rawSql, rawParams);
      const rawList = Array.isArray(rawRows) ? rawRows : rawRows ? [rawRows] : [];
      const breakdownByEmployee = new Map<string, SiteBreakdownRow[]>();
      for (const r of rawList) {
        const empId = String(r.employee_id);
        if (!breakdownByEmployee.has(empId)) breakdownByEmployee.set(empId, []);
        breakdownByEmployee.get(empId)!.push({
          siteName: (r.site_name as string) ?? 'No Location',
          checkInTime: r.first_in_time != null ? new Date((r.first_in_time as number) * 1000).toISOString() : null,
          checkOutTime: r.last_out_time != null ? new Date((r.last_out_time as number) * 1000).toISOString() : null,
        });
      }
      for (const row of data) {
        if (row.siteName === 'Multiple') {
          row.siteBreakdown = breakdownByEmployee.get(row.employeeId) ?? [];
        }
      }
    }

    res.json({ data, total: data.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Report error:', err);
    res.status(500).json({ message: 'Internal server error', detail: message });
  }
});

export default router;

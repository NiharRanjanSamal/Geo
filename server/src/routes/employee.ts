/**
 * Routes for the logged-in employee (mobile app): "my" sites and zones only.
 * Returns only sites/zones that are assigned to this employee via employee_zone_assignment.
 */
import { Router, Response } from 'express';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Row } from '../config/db.js';

const router = Router();

/** GET /api/employee/sites - Sites that have at least one zone assigned to this employee */
router.get('/sites', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.jwt!.employeeId;
    if (employeeId == null) {
      res.json({ data: [], noLocationRequired: false });
      return;
    }

    const empIdNum = Number(employeeId);
    if (Number.isNaN(empIdNum)) {
      res.json({ data: [], noLocationRequired: false });
      return;
    }

    const [noLocationRow] = await query<Row[]>(
      `SELECT 1 FROM employee_zone_assignment WHERE employee_id = ? AND no_location = 1 AND status = 'active' LIMIT 1`,
      [empIdNum]
    );
    const noLocationRequired = Boolean(Array.isArray(noLocationRow) ? noLocationRow[0] : noLocationRow);

    const rows = await query<Row[]>(
      `SELECT DISTINCT s.id, s.name, s.site_code
       FROM site s
       INNER JOIN site_zone sz ON sz.site_id = s.id AND sz.status = 'active'
       INNER JOIN employee_zone_assignment eza ON eza.zone_id = sz.id AND eza.employee_id = ? AND eza.status = 'active' AND eza.no_location = 0
       WHERE s.status = 'active'
       ORDER BY s.name`,
      [empIdNum]
    );
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    const data = list.map((r) => ({
      id: String(r.id),
      name: r.name as string,
      siteCode: r.site_code as string,
    }));

    res.json({ data, noLocationRequired });
  } catch (err) {
    console.error('Employee sites error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** GET /api/employee/sites/:siteId/zones - Zones assigned to this employee for this site (mobile app format) */
router.get('/sites/:siteId/zones', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.jwt!.employeeId;
    if (employeeId == null) {
      res.json([]);
      return;
    }
    const siteId = req.params.siteId;
    const siteIdNum = Number(siteId);
    if (Number.isNaN(siteIdNum)) {
      res.status(400).json({ message: 'Invalid siteId' });
      return;
    }

    const empIdNum = Number(employeeId);
    if (Number.isNaN(empIdNum)) {
      res.json([]);
      return;
    }

    const rows = await query<Row[]>(
      `SELECT sz.id, sz.site_id, sz.name, sz.zone_type, sz.center_latitude, sz.center_longitude,
              sz.radius_meters, sz.polygon_boundary, sz.digipin_code
       FROM site_zone sz
       INNER JOIN employee_zone_assignment eza ON eza.zone_id = sz.id AND eza.employee_id = ? AND eza.status = 'active' AND eza.no_location = 0
       WHERE sz.site_id = ? AND sz.status = 'active'
       ORDER BY sz.name`,
      [empIdNum, siteIdNum]
    );
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];

    const zones = list.map((r) => {
      const zoneType = (r.zone_type as string) || 'circle';
      let coordinates: unknown;
      let radius: number | undefined;

      if (zoneType === 'circle') {
        coordinates =
          r.center_latitude != null && r.center_longitude != null
            ? { latitude: r.center_latitude, longitude: r.center_longitude }
            : { latitude: 0, longitude: 0 };
        radius = r.radius_meters != null ? Number(r.radius_meters) : undefined;
      } else if (zoneType === 'polygon') {
        const boundary = r.polygon_boundary;
        coordinates = boundary != null ? (typeof boundary === 'string' ? JSON.parse(boundary) : boundary) : [];
        radius = undefined;
      } else {
        coordinates =
          r.center_latitude != null && r.center_longitude != null
            ? { latitude: r.center_latitude, longitude: r.center_longitude }
            : { latitude: 0, longitude: 0 };
        radius = r.radius_meters != null ? Number(r.radius_meters) : 100;
      }

      return {
        id: String(r.id),
        siteId: String(r.site_id),
        name: r.name as string,
        type: zoneType,
        coordinates,
        radius,
      };
    });

    res.json(zones);
  } catch (err) {
    console.error('Employee zones error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

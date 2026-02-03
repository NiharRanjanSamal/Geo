import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Row } from '../config/db.js';

const router = Router();

/** Role hierarchy: higher number = higher privilege. Used to block editing users above you. */
const ROLE_LEVEL: Record<string, number> = {
  super_admin: 4,
  tenant_admin: 3,
  company_admin: 2,
  site_admin: 1,
  employee: 0,
};

function getRoleLevel(role: string | undefined): number {
  return role && ROLE_LEVEL[role] !== undefined ? ROLE_LEVEL[role] : -1;
}

function scopeEmployeeWhere(jwt: AuthRequest['jwt']): { sql: string; params: unknown[] } {
  const companyId = jwt!.companyId != null ? Number(jwt!.companyId) : null;
  const siteId = jwt!.siteId != null ? Number(jwt!.siteId) : null;
  const tenantId = jwt!.tenantId;
  
  // If user is assigned to a specific site, scope to that site's company
  if (siteId != null) {
    return { sql: 'e.company_id = (SELECT company_id FROM site WHERE id = ?)', params: [siteId] };
  }
  
  // If user is assigned to a specific company, scope to that company
  // This applies regardless of role (company_admin, tenant_admin with company, etc.)
  if (companyId != null) {
    return { sql: 'e.company_id = ?', params: [companyId] };
  }
  
  // Only super_admin and tenant_admin WITHOUT a companyId see all companies in tenant
  if (jwt!.role === 'super_admin' || jwt!.role === 'tenant_admin') {
    return { sql: 'e.company_id IN (SELECT id FROM company WHERE tenant_id = ?)', params: [tenantId] };
  }
  
  // Default: no access
  return { sql: '1 = 0', params: [] };
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sql: scopeSql, params: scopeParams } = scopeEmployeeWhere(req.jwt!);
    const rows = await query<Row[]>(
      `SELECT e.id, e.company_id, e.employee_code, e.first_name, e.last_name, e.display_name, e.email, e.phone, e.status, c.name AS company_name
       FROM employee e
       INNER JOIN company c ON c.id = e.company_id
       WHERE ${scopeSql}
       ORDER BY e.first_name, e.last_name, e.employee_code`,
      scopeParams
    );
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    res.json({
      data: list.map((r) => ({
        id: String(r.id),
        companyId: String(r.company_id),
        companyName: r.company_name,
        employeeCode: r.employee_code,
        firstName: r.first_name,
        lastName: r.last_name ?? '',
        displayName: r.display_name ?? '',
        email: r.email ?? '',
        phone: r.phone ?? '',
        status: r.status,
      })),
    });
  } catch (err) {
    console.error('Employees list error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const body = req.body as {
      companyId: string;
      employeeCode: string;
      firstName: string;
      lastName?: string;
      displayName?: string;
      email?: string;
      phone?: string;
    };
    const { companyId, employeeCode, firstName } = body;
    if (!companyId || !employeeCode || !firstName) {
      res.status(400).json({ message: 'companyId, employeeCode, and firstName are required' });
      return;
    }
    const cid = Number(companyId);
    if (Number.isNaN(cid)) {
      res.status(400).json({ message: 'Invalid companyId' });
      return;
    }
    // company_admin (and users with companyId) can only add employees to their assigned company
    const userCompanyId = jwt.companyId != null ? Number(jwt.companyId) : null;
    if (userCompanyId != null && cid !== userCompanyId) {
      res.status(403).json({ message: 'You can only add employees to your assigned company' });
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    await query(
      `INSERT INTO employee (company_id, employee_code, first_name, last_name, display_name, email, phone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        cid,
        String(employeeCode).trim(),
        String(firstName).trim(),
        body.lastName?.trim() ?? null,
        body.displayName?.trim() ?? null,
        body.email?.trim() ?? null,
        body.phone?.trim() ?? null,
        now,
        now,
      ]
    );
    const [inserted] = await query<Row[]>(
      `SELECT id, employee_code, first_name FROM employee WHERE company_id = ? AND employee_code = ? LIMIT 1`,
      [cid, String(employeeCode).trim()]
    );
    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    res.status(201).json({ id: String(row?.id), employeeCode: row?.employee_code, firstName: row?.first_name });
  } catch (err) {
    console.error('Employee create error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'Invalid employee id' });
      return;
    }
    const [row] = await query<Row[]>(
      `SELECT e.id, e.company_id, e.employee_code, e.first_name, e.last_name, e.display_name, e.email, e.phone, e.status, c.name AS company_name
       FROM employee e INNER JOIN company c ON c.id = e.company_id WHERE e.id = ? LIMIT 1`,
      [id]
    );
    const r = Array.isArray(row) ? row[0] : row;
    if (!r) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    res.json({
      id: String(r.id),
      companyId: String(r.company_id),
      companyName: r.company_name,
      employeeCode: r.employee_code,
      firstName: r.first_name,
      lastName: r.last_name ?? '',
      displayName: r.display_name ?? '',
      email: r.email ?? '',
      phone: r.phone ?? '',
      status: r.status,
    });
  } catch (err) {
    console.error('Employee get error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'Invalid employee id' });
      return;
    }
    const body = req.body as {
      employeeCode?: string;
      firstName?: string;
      lastName?: string;
      displayName?: string;
      email?: string;
      phone?: string;
      status?: string;
    };
    const updates: string[] = [];
    const params: unknown[] = [];
    if (body.employeeCode != null) updates.push('employee_code = ?'), params.push(String(body.employeeCode).trim());
    if (body.firstName != null) updates.push('first_name = ?'), params.push(String(body.firstName).trim());
    if (body.lastName !== undefined) updates.push('last_name = ?'), params.push(body.lastName?.trim() ?? null);
    if (body.displayName !== undefined) updates.push('display_name = ?'), params.push(body.displayName?.trim() ?? null);
    if (body.email !== undefined) updates.push('email = ?'), params.push(body.email?.trim() ?? null);
    if (body.phone !== undefined) updates.push('phone = ?'), params.push(body.phone?.trim() ?? null);
    if (body.status != null) updates.push('status = ?'), params.push(body.status);
    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    params.push(Math.floor(Date.now() / 1000), id);
    await query(`UPDATE employee SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (err) {
    console.error('Employee update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'Invalid employee id' });
      return;
    }
    const { sql: scopeSql, params: scopeParams } = scopeEmployeeWhere(jwt);
    const [row] = await query<Row[]>(
      `SELECT e.id FROM employee e WHERE e.id = ? AND ${scopeSql}`,
      [id, ...scopeParams]
    );
    const r = Array.isArray(row) ? row[0] : row;
    if (!r) {
      res.status(404).json({ message: 'Employee not found or access denied' });
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    await query(`UPDATE employee SET status = 'inactive', updated_at = ? WHERE id = ?`, [now, id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Employee delete error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user account linked to employee (for roles) and zone assignments
router.get('/:id/assignments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = Number(req.params.id);
    if (Number.isNaN(employeeId)) {
      res.status(400).json({ message: 'Invalid employee id' });
      return;
    }
    const [userRow] = await query<Row[]>(
      `SELECT u.id, u.email, u.role, u.role_mobile FROM user_account u
       INNER JOIN employee_user_map eum ON eum.user_id = u.id AND eum.is_primary = 1 AND eum.status = 'active'
       WHERE eum.employee_id = ? LIMIT 1`,
      [employeeId]
    );
    const user = Array.isArray(userRow) ? userRow[0] : userRow;
    const zoneRows = await query<Row[]>(
      `SELECT eza.id, eza.zone_id, eza.no_location, sz.name AS zone_name, sz.site_id, s.name AS site_name
       FROM employee_zone_assignment eza
       LEFT JOIN site_zone sz ON sz.id = eza.zone_id
       LEFT JOIN site s ON s.id = sz.site_id
       WHERE eza.employee_id = ? AND eza.status = 'active'`,
      [employeeId]
    );
    const zoneList = Array.isArray(zoneRows) ? zoneRows : zoneRows ? [zoneRows] : [];
    res.json({
      userId: user ? String(user.id) : null,
      userEmail: user?.email ?? null,
      roleWeb: user?.role ?? null,
      roleMobile: user?.role_mobile ?? null,
      zones: zoneList.map((z) => ({
        id: String(z.id),
        zoneId: z.zone_id != null ? String(z.zone_id) : null,
        zoneName: z.zone_name ?? null,
        siteId: z.site_id != null ? String(z.site_id) : null,
        siteName: z.site_name ?? null,
        noLocation: Boolean(z.no_location),
      })),
    });
  } catch (err) {
    console.error('Assignments get error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update roles (web + mobile) for user linked to employee; create user if needed
router.put('/:id/assignments/roles', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const employeeId = Number(req.params.id);
    if (Number.isNaN(employeeId)) {
      res.status(400).json({ message: 'Invalid employee id' });
      return;
    }
    const body = req.body as { email?: string; password?: string; roleWeb?: string; roleMobile?: string };
    
    // SECURITY: Role assignment - you can only assign your role and those below
    const ALLOWED_ROLES_BY_ROLE: Record<string, string[]> = {
      super_admin: ['super_admin', 'tenant_admin', 'company_admin', 'site_admin', 'employee'],
      tenant_admin: ['tenant_admin', 'company_admin', 'site_admin', 'employee'],
      company_admin: ['company_admin', 'site_admin', 'employee'],
      site_admin: ['site_admin', 'employee'],
      employee: [],
    };
    const allowed = ALLOWED_ROLES_BY_ROLE[jwt.role] ?? [];
    if (body.roleWeb != null && !allowed.includes(body.roleWeb)) {
      res.status(403).json({
        message: 'Forbidden: You can only assign your role and roles below it',
      });
      return;
    }
    const [eum] = await query<Row[]>(
      `SELECT user_id FROM employee_user_map WHERE employee_id = ? AND is_primary = 1 AND status = 'active' LIMIT 1`,
      [employeeId]
    );
    const mapping = Array.isArray(eum) ? eum[0] : eum;
    const userId = mapping?.user_id as number | undefined;

    if (userId) {
      // Cannot change roles of users with a higher role than yours
      const [targetUserRow] = await query<Row[]>(
        `SELECT role FROM user_account WHERE id = ? LIMIT 1`,
        [userId]
      );
      const targetUser = Array.isArray(targetUserRow) ? targetUserRow[0] : targetUserRow;
      const targetRole = targetUser?.role as string | undefined;
      if (getRoleLevel(targetRole) > getRoleLevel(jwt.role)) {
        res.status(403).json({
          message: 'Forbidden: You cannot change roles of users with a higher role than yours',
        });
        return;
      }

      const updates: string[] = [];
      const params: unknown[] = [];
      if (body.roleWeb != null) {
        updates.push('role = ?');
        params.push(body.roleWeb);
        // Scope company_admin to their employee's company; scope site_admin similarly; clear for tenant_admin/super_admin
        const [empRow] = await query<Row[]>(
          `SELECT e.company_id FROM employee e
           INNER JOIN employee_user_map eum ON eum.employee_id = e.id AND eum.user_id = ? AND eum.is_primary = 1 AND eum.status = 'active'
           LIMIT 1`,
          [userId]
        );
        const emp = Array.isArray(empRow) ? empRow[0] : empRow;
        const empCompanyId = emp?.company_id as number | undefined;
        if (body.roleWeb === 'company_admin' && empCompanyId != null) {
          updates.push('company_id = ?', 'site_id = ?');
          params.push(empCompanyId, null);
        } else if (body.roleWeb === 'tenant_admin' || body.roleWeb === 'super_admin') {
          updates.push('company_id = ?', 'site_id = ?');
          params.push(null, null);
        }
      }
      if (body.roleMobile !== undefined) updates.push('role_mobile = ?'), params.push(body.roleMobile ?? null);
      if (updates.length > 0) {
        params.push(Math.floor(Date.now() / 1000), userId);
        await query(`UPDATE user_account SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`, params);
      }
      res.json({ ok: true, userId: String(userId) });
      return;
    }

    // No user linked: create user account and link (email + password required)
    if (!body.email || !body.password) {
      res.status(400).json({ message: 'No user linked to this employee. Provide email and password to create an account.' });
      return;
    }
    const [emp] = await query<Row[]>(`SELECT company_id FROM employee WHERE id = ? LIMIT 1`, [employeeId]);
    const empRow = Array.isArray(emp) ? emp[0] : emp;
    if (!empRow) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }
    const tenantId = req.jwt!.tenantId;
    const companyId = empRow.company_id as number;
    const email = String(body.email).trim().toLowerCase();
    const [existing] = await query<Row[]>(`SELECT id FROM user_account WHERE tenant_id = ? AND email = ? LIMIT 1`, [tenantId, email]);
    if (Array.isArray(existing) ? existing[0] : existing) {
      res.status(400).json({ message: 'Email already registered for this tenant' });
      return;
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const now = Math.floor(Date.now() / 1000);
    const roleWeb = body.roleWeb ?? 'employee';
    const roleMobile = body.roleMobile ?? null;
    await query(
      `INSERT INTO user_account (tenant_id, email, password_hash, status, role, role_mobile, company_id, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)`,
      [tenantId, email, passwordHash, roleWeb, roleMobile, companyId, now, now]
    );
    const [inserted] = await query<Row[]>(`SELECT id FROM user_account WHERE tenant_id = ? AND email = ? LIMIT 1`, [tenantId, email]);
    const newUser = Array.isArray(inserted) ? inserted[0] : inserted;
    const newUserId = (newUser?.id as number)!;
    await query(
      `INSERT INTO employee_user_map (employee_id, user_id, is_primary, status, created_at, updated_at) VALUES (?, ?, 1, 'active', ?, ?)`,
      [employeeId, newUserId, now, now]
    );
    res.json({ ok: true, userId: String(newUserId) });
  } catch (err) {
    console.error('Assignments roles error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Replace zone assignments (multiple zones + optional no_location)
router.put('/:id/assignments/zones', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const employeeId = Number(req.params.id);
    if (Number.isNaN(employeeId)) {
      res.status(400).json({ message: 'Invalid employee id' });
      return;
    }
    const body = req.body as { zoneIds?: (number | string)[]; noLocation?: boolean };
    const rawIds = Array.isArray(body.zoneIds) ? body.zoneIds : [];
    const zoneIds = rawIds.map((id) => (typeof id === 'string' ? Number(id) : id)).filter((id) => !Number.isNaN(id));
    const noLocation = Boolean(body.noLocation);
    const now = Math.floor(Date.now() / 1000);

    await query(
      `UPDATE employee_zone_assignment SET status = 'inactive', updated_at = ? WHERE employee_id = ?`,
      [now, employeeId]
    );

    for (const zoneId of zoneIds) {
      await query(
        `INSERT INTO employee_zone_assignment (employee_id, zone_id, no_location, status, created_at, updated_at)
         VALUES (?, ?, 0, 'active', ?, ?)`,
        [employeeId, zoneId, now, now]
      );
    }
    if (noLocation) {
      await query(
        `INSERT INTO employee_zone_assignment (employee_id, zone_id, no_location, status, created_at, updated_at)
         VALUES (?, NULL, 1, 'active', ?, ?)`,
        [employeeId, now, now]
      );
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Assignments zones error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

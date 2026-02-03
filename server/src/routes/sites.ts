import { Router, Response } from 'express';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Row } from '../config/db.js';

const router = Router();

function scopeWhere(jwt: AuthRequest['jwt']): { sql: string; params: unknown[] } {
  const tenantId = jwt!.tenantId;
  const companyId = jwt!.companyId != null ? Number(jwt!.companyId) : null;
  const siteId = jwt!.siteId != null ? Number(jwt!.siteId) : null;
  
  // If user is assigned to a specific site, scope to that site only
  if (siteId != null) {
    return { sql: 's.id = ?', params: [siteId] };
  }
  
  // If user is assigned to a specific company, scope to that company's sites
  // This applies regardless of role
  if (companyId != null) {
    return { sql: 's.company_id = ?', params: [companyId] };
  }
  
  // Only super_admin and tenant_admin WITHOUT a companyId see all sites in tenant
  if (jwt!.role === 'super_admin' || jwt!.role === 'tenant_admin') {
    return {
      sql: 's.company_id IN (SELECT id FROM company WHERE tenant_id = ?)',
      params: [tenantId],
    };
  }
  
  // Default: no access
  return { sql: '1 = 0', params: [] };
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sql: scopeSql, params: scopeParams } = scopeWhere(req.jwt!);
    const rows = await query<Row[]>(
      `SELECT s.id, s.company_id, s.site_code, s.name, s.description, s.timezone, s.status, c.name AS company_name
       FROM site s
       INNER JOIN company c ON c.id = s.company_id
       WHERE ${scopeSql} AND s.status = 'active'
       ORDER BY c.name, s.name`,
      scopeParams
    );
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    res.json({
      data: list.map((r) => ({
        id: String(r.id),
        companyId: String(r.company_id),
        companyName: r.company_name,
        siteCode: r.site_code,
        name: r.name,
        description: r.description ?? '',
        timezone: r.timezone ?? '',
        status: r.status,
      })),
    });
  } catch (err) {
    console.error('Sites list error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    const companyId = jwt.companyId != null ? Number(jwt.companyId) : null;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const body = req.body as { companyId: string; siteCode: string; name: string; description?: string; timezone?: string };
    const { companyId: bodyCompanyId, siteCode, name, description, timezone } = body;
    if (!bodyCompanyId || !siteCode || !name) {
      res.status(400).json({ message: 'companyId, siteCode, and name are required' });
      return;
    }
    const cid = Number(bodyCompanyId);
    if (companyId != null && cid !== companyId) {
      res.status(403).json({ message: 'Cannot create site for another company' });
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    await query(
      `INSERT INTO site (company_id, site_code, name, description, timezone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
      [cid, String(siteCode).trim(), String(name).trim(), description ?? null, timezone ?? null, now, now]
    );
    const [inserted] = await query<Row[]>(
      `SELECT id, site_code, name FROM site WHERE company_id = ? AND site_code = ? LIMIT 1`,
      [cid, String(siteCode).trim()]
    );
    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    res.status(201).json({ id: String(row?.id), siteCode: row?.site_code, name: row?.name });
  } catch (err) {
    console.error('Site create error:', err);
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
      res.status(400).json({ message: 'Invalid site id' });
      return;
    }
    const body = req.body as { siteCode?: string; name?: string; description?: string; timezone?: string; status?: string };
    const updates: string[] = [];
    const params: unknown[] = [];
    if (body.siteCode != null) {
      updates.push('site_code = ?');
      params.push(String(body.siteCode).trim());
    }
    if (body.name != null) {
      updates.push('name = ?');
      params.push(String(body.name).trim());
    }
    if (body.description !== undefined) updates.push('description = ?'), params.push(body.description || null);
    if (body.timezone !== undefined) updates.push('timezone = ?'), params.push(body.timezone || null);
    if (body.status != null) {
      updates.push('status = ?');
      params.push(String(body.status));
    }
    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    params.push(Math.floor(Date.now() / 1000), id);
    await query(
      `UPDATE site SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
      params
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Site update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

import { Router, Response } from 'express';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Row } from '../config/db.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.jwt!.tenantId;
    const companyId = req.jwt!.companyId != null ? Number(req.jwt!.companyId) : null;

    // company_admin and site_admin (with company) see only their assigned company
    const whereClause = companyId != null
      ? 'tenant_id = ? AND id = ?'
      : 'tenant_id = ?';
    const whereParams = companyId != null ? [tenantId, companyId] : [tenantId];

    const rows = await query<Row[]>(
      `SELECT id, company_code, name, status, timezone
       FROM company WHERE ${whereClause}
       ORDER BY name`,
      whereParams
    );
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];

    // Get tenant's max_companies limit and current count
    const [tenantRow] = await query<Row[]>(
      'SELECT max_companies FROM tenant WHERE id = ? LIMIT 1',
      [tenantId]
    );
    const tenant = Array.isArray(tenantRow) ? tenantRow[0] : tenantRow;
    const maxCompanies = tenant?.max_companies != null ? Number(tenant.max_companies) : null;

    res.json({
      data: list.map((r) => ({
        id: String(r.id),
        companyCode: r.company_code,
        name: r.name,
        status: r.status,
        timezone: r.timezone,
      })),
      maxCompanies: maxCompanies,
      currentCount: list.length,
    });
  } catch (err) {
    console.error('Companies list error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    // Only tenant_admin and super_admin can create companies
    if (jwt.role !== 'tenant_admin' && jwt.role !== 'super_admin') {
      res.status(403).json({ message: 'Forbidden: Only organization admins can create companies' });
      return;
    }

    const body = req.body as { companyCode?: string; name?: string; timezone?: string };
    const { companyCode, name, timezone = 'UTC' } = body;

    if (!companyCode || !name) {
      res.status(400).json({ message: 'companyCode and name are required' });
      return;
    }

    const codeRegex = /^[a-zA-Z0-9_-]+$/;
    if (!codeRegex.test(companyCode)) {
      res.status(400).json({ message: 'Company code can only contain letters, numbers, hyphens, and underscores' });
      return;
    }

    const tenantId = jwt.tenantId;
    const normalizedCode = companyCode.trim().toLowerCase();

    // Check max_companies limit
    const [tenantRow] = await query<Row[]>(
      'SELECT max_companies FROM tenant WHERE id = ? LIMIT 1',
      [tenantId]
    );
    const tenant = Array.isArray(tenantRow) ? tenantRow[0] : tenantRow;
    const maxCompanies = tenant?.max_companies != null ? Number(tenant.max_companies) : null;

    const [countRow] = await query<Row[]>(
      'SELECT COUNT(*) as count FROM company WHERE tenant_id = ?',
      [tenantId]
    );
    const count = Number(Array.isArray(countRow) ? countRow[0]?.count : countRow?.count) || 0;

    if (maxCompanies != null && count >= maxCompanies) {
      res.status(403).json({
        message: `Company limit reached. This organization can have at most ${maxCompanies} companies. Contact your administrator to increase the limit.`,
      });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    await query(
      `INSERT INTO company (tenant_id, company_code, name, status, timezone, created_at, updated_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?)`,
      [tenantId, normalizedCode, name.trim(), timezone, now, now]
    );

    console.log(`✅ New company created: ${name} (${normalizedCode}) in tenant ${tenantId}`);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
    });
  } catch (err: any) {
    console.error('Create company error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Company code already exists in this organization' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'tenant_admin' && jwt.role !== 'super_admin') {
      res.status(403).json({ message: 'Forbidden: Only organization admins can edit companies' });
      return;
    }

    const companyId = Number(req.params.id);
    if (Number.isNaN(companyId)) {
      res.status(400).json({ message: 'Invalid company id' });
      return;
    }

    const body = req.body as { name?: string; timezone?: string; status?: string };
    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.name != null) {
      updates.push('name = ?');
      params.push(String(body.name).trim());
    }
    if (body.timezone != null) {
      updates.push('timezone = ?');
      params.push(String(body.timezone).trim() || 'UTC');
    }
    if (body.status != null && ['active', 'inactive'].includes(body.status)) {
      updates.push('status = ?');
      params.push(body.status);
    }

    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }

    const tenantId = jwt.tenantId;
    const now = Math.floor(Date.now() / 1000);
    updates.push('updated_at = ?');
    params.push(now, companyId, tenantId);

    const result = await query(
      `UPDATE company SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );

    const affected = (result as { affectedRows?: number })?.affectedRows ?? 0;
    if (affected === 0) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    console.log(`✅ Company ${companyId} updated in tenant ${tenantId}`);
    res.json({ success: true, message: 'Company updated successfully' });
  } catch (err) {
    console.error('Update company error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

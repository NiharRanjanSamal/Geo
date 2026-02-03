import { Router, Response } from 'express';
import type { SignOptions } from 'jsonwebtoken';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Row } from '../config/db.js';

const router = Router();

// Get all tenants (super_admin only)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    // Only super_admin can view all tenants
    if (jwt.role !== 'super_admin') {
      res.status(403).json({ message: 'Forbidden: super_admin access required' });
      return;
    }

    const rows = await query<Row[]>(
      `SELECT id, tenant_code, name, status, subscription_tier, max_companies, created_at, updated_at
       FROM tenant
       ORDER BY name`,
      []
    );
    
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    res.json({
      data: list.map((r) => ({
        id: String(r.id),
        tenantCode: r.tenant_code,
        name: r.name,
        status: r.status,
        subscriptionTier: r.subscription_tier,
        maxCompanies: r.max_companies != null ? Number(r.max_companies) : null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error('Tenants list error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get tenant statistics (super_admin only)
router.get('/:id/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    if (jwt.role !== 'super_admin') {
      res.status(403).json({ message: 'Forbidden: super_admin access required' });
      return;
    }

    const tenantId = Number(req.params.id);
    if (Number.isNaN(tenantId)) {
      res.status(400).json({ message: 'Invalid tenant id' });
      return;
    }

    // Get company count
    const [companyRows] = await query<Row[]>(
      'SELECT COUNT(*) as count FROM company WHERE tenant_id = ?',
      [tenantId]
    );
    const companyCount = Array.isArray(companyRows) ? companyRows[0]?.count : companyRows?.count;

    // Get user count
    const [userRows] = await query<Row[]>(
      'SELECT COUNT(*) as count FROM user_account WHERE tenant_id = ?',
      [tenantId]
    );
    const userCount = Array.isArray(userRows) ? userRows[0]?.count : userRows?.count;

    // Get employee count across all companies
    const [empRows] = await query<Row[]>(
      `SELECT COUNT(*) as count FROM employee e
       INNER JOIN company c ON c.id = e.company_id
       WHERE c.tenant_id = ?`,
      [tenantId]
    );
    const employeeCount = Array.isArray(empRows) ? empRows[0]?.count : empRows?.count;

    res.json({
      tenantId: String(tenantId),
      companies: Number(companyCount) || 0,
      users: Number(userCount) || 0,
      employees: Number(employeeCount) || 0,
    });
  } catch (err) {
    console.error('Tenant stats error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new tenant (super_admin only)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    if (jwt.role !== 'super_admin') {
      res.status(403).json({ message: 'Forbidden: super_admin access required' });
      return;
    }

    const body = req.body as {
      tenantCode: string;
      name: string;
      subscriptionTier?: string;
      maxCompanies?: number | null;
    };

    if (!body.tenantCode || !body.name) {
      res.status(400).json({ message: 'tenantCode and name are required' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const subscriptionTier = body.subscriptionTier || 'basic';
    const maxCompanies = body.maxCompanies !== undefined ? body.maxCompanies : null;

    await query(
      `INSERT INTO tenant (tenant_code, name, status, subscription_tier, max_companies, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?, ?, ?)`,
      [body.tenantCode.toLowerCase(), body.name, subscriptionTier, maxCompanies, now, now]
    );

    console.log(`✅ New tenant created by super_admin: ${body.name} (${body.tenantCode})`);

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
    });
  } catch (err: any) {
    console.error('Create tenant error:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Tenant code already exists' });
      return;
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update tenant (super_admin only)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    if (jwt.role !== 'super_admin') {
      res.status(403).json({ message: 'Forbidden: super_admin access required' });
      return;
    }

    const tenantId = Number(req.params.id);
    if (Number.isNaN(tenantId)) {
      res.status(400).json({ message: 'Invalid tenant id' });
      return;
    }

    const body = req.body as {
      name?: string;
      status?: string;
      subscriptionTier?: string;
      maxCompanies?: number | null;
    };

    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.name != null) {
      updates.push('name = ?');
      params.push(body.name);
    }
    if (body.status != null) {
      updates.push('status = ?');
      params.push(body.status);
    }
    if (body.subscriptionTier != null) {
      updates.push('subscription_tier = ?');
      params.push(body.subscriptionTier);
    }
    if (body.maxCompanies !== undefined) {
      updates.push('max_companies = ?');
      params.push(body.maxCompanies);
    }

    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    updates.push('updated_at = ?');
    params.push(now, tenantId);

    await query(
      `UPDATE tenant SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    console.log(`✅ Tenant updated by super_admin: ID ${tenantId}`);

    res.json({
      success: true,
      message: 'Tenant updated successfully',
    });
  } catch (err) {
    console.error('Update tenant error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Switch tenant context (super_admin only) - returns new JWT token
router.post('/switch/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    if (jwt.role !== 'super_admin') {
      res.status(403).json({ message: 'Forbidden: super_admin access required' });
      return;
    }

    const targetTenantId = Number(req.params.id);
    if (Number.isNaN(targetTenantId)) {
      res.status(400).json({ message: 'Invalid tenant id' });
      return;
    }

    // Verify tenant exists
    const [tenantRows] = await query<Row[]>(
      'SELECT id, name FROM tenant WHERE id = ? AND status = "active"',
      [targetTenantId]
    );
    const tenant = Array.isArray(tenantRows) ? tenantRows[0] : tenantRows;
    
    if (!tenant) {
      res.status(404).json({ message: 'Tenant not found or inactive' });
      return;
    }

    // Import jwt here to avoid circular dependencies
    const jwtLib = await import('jsonwebtoken');
    const { env } = await import('../config/env.js');

    // Create new token with switched tenant context
    const newToken = jwtLib.default.sign(
      {
        userId: jwt.userId,
        email: jwt.email,
        role: jwt.role,
        tenantId: targetTenantId,
        // Note: When switching tenants, we don't set companyId/siteId as super_admin
        // will have access to all companies/sites in the target tenant
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn } as SignOptions
    );

    console.log(`✅ super_admin switched to tenant: ${tenant.name} (ID: ${targetTenantId})`);

    res.json({
      success: true,
      token: newToken,
      tenantId: String(targetTenantId),
      tenantName: tenant.name,
      message: `Switched to tenant: ${tenant.name}`,
    });
  } catch (err) {
    console.error('Tenant switch error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

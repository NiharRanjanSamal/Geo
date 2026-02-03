import { Router, Response } from 'express';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Row } from '../config/db.js';

const router = Router();

// Get all pending user registrations
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    // Only admins can view pending users
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    let whereClause = 'u.tenant_id = ?';
    const params: unknown[] = [jwt.tenantId];

    // If user is assigned to a company, only see that company's pending users
    // This applies regardless of role (company_admin, tenant_admin with company, etc.)
    if (jwt.companyId) {
      whereClause += ' AND u.company_id = ?';
      params.push(jwt.companyId);
    }
    // super_admin and tenant_admin without companyId see all pending users in tenant

    const rows = await query<Row[]>(
      `SELECT 
        u.id as user_id,
        u.email,
        u.created_at,
        u.company_id,
        e.id as employee_id,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.display_name,
        e.phone,
        c.name as company_name,
        c.company_code
       FROM user_account u
       JOIN employee_user_map eum ON eum.user_id = u.id AND eum.is_primary = 1
       JOIN employee e ON e.id = eum.employee_id
       JOIN company c ON c.id = u.company_id
       WHERE ${whereClause} AND u.status = 'pending'
       ORDER BY u.created_at DESC`,
      params
    );

    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    
    res.json({
      data: list.map((r) => ({
        userId: String(r.user_id),
        email: r.email,
        createdAt: r.created_at,
        companyId: String(r.company_id),
        companyName: r.company_name,
        companyCode: r.company_code,
        employeeId: String(r.employee_id),
        employeeCode: r.employee_code,
        firstName: r.first_name,
        lastName: r.last_name,
        displayName: r.display_name ?? '',
        phone: r.phone ?? '',
      })),
    });
  } catch (err) {
    console.error('Get pending users error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve a pending user
router.post('/:userId/approve', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    // Only admins can approve users
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const now = Math.floor(Date.now() / 1000);

    // Update user account status to active
    await query(
      `UPDATE user_account 
       SET status = 'active', email_verified = 1, updated_at = ?
       WHERE id = ? AND status = 'pending'`,
      [now, userId]
    );

    // Update employee status to active
    await query(
      `UPDATE employee e
       JOIN employee_user_map eum ON eum.employee_id = e.id
       SET e.status = 'active', e.updated_at = ?
       WHERE eum.user_id = ? AND eum.is_primary = 1 AND e.status = 'pending'`,
      [now, userId]
    );

    res.json({ ok: true, message: 'User approved successfully' });
  } catch (err) {
    console.error('Approve user error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject a pending user (delete their registration)
router.delete('/:userId/reject', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    
    // Only admins can reject users
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const userId = Number(req.params.userId);
    if (Number.isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    // Get employee ID before deleting
    const [mapping] = await query<Row[]>(
      `SELECT employee_id FROM employee_user_map WHERE user_id = ? AND is_primary = 1 LIMIT 1`,
      [userId]
    );
    const employeeId = (Array.isArray(mapping) ? mapping[0] : mapping)?.employee_id as number | undefined;

    // Delete mapping
    await query(
      `DELETE FROM employee_user_map WHERE user_id = ?`,
      [userId]
    );

    // Delete user account
    await query(
      `DELETE FROM user_account WHERE id = ?`,
      [userId]
    );

    // Delete employee
    if (employeeId) {
      await query(
        `DELETE FROM employee WHERE id = ?`,
        [employeeId]
      );
    }

    res.json({ ok: true, message: 'User registration rejected and removed' });
  } catch (err) {
    console.error('Reject user error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

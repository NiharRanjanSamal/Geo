import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { emailService } from '../services/email.service.js';
import type { User, LoginResponse } from '../types/index.js';
import type { Row } from '../config/db.js';

const router = Router();

function buildUser(row: Row): User {
  const firstName = (row.employee_first_name as string) ?? '';
  const lastName = (row.employee_last_name as string) ?? '';
  const name = [firstName, lastName].filter(Boolean).join(' ') || (row.email as string).split('@')[0];
  return {
    id: String(row.id),
    name,
    email: row.email as string,
    employeeId: (row.employee_code as string) ?? '',
    role: (row.role as User['role']) ?? 'employee',
    roleMobile: row.role_mobile != null ? String(row.role_mobile) : undefined,
    companyId: row.company_id != null ? String(row.company_id) : undefined,
    siteId: row.site_id != null ? String(row.site_id) : undefined,
  };
}

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      tenant_name,
      tenant_code,
      company_name,
      company_code,
      admin_email,
      admin_password
    } = req.body as {
      tenant_name?: string;
      tenant_code?: string;
      company_name?: string;
      company_code?: string;
      admin_email?: string;
      admin_password?: string;
    };

    // Validate required fields
    if (!tenant_name || !tenant_code || !company_name || !company_code || !admin_email || !admin_password) {
      res.status(400).json({ 
        message: 'All fields are required: tenant_name, tenant_code, company_name, company_code, admin_email, admin_password' 
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Validate password length
    if (admin_password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    // Validate codes format (alphanumeric, hyphens, underscores only)
    const codeRegex = /^[a-zA-Z0-9_-]+$/;
    if (!codeRegex.test(tenant_code)) {
      res.status(400).json({ message: 'Tenant code can only contain letters, numbers, hyphens, and underscores' });
      return;
    }
    if (!codeRegex.test(company_code)) {
      res.status(400).json({ message: 'Company code can only contain letters, numbers, hyphens, and underscores' });
      return;
    }

    const normalizedTenantCode = tenant_code.trim().toLowerCase();
    const normalizedCompanyCode = company_code.trim().toLowerCase();
    const normalizedEmail = admin_email.trim().toLowerCase();
    const now = Math.floor(Date.now() / 1000);

    // Check if tenant code already exists
    const existingTenantRows = await query<Row[]>(
      `SELECT id FROM tenant WHERE tenant_code = ? LIMIT 1`,
      [normalizedTenantCode]
    );
    const existingTenant = Array.isArray(existingTenantRows) ? existingTenantRows[0] : existingTenantRows;
    
    if (existingTenant) {
      res.status(409).json({ message: 'Organization code already exists. Please choose a different code.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(admin_password, 10);

    // Create tenant
    const tenantResult = await query(
      `INSERT INTO tenant (tenant_code, name, status, subscription_tier, created_at, updated_at)
       VALUES (?, ?, 'active', 'basic', ?, ?)`,
      [normalizedTenantCode, tenant_name.trim(), now, now]
    );

    // Get the created tenant ID
    const tenantIdResult = tenantResult as { insertId: number };
    const tenantId = tenantIdResult.insertId;

    // Create company
    const companyResult = await query(
      `INSERT INTO company (tenant_id, company_code, name, status, timezone, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'UTC', ?, ?)`,
      [tenantId, normalizedCompanyCode, company_name.trim(), now, now]
    );

    // Get the created company ID
    const companyIdResult = companyResult as { insertId: number };
    const companyId = companyIdResult.insertId;

    // Create tenant admin user account (organization admin, NOT super_admin)
    // Note: Only existing super_admin can create other super_admin accounts
    await query(
      `INSERT INTO user_account (tenant_id, email, password_hash, status, role, company_id, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'tenant_admin', ?, ?, ?)`,
      [tenantId, normalizedEmail, passwordHash, companyId, now, now]
    );

    console.log(`✅ New organization created: ${tenant_name} (${normalizedTenantCode})`);
    console.log(`   Company: ${company_name} (${normalizedCompanyCode})`);
    console.log(`   Admin: ${normalizedEmail}`);

    res.status(201).json({
      success: true,
      message: 'Organization created successfully! You can now sign in with your admin account.'
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    
    // Handle duplicate key errors
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('tenant_code')) {
        res.status(409).json({ message: 'Organization code already exists' });
      } else if (err.message.includes('company_code')) {
        res.status(409).json({ message: 'Company code already exists' });
      } else if (err.message.includes('email')) {
        res.status(409).json({ message: 'Email already registered' });
      } else {
        res.status(409).json({ message: 'Duplicate entry found' });
      }
      return;
    }
    
    res.status(500).json({ message: 'Internal server error during signup' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, tenant_code: tenantCode } = req.body as {
      email?: string;
      password?: string;
      tenant_code?: string;
    };
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    let tenantId: number | null = null;
    if (tenantCode && String(tenantCode).trim()) {
      const tenantRows = await query<Row[]>(
        `SELECT id FROM tenant WHERE tenant_code = ? AND status = 'active' LIMIT 1`,
        [String(tenantCode).trim().toLowerCase()]
      );
      const tenantRow = Array.isArray(tenantRows) ? tenantRows[0] : tenantRows;
      tenantId = tenantRow ? (tenantRow.id as number) : null;
    }

    const whereClause = tenantId != null
      ? 'u.email = ? AND u.tenant_id = ? AND u.status = ?'
      : 'u.email = ? AND u.status = ?';
    const whereParams = tenantId != null
      ? [normalizedEmail, tenantId, 'active']
      : [normalizedEmail, 'active'];

    const rows = await query<Row[]>(
      `SELECT u.id, u.email, u.password_hash, u.role, u.role_mobile, u.tenant_id, u.company_id, u.site_id,
              e.id AS employee_id, e.employee_code, e.first_name AS employee_first_name, e.last_name AS employee_last_name
       FROM user_account u
       LEFT JOIN employee_user_map eum ON eum.user_id = u.id AND eum.is_primary = 1 AND eum.status = 'active'
       LEFT JOIN employee e ON e.id = eum.employee_id
       WHERE ${whereClause}
       LIMIT 1`,
      whereParams
    );

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row || !(await bcrypt.compare(password, row.password_hash as string))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const user = buildUser(row);
    const token = jwt.sign(
      {
        userId: row.id,
        email: row.email,
        role: row.role,
        tenantId: row.tenant_id,
        companyId: row.company_id ?? undefined,
        siteId: row.site_id ?? undefined,
        employeeId: row.employee_id ?? undefined,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn } as jwt.SignOptions
    );

    const response: LoginResponse = { token, user };
    res.json(response);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      phone, 
      employeeCode, 
      companyCode,
      displayName 
    } = req.body as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      employeeCode?: string;
      companyCode?: string;
      displayName?: string;
    };

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone || !employeeCode || !companyCode) {
      res.status(400).json({ 
        message: 'Email, password, first name, last name, phone, employee code, and company code are required' 
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCompanyCode = companyCode.trim().toUpperCase();
    const normalizedEmployeeCode = employeeCode.trim();

    // Check if company exists
    const companyRows = await query<Row[]>(
      `SELECT c.id, c.tenant_id FROM company c WHERE c.company_code = ? AND c.status = 'active' LIMIT 1`,
      [normalizedCompanyCode]
    );
    const company = Array.isArray(companyRows) ? companyRows[0] : companyRows;
    
    if (!company) {
      res.status(404).json({ message: 'Company code not found. Please check with your administrator.' });
      return;
    }

    const companyId = company.id as number;
    const tenantId = company.tenant_id as number;

    // Check if email already exists for this tenant
    const existingUserRows = await query<Row[]>(
      `SELECT id FROM user_account WHERE tenant_id = ? AND email = ? LIMIT 1`,
      [tenantId, normalizedEmail]
    );
    const existingUser = Array.isArray(existingUserRows) ? existingUserRows[0] : existingUserRows;
    
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered. Please login or use a different email.' });
      return;
    }

    // Check if employee code already exists for this company
    const existingEmpRows = await query<Row[]>(
      `SELECT id FROM employee WHERE company_id = ? AND employee_code = ? LIMIT 1`,
      [companyId, normalizedEmployeeCode]
    );
    const existingEmp = Array.isArray(existingEmpRows) ? existingEmpRows[0] : existingEmpRows;
    
    if (existingEmp) {
      res.status(409).json({ message: 'Employee code already exists. Please choose a different code.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const now = Math.floor(Date.now() / 1000);

    // Generate email verification token (simple random string for now)
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const verificationExpiresAt = now + (24 * 60 * 60); // 24 hours from now

    // Create employee record with pending status
    await query(
      `INSERT INTO employee (company_id, employee_code, first_name, last_name, display_name, email, phone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        companyId,
        normalizedEmployeeCode,
        firstName.trim(),
        lastName.trim(),
        displayName?.trim() ?? null,
        normalizedEmail,
        phone.trim(),
        now,
        now
      ]
    );

    // Get the created employee ID
    const createdEmpRows = await query<Row[]>(
      `SELECT id FROM employee WHERE company_id = ? AND employee_code = ? LIMIT 1`,
      [companyId, normalizedEmployeeCode]
    );
    const createdEmp = Array.isArray(createdEmpRows) ? createdEmpRows[0] : createdEmpRows;
    const employeeId = createdEmp?.id as number;

    // Create user account with pending status and email verification token
    // Note: If email_verification_token column doesn't exist (migration not run), this will fail gracefully
    try {
      await query(
        `INSERT INTO user_account (tenant_id, email, password_hash, email_verified, email_verification_token, email_verification_expires_at, status, role, company_id, created_at, updated_at)
         VALUES (?, ?, ?, 0, ?, ?, 'pending', 'employee', ?, ?, ?)`,
        [tenantId, normalizedEmail, passwordHash, verificationToken, verificationExpiresAt, companyId, now, now]
      );
    } catch (emailVerifyError) {
      // Fallback if email verification columns don't exist (migration not run)
      console.warn('Email verification columns not found, creating user without verification token');
      await query(
        `INSERT INTO user_account (tenant_id, email, password_hash, status, role, company_id, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', 'employee', ?, ?, ?)`,
        [tenantId, normalizedEmail, passwordHash, companyId, now, now]
      );
    }

    // Get the created user ID
    const createdUserRows = await query<Row[]>(
      `SELECT id FROM user_account WHERE tenant_id = ? AND email = ? LIMIT 1`,
      [tenantId, normalizedEmail]
    );
    const createdUser = Array.isArray(createdUserRows) ? createdUserRows[0] : createdUserRows;
    const userId = createdUser?.id as number;

    // Link employee to user account
    await query(
      `INSERT INTO employee_user_map (employee_id, user_id, is_primary, status, created_at, updated_at)
       VALUES (?, ?, 1, 'active', ?, ?)`,
      [employeeId, userId, now, now]
    );

    // In a production app, you would send an email with the verification token here
    // For now, we'll just log it
    console.log(`Email verification token for ${normalizedEmail}: ${verificationToken}`);
    console.log(`New registration pending approval - Employee: ${firstName} ${lastName} (${normalizedEmployeeCode})`);

    res.status(201).json({
      message: 'Registration successful! Your account is pending approval. You will receive an email once approved.',
      emailVerificationRequired: true
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body as { email?: string };
    
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const rows = await query<Row[]>(
      `SELECT u.id, u.email FROM user_account u WHERE u.email = ? AND u.status = 'active' LIMIT 1`,
      [normalizedEmail]
    );

    const user = Array.isArray(rows) ? rows[0] : rows;
    
    // For security, always return success even if user doesn't exist
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      res.json({ 
        ok: true, 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
      return;
    }

    // Generate a secure reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Math.floor(Date.now() / 1000) + (30 * 60); // 30 minutes from now
    const now = Math.floor(Date.now() / 1000);

    // Store token hash (for security, we don't store the plain token)
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    await query(
      `UPDATE user_account 
       SET email_verification_token = ?, email_verification_expires_at = ?, updated_at = ?
       WHERE id = ?`,
      [tokenHash, expiresAt, now, user.id]
    );

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send email with reset link
    const emailSent = await emailService.sendPasswordResetEmail(normalizedEmail, resetToken, resetUrl);

    if (emailSent) {
      console.log(`✅ Password reset email sent to: ${normalizedEmail}`);
    } else {
      console.log(`⚠️  Password reset link generated for: ${normalizedEmail}`);
      console.log(`Reset URL: ${resetUrl}`);
    }

    res.json({ 
      ok: true, 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, token, newPassword } = req.body as { 
      email?: string; 
      token?: string; 
      newPassword?: string; 
    };
    
    if (!email || !token || !newPassword) {
      res.status(400).json({ message: 'Email, token, and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = Math.floor(Date.now() / 1000);

    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Find user with matching token hash
    const rows = await query<Row[]>(
      `SELECT u.id, u.email, u.email_verification_token, u.email_verification_expires_at 
       FROM user_account u 
       WHERE u.email = ? AND u.email_verification_token = ? AND u.email_verification_expires_at > ? AND u.status = 'active'
       LIMIT 1`,
      [normalizedEmail, tokenHash, now]
    );

    const user = Array.isArray(rows) ? rows[0] : rows;
    
    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear token
    await query(
      `UPDATE user_account 
       SET password_hash = ?, email_verification_token = NULL, email_verification_expires_at = NULL, updated_at = ?
       WHERE id = ?`,
      [passwordHash, now, user.id]
    );

    console.log(`✅ Password successfully reset for user: ${normalizedEmail}`);

    res.json({ 
      ok: true, 
      message: 'Password reset successful. You can now login with your new password.' 
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.jwt!.userId;
    const rows = await query<Row[]>(
      `SELECT u.id, u.email, u.role, u.role_mobile, u.tenant_id, u.company_id, u.site_id,
              e.employee_code, e.first_name AS employee_first_name, e.last_name AS employee_last_name
       FROM user_account u
       LEFT JOIN employee_user_map eum ON eum.user_id = u.id AND eum.is_primary = 1 AND eum.status = 'active'
       LEFT JOIN employee e ON e.id = eum.employee_id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const user = buildUser(row);
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;

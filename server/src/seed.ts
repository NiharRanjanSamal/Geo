/**
 * Seed script: creates schema (if not exists) and inserts demo data.
 * Run: npm run seed
 * Requires: MySQL running, .env with MYSQL_* and database created.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise.js';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from './config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const conn = await mysql.createConnection({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
    database: env.mysql.database,
    multipleStatements: true,
  });

  try {
    const schemaPath = join(__dirname, '..', 'schema', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await conn.query(schema);
    console.log('Schema applied.');

    const [tenants] = await conn.query('SELECT id FROM tenant LIMIT 1');
    if (Array.isArray(tenants) && tenants.length > 0) {
      console.log('Data already exists. Skip seed.');
      return;
    }

    const passwordHash = await bcrypt.hash('admin123', 10);
    const now = Math.floor(Date.now() / 1000);

    await conn.query(
      `INSERT INTO tenant (tenant_code, name, status, subscription_tier, created_at, updated_at)
       VALUES ('T001', 'Demo Tenant', 'active', 'standard', ?, ?)`,
      [now, now]
    );
    const [[tenantRow]] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM tenant WHERE tenant_code = ?',
      ['T001']
    );
    const tenantId = tenantRow.id;

    await conn.query(
      `INSERT INTO company (tenant_id, company_code, name, status, timezone, created_at, updated_at)
       VALUES (?, 'C001', 'Demo Company', 'active', 'Asia/Kolkata', ?, ?)`,
      [tenantId, now, now]
    );
    const [[companyRow]] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM company WHERE company_code = ? AND tenant_id = ?',
      ['C001', tenantId]
    );
    const companyId = companyRow.id;

    await conn.query(
      `INSERT INTO site (company_id, site_code, name, status, created_at, updated_at)
       VALUES (?, 'S001', 'Main Office', 'active', ?, ?)`,
      [companyId, now, now]
    );
    const [[siteRow]] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM site WHERE site_code = ? AND company_id = ?',
      ['S001', companyId]
    );
    const siteId = siteRow.id;

    await conn.query(
      `INSERT INTO user_account (tenant_id, email, password_hash, status, role, company_id, site_id, created_at, updated_at)
       VALUES (?, 'admin@demo.com', ?, 'active', 'company_admin', ?, ?, ?, ?)`,
      [tenantId, passwordHash, companyId, siteId, now, now]
    );
    const [[userRow]] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM user_account WHERE email = ?',
      ['admin@demo.com']
    );
    const userId = userRow.id;

    await conn.query(
      `INSERT INTO employee (company_id, employee_code, first_name, last_name, email, status, created_at, updated_at)
       VALUES (?, 'EMP001', 'Admin', 'User', 'admin@demo.com', 'active', ?, ?)`,
      [companyId, now, now]
    );
    const [[empRow]] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM employee WHERE employee_code = ? AND company_id = ?',
      ['EMP001', companyId]
    );
    const employeeId = empRow.id;

    await conn.query(
      `INSERT INTO employee_user_map (employee_id, user_id, is_primary, status, created_at, updated_at)
       VALUES (?, ?, 1, 'active', ?, ?)`,
      [employeeId, userId, now, now]
    );

    await conn.query(
      `INSERT INTO employee (company_id, employee_code, first_name, last_name, status, created_at, updated_at)
       VALUES (?, 'EMP002', 'Jane', 'Doe', 'active', ?, ?), (?, 'EMP003', 'John', 'Smith', 'active', ?, ?)`,
      [companyId, now, now, companyId, now, now]
    );
    const [empRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM employee WHERE company_id = ? AND employee_code IN (?, ?) ORDER BY employee_code',
      [companyId, 'EMP002', 'EMP003']
    );
    const empList = empRows as mysql.RowDataPacket[];
    const emp2Id = empList[0]?.id;
    const emp3Id = empList[1]?.id;
    if (!emp2Id || !emp3Id) throw new Error('Failed to get employee ids');

    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const dateInt = y * 10000 + m * 100 + d;
    const nineAm = Math.floor(new Date(y, m - 1, d, 9, 0, 0).getTime() / 1000);
    const sixPm = Math.floor(new Date(y, m - 1, d, 18, 0, 0).getTime() / 1000);

    await conn.query(
      `INSERT INTO attendance_day (employee_id, site_id, attendance_date, first_in_time, last_out_time, total_work_seconds, session_count, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 32400, 1, 'present', ?, ?),
              (?, ?, ?, ?, ?, 32400, 1, 'present', ?, ?),
              (?, ?, ?, ?, ?, 32400, 1, 'present', ?, ?)`,
      [employeeId, siteId, dateInt, nineAm, sixPm, now, now, emp2Id, siteId, dateInt, nineAm, sixPm, now, now, emp3Id, siteId, dateInt, nineAm, sixPm, now, now]
    );

    console.log('Seed done.');
    console.log('Login: admin@demo.com / admin123');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

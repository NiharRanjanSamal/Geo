import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/auth.js';
import attendanceRoutes from './routes/attendance.js';
import companiesRoutes from './routes/companies.js';
import sitesRoutes from './routes/sites.js';
import zonesRoutes from './routes/zones.js';
import employeesRoutes from './routes/employees.js';
import employeeRoutes from './routes/employee.js';
import pendingUsersRoutes from './routes/pending-users.js';
import tenantsRoutes from './routes/tenants.js';

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/pending-users', pendingUsersRoutes);
app.use('/api/tenants', tenantsRoutes);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(env.port, () => {
  console.log(`Server running at http://localhost:${env.port}`);
});

# Attendance API (Node.js + Express + TypeScript + MySQL)

Backend for the attendance mobile app and web admin dashboard.

## Prerequisites

- Node.js 18+
- MySQL 8+ (or MariaDB)

## Setup

1. **Create MySQL database**

   ```sql
   CREATE DATABASE attendance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Install dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Environment**

   Copy `.env.example` to `.env` and set:

   - `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
   - `JWT_SECRET` (use a long random string in production)
   - `PORT` (default 3000)

4. **Schema and seed**

   ```bash
   npm run seed
   ```

   This applies `schema/schema.sql` and inserts demo data.

   **Optional (for web admin: sites, zones, employee assignments):**  
   Run the zones migration once to add `site_zone`, `employee_zone_assignment`, and `role_mobile` on `user_account`:

   **Bash / Cmd:**
   ```bash
   mysql -u root -p attendance_db < schema/schema-migration-zones.sql
   ```

   **PowerShell** (use one of these; `<` is not supported for redirection in PowerShell):
   ```powershell
   cmd /c "mysql -u root -p attendance_db < schema/schema-migration-zones.sql"
   ```
   or
   ```powershell
   Get-Content .\schema\schema-migration-zones.sql -Raw | mysql -u root -p attendance_db
   ```

   If `role_mobile` column already exists, the ALTER will fail; you can skip it or add the column manually.

   **Optional (for mobile app self-registration with email verification):**
   Run the email verification migration to add verification columns:

   **Bash / Cmd:**
   ```bash
   mysql -u root -p attendance_db < schema/schema-migration-email-verification.sql
   ```

   **PowerShell:**
   ```powershell
   cmd /c "mysql -u root -p attendance_db < schema/schema-migration-email-verification.sql"
   ```
   or
   ```powershell
   Get-Content .\schema\schema-migration-email-verification.sql -Raw | mysql -u root -p attendance_db
   ```
   - Tenant, company, site
   - User: **admin@demo.com** / **admin123** (role: company_admin)
   - Employees EMP001, EMP002, EMP003
   - Sample attendance for today

## Run

```bash
 npm run dev
```

Server runs at http://localhost:3000.

## API

- **POST /api/auth/login**  
  Body: `{ "email": "admin@demo.com", "password": "admin123" }`  
  Response: `{ "token": "...", "user": { "id", "name", "email", "employeeId", "role", ... } }`

- **POST /api/auth/register** (mobile app self-registration)  
  Body: `{ "email", "password", "firstName", "lastName", "phone", "employeeCode", "companyCode", "displayName?" }`  
  Response: `{ "message": "Registration successful! Your account is pending approval...", "emailVerificationRequired": true }`  
  Note: Account is created with status 'pending' and requires admin approval

- **GET /api/auth/me**  
  Header: `Authorization: Bearer <token>`  
  Response: user object

- **GET /api/attendance/report?date=YYYY-MM-DD**  
  Header: `Authorization: Bearer <token>`  
  Query: `date` (optional), `siteId`, `limit`, `offset`  
  Response: `{ "data": [ { "employeeId", "employeeCode", "employeeName", "siteId", "siteName", "date", "checkInTime", "checkOutTime", "totalMinutes", "status" }, ... ] }`

- **POST /api/attendance/mark** (mobile app check-in/out)  
  Header: `Authorization: Bearer <token>`  
  Body: `{ "zoneId", "siteId", "type": "IN" | "OUT", "latitude", "longitude", "accuracy", "timestamp" }`  
  The JWT must include `employeeId` (set at login for users linked to an employee). Response: `{ "ok": true }`.

Report is scoped by user role: `company_admin` sees all company data, `site_admin` sees only their site(s).

## Build

```bash
npm run build
npm start
```

## Web app

Point the web app at this API (e.g. Vite proxy to `http://localhost:3000` or set `VITE_API_URL=http://localhost:3000`). Log in with **admin@demo.com** / **admin123** to see the attendance report.

## Mobile app: marking attendance

To mark attendance from the mobile app (e.g. employee Ram Kishan with zone CH_Canteen):

1. **Create employee and assign zones in the web app** — Add the employee, create a user (email + password), assign one or more attendance zones (e.g. CH_Canteen for Main Office). In the Expo app, set the API base URL (e.g. your machine’s IP when testing on device: `http://192.168.x.x:3000/api`).
2. **Point the mobile app at this API** — In the Expo app set the API base URL to this server (e.g. `http://192.168.x.x:3000/api` on a physical device). See `constants/api.ts` and use your machine IP.
3. **Log in on the mobile app** — Use the same email and password you set for that employee in the web app. The app calls **POST /api/auth/login** and receives a JWT with `employeeId`.
4. **Open the dashboard and allow location** — The app loads only sites and zones assigned to that employee via **GET /api/employee/sites** and **GET /api/employee/sites/:siteId/zones**.
5. **Be inside the assigned zone and tap Check In / Check Out** — Go physically within the zone. Tap the main button to Check In or Check Out. The app calls **POST /api/attendance/mark**; the record is stored in MySQL and appears in the web Dashboard report.

# Deploy Backend to cPanel

This guide walks you through deploying the Node.js/Express backend to cPanel hosting.

## Prerequisites

- **cPanel with Node.js support** — Your host must offer Node.js (look for "Setup Node.js App", "Node.js Selector", or "Application Manager" in cPanel).
- **MySQL database** — cPanel usually includes MySQL. Create one in cPanel → MySQL Databases.

---

## Step 1: Changes Before Deployment

### 1. Build locally (recommended)

Build the project on your machine before uploading so the server doesn't need TypeScript:

```bash
cd server
npm install
npm run build
```

This creates the `dist/` folder with compiled JavaScript.

### 2. Prepare environment variables

Create a `.env` file for production (do not commit this). Use the template below and fill in your values.

---

## Step 2: Create MySQL Database in cPanel

1. Go to **cPanel → MySQL Databases**.
2. Create a new database (e.g. `zenuser_attendance`).
3. Create a MySQL user with a strong password.
4. Add the user to the database with **ALL PRIVILEGES**.
5. Note the details — cPanel often prefixes usernames and database names (e.g. `zenuser_attendance`, `zenuser_dbuser`).
6. Run the schema to create tables:
   - Go to **phpMyAdmin** (cPanel → phpMyAdmin).
   - Select your database.
   - Import `schema/schema.sql` (and any migration files in order if needed).

---

## Step 3: What to Upload

Upload these files/folders to your cPanel Node.js application directory:

| Upload | Description |
|--------|-------------|
| `dist/` | Compiled JavaScript (from `npm run build`) |
| `package.json` | Dependencies |
| `package-lock.json` | Lock file |
| `.env` | Production environment variables (create this, see below) |
| `schema/` | Optional — for reference or re-running migrations |

**Do NOT upload:** `src/`, `node_modules/`, `tsconfig.json`, `.env.example`

---

## Step 4: Environment Variables (.env)

Create a `.env` file on the server with these values:

```env
NODE_ENV=production
PORT=3000

# cPanel assigns PORT — some hosts override this. Use their value if provided.

# MySQL (from cPanel MySQL Databases)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=zenuser_dbuser
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=zenuser_attendance

# JWT — generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_strong_random_secret_here

# Frontend URL (for password reset links and CORS)
FRONTEND_URL=https://attendance.zenuino.in

# CORS — comma-separated origins (optional; omit to allow all)
CORS_ORIGIN=https://attendance.zenuino.in,https://elina.attendance.zenuino.in

# Email (optional — for password reset)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password
# EMAIL_FROM=GeoAttend <your-email@gmail.com>
```

**Notes:**
- Replace `zenuser_` with your cPanel username prefix.
- If cPanel provides a different MySQL host (e.g. `localhost:/tmp/mysql.sock`), use that for `MYSQL_HOST`.
- `PORT` is often set by cPanel — check the Node.js app settings.

---

## Step 5: cPanel Node.js App Setup

1. In cPanel, open **Setup Node.js App** or **Application Manager**.
2. Click **Create Application**.
3. Configure:
   - **Node.js version:** 18 or 20.
   - **Application root:** e.g. `api.attendance.zenuino.in` or `backend`.
   - **Application URL:** e.g. `api.attendance.zenuino.in` or your API subdomain.
   - **Application startup file:** `dist/index.js` (not `src/index.ts`).
4. Set environment variables in the cPanel UI if it supports them (or rely on `.env`).
5. Run:
   ```
   npm install --production
   ```
   (Or `npm install` if you skipped the local build.)
6. Click **Start** or **Restart** the application.

---

## Step 6: Single Domain (No API Subdomain)

To use `api.attendance.zenuino.in`:

1. In cPanel → **Subdomains**, create `api.attendance.zenuino.in`.
2. Point its document root to your Node.js app directory, **or**
3. Use the reverse proxy from cPanel’s Node.js setup so the subdomain forwards to your app.

Exact steps depend on your host — check their Node.js docs.

---

## Step 7: Verify

1. Visit `https://attendance.zenuino.in/api/health` — should return `{"ok":true}`.
2. Update the web app’s `VITE_API_URL` to `https://api.attendance.zenuino.in`.
3. Test login and other API calls from the web admin.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App won’t start | Check error logs in cPanel. Ensure `dist/index.js` exists and `PORT` matches cPanel’s value. |
| MySQL connection refused | Verify `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`. Use cPanel’s exact names. |
| CORS errors | Add your frontend URL to `CORS_ORIGIN` in `.env` and restart the app. |
| 502 Bad Gateway | Node.js app may have crashed. Check cPanel logs and that the app is running. |
| No Node.js in cPanel | Use Railway, Render, or another Node.js host for the API instead. |

---

## Alternative: Host Without Node.js Support

If your cPanel does not support Node.js, host the API elsewhere (e.g. Railway, Render, Fly.io) and point `api.attendance.zenuino.in` to that service via DNS CNAME. Keep the web admin on cPanel.

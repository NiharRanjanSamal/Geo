# Single Domain Setup: Frontend + Backend on attendance.zenuino.in

Use this guide when you have only one subdomain and need both web app and API on it.

---

## Architecture

| URL | Serves |
|-----|--------|
| `attendance.zenuino.in` | Frontend (web admin) |
| `attendance.zenuino.in/api` | Backend (Node.js API) |

---

## Step 1: Backend (attendance-server)

1. Ensure Node.js app is running in `attendance-server` via cPanel Setup Node.js App.
2. Note the **port** cPanel assigns (e.g. 3000).
3. Backend `.env` should have:
   - `FRONTEND_URL=https://attendance.zenuino.in`
   - `CORS_ORIGIN=https://attendance.zenuino.in`

---

## Step 2: Frontend Build

The web app is already configured to use same-origin API (`VITE_API_URL` is empty in `.env.production`).

```bash
cd web
npm run build
```

---

## Step 3: Upload Frontend

Upload contents of `web/dist/` to your document root (where attendance.zenuino.in points):

- `index.html`
- `assets/` folder
- `.htaccess` (included in build from `web/public/.htaccess`)

---

## Step 4: Configure .htaccess Proxy

The `.htaccess` in `web/public/` proxies `/api` to your Node.js app. **Replace 3000** with the port from cPanel Node.js App:

```apache
RewriteRule ^api/(.*)$ http://127.0.0.1:3000/api/$1 [P,L]
```

Edit `.htaccess` in your document root and change `3000` to your actual port if different.

**Note:** The `[P]` flag requires `mod_proxy`. If you get a 500 error, your host may not support it. Contact your host or try using a PHP proxy script instead.

---

## Step 5: Verify

1. `https://attendance.zenuino.in/api/health` → `{"ok":true}`
2. `https://attendance.zenuino.in` → Login page loads
3. Login → Should succeed (API calls go to same origin)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 500 error on /api | mod_proxy may be disabled; check .htaccess or contact host |
| Login still fails | Ensure Node.js app is running; check port in .htaccess |
| CORS error | Add `https://attendance.zenuino.in` to CORS_ORIGIN in backend .env |

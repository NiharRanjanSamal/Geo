# Attendance Admin (Web)

React + Vite + TypeScript web app for managers to view all employees' attendance.

## Setup

```bash
cd web
npm install
```

## Environment

Copy `.env.example` to `.env` and set your backend URL if needed:

- Leave `VITE_API_URL` empty to use Vite's proxy (requests to `/api` go to `http://localhost:3000`).
- Or set `VITE_API_URL=https://your-api.com` for production.

## Run

```bash
npm run dev
```

Open http://localhost:5173. Log in with a manager/admin account, then use the date picker to view the attendance report.

## Build

```bash
npm run build
```

Output is in `dist/`. Serve with any static host (Vercel, Netlify, etc.).

## Backend

The app expects:

- **POST /api/auth/login** — `{ email, password }` → `{ token, user }` (user should include `role` for manager access).
- **GET /api/auth/me** — `Authorization: Bearer <token>` → user object.
- **GET /api/attendance/report?date=YYYY-MM-DD** — returns `{ data: AttendanceReportRow[] }` (role-scoped on the server).

See `src/types/index.ts` for `AttendanceReportRow` and `src/api/` for client usage.

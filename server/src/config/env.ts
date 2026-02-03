import 'dotenv/config';

function getCorsOrigin(): boolean | string | string[] {
  const cors = process.env.CORS_ORIGIN;
  if (!cors) return true;
  if (cors.includes(',')) return cors.split(',').map((s) => s.trim()).filter(Boolean);
  return cors;
}

export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: getCorsOrigin(),
  mysql: {
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER ?? 'root',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'attendance_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { User } from '../types/index.js';

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  tenantId: number;
  companyId?: number;
  siteId?: number;
  employeeId?: number;
}

export interface AuthRequest extends Request {
  user?: User;
  jwt?: JwtPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.jwt = payload;
    req.user = {
      id: String(payload.userId),
      email: payload.email,
      name: payload.email.split('@')[0],
      employeeId: payload.employeeId != null ? String(payload.employeeId) : '',
      role: payload.role as User['role'],
      companyId: payload.companyId != null ? String(payload.companyId) : undefined,
      siteId: payload.siteId != null ? String(payload.siteId) : undefined,
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

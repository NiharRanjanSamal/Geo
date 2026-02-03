import { apiFetch, setStoredToken } from './client';
import type { User } from '@/types';
import type { LoginResponse } from '@/types';

export interface SignupData {
  tenant_name: string;
  tenant_code: string;
  company_name: string;
  company_code: string;
  admin_email: string;
  admin_password: string;
}

export async function signup(data: SignupData): Promise<{ success: boolean; message: string }> {
  return await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(
  email: string,
  password: string,
  tenantCode?: string
): Promise<LoginResponse> {
  const body: { email: string; password: string; tenant_code?: string } = { email, password };
  if (tenantCode?.trim()) body.tenant_code = tenantCode.trim();
  const data = await apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  setStoredToken(data.token);
  return data;
}

export async function getMe(): Promise<User | null> {
  try {
    const user = await apiFetch<User>('/api/auth/me');
    return user;
  } catch {
    return null;
  }
}

export function logout(): void {
  setStoredToken(null);
}

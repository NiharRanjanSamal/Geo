import { apiFetch } from './client';

export interface PendingUser {
  userId: string;
  email: string;
  createdAt: number;
  companyId: string;
  companyName: string;
  companyCode: string;
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone: string;
}

export async function getPendingUsers(): Promise<{ data: PendingUser[] }> {
  return apiFetch<{ data: PendingUser[] }>('/api/pending-users');
}

export async function approveUser(userId: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>(`/api/pending-users/${userId}/approve`, {
    method: 'POST',
  });
}

export async function rejectUser(userId: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>(`/api/pending-users/${userId}/reject`, {
    method: 'DELETE',
  });
}

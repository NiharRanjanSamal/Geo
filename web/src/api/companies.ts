import { apiFetch } from './client';
import type { Company } from '@/types';

export interface CompaniesResponse {
  data: Company[];
  maxCompanies?: number | null;
  currentCount?: number;
}

export async function getCompanies(): Promise<CompaniesResponse> {
  return apiFetch<CompaniesResponse>('/api/companies');
}

export async function createCompany(body: {
  companyCode: string;
  name: string;
  timezone?: string;
}): Promise<{ success: boolean; message: string }> {
  return apiFetch('/api/companies', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateCompany(
  id: string,
  body: { name?: string; timezone?: string; status?: string }
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/api/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

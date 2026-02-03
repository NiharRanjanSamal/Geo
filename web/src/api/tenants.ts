import { apiFetch, setStoredToken } from './client';

export interface Tenant {
  id: string;
  tenantCode: string;
  name: string;
  status: string;
  subscriptionTier: string;
  maxCompanies?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TenantStats {
  tenantId: string;
  companies: number;
  users: number;
  employees: number;
}

export interface CreateTenantData {
  tenantCode: string;
  name: string;
  subscriptionTier?: string;
  maxCompanies?: number | null;
}

export interface UpdateTenantData {
  name?: string;
  status?: string;
  subscriptionTier?: string;
  maxCompanies?: number | null;
}

export async function getTenants(): Promise<{ data: Tenant[] }> {
  return await apiFetch('/api/tenants');
}

export async function getTenantStats(tenantId: string): Promise<TenantStats> {
  return await apiFetch(`/api/tenants/${tenantId}/stats`);
}

export async function createTenant(data: CreateTenantData): Promise<{ success: boolean; message: string }> {
  return await apiFetch('/api/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTenant(id: string, data: UpdateTenantData): Promise<{ success: boolean; message: string }> {
  return await apiFetch(`/api/tenants/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function switchTenant(tenantId: string): Promise<{
  success: boolean;
  token: string;
  tenantId: string;
  tenantName: string;
  message: string;
}> {
  const response = await apiFetch<{
    success: boolean;
    token: string;
    tenantId: string;
    tenantName: string;
    message: string;
  }>(`/api/tenants/switch/${tenantId}`, {
    method: 'POST',
  });
  
  // Update stored token with new tenant context
  setStoredToken(response.token);
  
  return response;
}

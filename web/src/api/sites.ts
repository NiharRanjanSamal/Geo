import { apiFetch } from './client';
import type { Site } from '@/types';

export interface SitesResponse {
  data: Site[];
}

export async function getSites(): Promise<SitesResponse> {
  return apiFetch<SitesResponse>('/api/sites');
}

export async function createSite(body: {
  companyId: string;
  siteCode: string;
  name: string;
  description?: string;
  timezone?: string;
}): Promise<{ id: string; siteCode: string; name: string }> {
  return apiFetch('/api/sites', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateSite(
  id: string,
  body: { siteCode?: string; name?: string; description?: string; timezone?: string; status?: string }
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/sites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

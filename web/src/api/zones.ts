import { apiFetch } from './client';
import type { AttendanceZone } from '@/types';

export interface ZonesResponse {
  data: AttendanceZone[];
}

export async function getZonesBySite(siteId: string): Promise<ZonesResponse> {
  return apiFetch<ZonesResponse>(`/api/zones/site/${siteId}`);
}

export async function createZone(body: {
  siteId: string;
  zoneCode: string;
  name: string;
  description?: string;
  zoneType: 'circle' | 'polygon' | 'digipin';
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  polygonBoundary?: Array<{ latitude: number; longitude: number }>;
  digipinCode?: string;
}): Promise<{ id: string; zoneCode: string; name: string }> {
  return apiFetch('/api/zones', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateZone(
  id: string,
  body: {
    zoneCode?: string;
    name?: string;
    description?: string;
    zoneType?: string;
    centerLatitude?: number;
    centerLongitude?: number;
    radiusMeters?: number;
    polygonBoundary?: unknown;
    digipinCode?: string;
    status?: string;
  }
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/zones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteZone(id: string): Promise<void> {
  return apiFetch(`/api/zones/${id}`, { method: 'DELETE' });
}

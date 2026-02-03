import { apiClient } from './api';
import { cacheZones, getZonesCache } from '@/db/sync-queue';

export interface Site {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Zone {
  id: string;
  siteId: string;
  name: string;
  type: 'circle' | 'polygon' | 'digipin';
  coordinates: any;
  radius?: number;
}

/**
 * Get all sites that have zones assigned to this employee (from web app assignments).
 * Uses /api/employee/sites so Ram Kishan only sees Main Office if that's where his zone is assigned.
 * Returns { sites, noLocationRequired } where noLocationRequired = true if employee has "no location" enabled.
 */
export async function getSites(): Promise<{ sites: Site[]; noLocationRequired: boolean }> {
  if (__DEV__) {
    // In dev, still try real API first so you can test with Ram Kishan's login
    try {
      const response = await apiClient.getClient().get<{ data: { id: string; name: string; siteCode?: string }[]; noLocationRequired?: boolean }>('/employee/sites');
      const data = response.data?.data ?? [];
      const noLocationRequired = response.data?.noLocationRequired ?? false;
      return {
        sites: data.map((s) => ({ id: s.id, name: s.name })),
        noLocationRequired,
      };
    } catch {
      // Fallback mock if server not reachable
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        sites: [
          { id: 'site_001', name: 'Main Office', latitude: 22.80917298539718, longitude: 86.1877764291429 },
          { id: 'site_002', name: 'Branch Office', latitude: 22.80917298539718, longitude: 86.1877764291429 },
        ],
        noLocationRequired: false,
      };
    }
  }

  const response = await apiClient.getClient().get<{ data: { id: string; name: string }[]; noLocationRequired?: boolean }>('/employee/sites');
  const data = response.data?.data ?? [];
  const noLocationRequired = response.data?.noLocationRequired ?? false;
  return {
    sites: data.map((s) => ({ id: s.id, name: s.name })),
    noLocationRequired,
  };
}

/**
 * Get zones assigned to this employee for a site (from web app assignments).
 * Uses /api/employee/sites/:siteId/zones so only assigned zones (e.g. CH_Canteen for Ram Kishan) are returned.
 */
export async function getSiteZones(siteId: string, useCache: boolean = true): Promise<Zone[]> {
  if (__DEV__) {
    useCache = false;
  }

  if (useCache) {
    const cachedZones = await getZonesCache(siteId);
    if (cachedZones.length > 0) {
      return cachedZones.map((z) => ({
        id: z.zone_id,
        siteId: z.site_id,
        name: z.name,
        type: z.type,
        coordinates: JSON.parse(z.coordinates),
        radius: z.radius,
      }));
    }
  }

  try {
    const response = await apiClient.getClient().get<Zone[]>(`/employee/sites/${siteId}/zones`);
    const zones = Array.isArray(response.data) ? response.data : [];
    await cacheZones(siteId, zones);
    return zones;
  } catch (e) {
    if (__DEV__) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockZones: Zone[] = [
        {
          id: 'zone_001',
          siteId,
          name: 'Main Entrance',
          type: 'circle',
          coordinates: { latitude: 22.80917298539718, longitude: 86.1877764291429 },
          radius: 100,
        },
      ];
      await cacheZones(siteId, mockZones);
      return mockZones;
    }
    throw e;
  }
}

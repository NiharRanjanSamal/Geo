import { create } from 'zustand';
import { LocationData } from '@/services/location.service';
import { Site, Zone } from '@/services/sites.service';
import { findNearestZone, Zone as GeoZone } from '@/utils/geo.utils';

interface LocationState {
  currentLocation: LocationData | null;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  sites: Site[];
  zones: Zone[];
  selectedSite: Site | null;
  nearestZone: { zone: Zone; distance: number } | null;
  noLocationRequired: boolean;
  setLocation: (location: LocationData) => void;
  setPermission: (granted: boolean) => void;
  setSites: (sites: Site[]) => void;
  setZones: (zones: Zone[]) => void;
  setSelectedSite: (site: Site | null) => void;
  setNoLocationRequired: (required: boolean) => void;
  findNearestZoneForLocation: (latitude: number, longitude: number) => void;
  clearError: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  hasPermission: false,
  isLoading: false,
  error: null,
  sites: [],
  zones: [],
  selectedSite: null,
  nearestZone: null,
  noLocationRequired: false,

  setLocation: (location: LocationData) => {
    set({ currentLocation: location });
    // Auto-find nearest zone when location updates
    const { zones } = get();
    if (zones.length > 0) {
      get().findNearestZoneForLocation(location.latitude, location.longitude);
    }
  },

  setPermission: (granted: boolean) => set({ hasPermission: granted }),

  setSites: (sites: Site[]) => set({ sites }),

  setZones: (zones: Zone[]) => {
    set({ zones });
    // Auto-find nearest zone if location is available
    const { currentLocation } = get();
    if (currentLocation) {
      get().findNearestZoneForLocation(currentLocation.latitude, currentLocation.longitude);
    }
  },

  setSelectedSite: (site: Site | null) => set({ selectedSite: site }),

  setNoLocationRequired: (required: boolean) => set({ noLocationRequired: required }),

  findNearestZoneForLocation: (latitude: number, longitude: number) => {
    const { zones } = get();
    if (zones.length === 0) {
      set({ nearestZone: null });
      return;
    }

    const geoZones: Array<GeoZone & { id: string; name: string }> = zones.map((z) => ({
      id: z.id,
      name: z.name,
      type: z.type,
      ...(z.type === 'circle' && {
        center: z.coordinates,
        radius: z.radius!,
      }),
      ...(z.type === 'polygon' && {
        coordinates: z.coordinates,
      }),
      ...(z.type === 'digipin' && {
        center: z.coordinates,
        gridSize: z.radius || 100,
        pin: z.id,
      }),
    })) as any;

    const nearest = findNearestZone(latitude, longitude, geoZones);
    set({ nearestZone: nearest });
  },

  clearError: () => set({ error: null }),
}));

import { useEffect } from 'react';
import { useLocationStore } from '@/store/location.store';
import { isInsideZone, Zone, calculateDistance } from '@/utils/geo.utils';
import { validateLocationAccuracy } from '@/utils/validation.utils';

export interface ZoneValidationResult {
  isValid: boolean;
  isInsideZone: boolean;
  hasGoodAccuracy: boolean;
  error?: string;
}

export function useGeoFence(zone: Zone | null) {
  const { currentLocation } = useLocationStore();

  const validateZone = (): ZoneValidationResult => {
    if (!zone) {
      return {
        isValid: false,
        isInsideZone: false,
        hasGoodAccuracy: false,
        error: 'No zone selected',
      };
    }

    if (!currentLocation) {
      return {
        isValid: false,
        isInsideZone: false,
        hasGoodAccuracy: false,
        error: 'Location not available',
      };
    }

    const hasGoodAccuracy = validateLocationAccuracy(currentLocation.accuracy);
    const inside = isInsideZone(
      currentLocation.latitude,
      currentLocation.longitude,
      zone
    );

    const isValid = hasGoodAccuracy && inside;

    // Calculate distance to zone center for debugging (no console spam)
    let debugMessage = '';
    if (zone.type === 'circle' && 'center' in zone) {
      const distance = Math.round(
        calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          zone.center.latitude,
          zone.center.longitude
        )
      );
      const radius = zone.radius || 0;
      debugMessage = `Distance: ${distance}m, Radius: ${radius}m`;
    }

    return {
      isValid,
      isInsideZone: inside,
      hasGoodAccuracy,
      error: !hasGoodAccuracy
        ? `GPS accuracy too low: ${currentLocation.accuracy}m (required ≤ 50m)`
        : !inside
        ? `You are outside the attendance zone${debugMessage ? ` (${debugMessage})` : ''}`
        : undefined,
    };
  };

  return {
    currentLocation,
    zone,
    validateZone,
  };
}

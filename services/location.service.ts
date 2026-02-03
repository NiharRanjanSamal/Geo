import * as Location from 'expo-location';
import { validateLocationAccuracy, validateLocationFreshness } from '@/utils/validation.utils';
import { detectMockGPS } from '@/utils/security.utils';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface LocationError {
  code: string;
  message: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * Check if location permission is granted
 */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * Get current location with high accuracy
 */
export async function getCurrentLocation(): Promise<LocationData> {
  const hasPermission = await hasLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    maximumAge: 10000, // Accept location up to 10 seconds old
  });

  const locationData: LocationData = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    timestamp: Math.floor(location.timestamp / 1000), // Convert to seconds
  };

  // Validate accuracy
  if (!validateLocationAccuracy(locationData.accuracy)) {
    throw new Error(`GPS accuracy too low: ${locationData.accuracy}m (required ≤ 50m)`);
  }

  // Check for mock GPS
  if (detectMockGPS(locationData)) {
    throw new Error('Mock GPS detected. Please disable location spoofing apps.');
  }

  return locationData;
}

/**
 * Start watching location (for real-time updates)
 */
export async function watchLocation(
  callback: (location: LocationData) => void,
  errorCallback?: (error: LocationError) => void
): Promise<Location.LocationSubscription> {
  const hasPermission = await hasLocationPermission();
  if (!hasPermission) {
    throw new Error('Location permission not granted');
  }

  return await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // Update every 5 seconds
      distanceInterval: 5, // Update every 5 meters
    },
    (location) => {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: Math.floor(location.timestamp / 1000),
      };

      callback(locationData);
    }
  );
}

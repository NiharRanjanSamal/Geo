/**
 * Geo-fencing utility functions
 * Supports Circle, Polygon, and DigiPin based fencing
 */

export interface CircleZone {
  type: 'circle';
  center: { latitude: number; longitude: number };
  radius: number; // in meters
}

export interface PolygonZone {
  type: 'polygon';
  coordinates: Array<{ latitude: number; longitude: number }>;
}

export interface DigiPinZone {
  type: 'digipin';
  center: { latitude: number; longitude: number };
  gridSize: number; // in meters
  pin: string;
}

export type Zone = CircleZone | PolygonZone | DigiPinZone;

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a point is inside a circle zone
 */
export function isInsideCircle(
  latitude: number,
  longitude: number,
  zone: CircleZone
): boolean {
  const distance = calculateDistance(
    latitude,
    longitude,
    zone.center.latitude,
    zone.center.longitude
  );
  return distance <= zone.radius;
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isInsidePolygon(
  latitude: number,
  longitude: number,
  zone: PolygonZone
): boolean {
  const { coordinates } = zone;
  let inside = false;

  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].longitude;
    const yi = coordinates[i].latitude;
    const xj = coordinates[j].longitude;
    const yj = coordinates[j].latitude;

    const intersect =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Convert DigiPin to coordinates
 * DigiPin is a grid-based location system
 */
export function digiPinToCoordinates(
  pin: string,
  baseLat: number,
  baseLon: number,
  gridSize: number
): { latitude: number; longitude: number } {
  // Simple implementation: DigiPin as offset from base
  // In production, this would use a more sophisticated algorithm
  const pinNum = parseInt(pin, 36) || 0;
  const offsetLat = (pinNum % 1000) * (gridSize / 111000); // ~111km per degree
  const offsetLon = Math.floor(pinNum / 1000) * (gridSize / (111000 * Math.cos(toRadians(baseLat))));

  return {
    latitude: baseLat + offsetLat,
    longitude: baseLon + offsetLon,
  };
}

/**
 * Check if a point is inside a DigiPin zone
 */
export function isInsideDigiPin(
  latitude: number,
  longitude: number,
  zone: DigiPinZone
): boolean {
  const pinCoords = digiPinToCoordinates(
    zone.pin,
    zone.center.latitude,
    zone.center.longitude,
    zone.gridSize
  );

  // Check if within grid cell
  const distance = calculateDistance(
    latitude,
    longitude,
    pinCoords.latitude,
    pinCoords.longitude
  );

  return distance <= zone.gridSize / 2;
}

/**
 * Validate if location is inside a zone
 */
export function isInsideZone(
  latitude: number,
  longitude: number,
  zone: Zone
): boolean {
  switch (zone.type) {
    case 'circle':
      return isInsideCircle(latitude, longitude, zone);
    case 'polygon':
      return isInsidePolygon(latitude, longitude, zone);
    case 'digipin':
      return isInsideDigiPin(latitude, longitude, zone);
    default:
      return false;
  }
}

/**
 * Find the nearest zone from a list of zones
 */
export function findNearestZone(
  latitude: number,
  longitude: number,
  zones: Array<Zone & { id: string; name: string }>
): { zone: Zone & { id: string; name: string }; distance: number } | null {
  if (zones.length === 0) return null;

  let nearest: { zone: Zone & { id: string; name: string }; distance: number } | null = null;
  let minDistance = Infinity;

  for (const zone of zones) {
    let distance: number;

    if (zone.type === 'circle') {
      distance = calculateDistance(
        latitude,
        longitude,
        zone.center.latitude,
        zone.center.longitude
      );
      distance = Math.max(0, distance - zone.radius); // Distance to edge
    } else if (zone.type === 'polygon') {
      // For polygon, calculate distance to nearest edge
      // Simplified: use center of bounding box
      const lats = zone.coordinates.map((c) => c.latitude);
      const lons = zone.coordinates.map((c) => c.longitude);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
      distance = calculateDistance(latitude, longitude, centerLat, centerLon);
    } else {
      // DigiPin
      const pinCoords = digiPinToCoordinates(
        zone.pin,
        zone.center.latitude,
        zone.center.longitude,
        zone.gridSize
      );
      distance = calculateDistance(
        latitude,
        longitude,
        pinCoords.latitude,
        pinCoords.longitude
      );
    }

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { zone, distance };
    }
  }

  return nearest;
}

/**
 * Security utilities for token handling and mock GPS detection
 */

/**
 * Generate a nonce for request protection
 */
export function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Basic mock GPS detection (placeholder)
 * In production, this would use more sophisticated detection methods
 */
export function detectMockGPS(location: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}): boolean {
  // Placeholder: Check for suspicious patterns
  // Real implementation would check:
  // - Location provider (GPS vs network)
  // - Speed inconsistencies
  // - Sudden location jumps
  // - Known mock location apps
  
  // For now, just check if accuracy is suspiciously good (might indicate mock)
  if (location.accuracy !== null && location.accuracy < 1) {
    // Very high accuracy (< 1m) might indicate mock GPS
    return true;
  }
  
  return false;
}

/**
 * Create device fingerprint for device binding
 */
export async function getDeviceId(): Promise<string> {
  // In production, use expo-device or expo-application
  // For now, use a simple approach
  const randomId = Math.random().toString(36).substring(2, 15);
  return `device_${randomId}`;
}

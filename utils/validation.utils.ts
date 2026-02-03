/**
 * Input validation utilities
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): boolean {
  // At least 6 characters
  return password.length >= 6;
}

export function validateLocationAccuracy(accuracy: number | null): boolean {
  if (accuracy === null) return false;
  // GPS accuracy must be 50 meters or less
  return accuracy <= 50;
}

export function validateLocationFreshness(timestamp: number, maxAgeSeconds: number = 30): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;
  return age < maxAgeSeconds;
}

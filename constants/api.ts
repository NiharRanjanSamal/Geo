/**
 * API base URL for the attendance backend.
 *
 * - Emulator: `http://localhost:3000/api` usually works.
 * - Physical device: use your computer's IP, e.g. `http://192.168.1.33:3000/api`.
 *   (On device, "localhost" is the device itself, so the server is never reached.)
 *
 * If check-out shows in the app but not in MySQL, change DEV_API_BASE_URL below
 * to your machine's IP, restart the app, and pull-to-refresh on the dashboard to sync.
 */
// Use your computer's IP when testing on a physical device. Must match server .env SERVER_IP.
// Find it: Windows: ipconfig → IPv4; Mac/Linux: ifconfig or ip addr
const DEV_API_BASE_URL = 'http://localhost:3000/api';

export const API_BASE_URL =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? DEV_API_BASE_URL
    : 'https://attendance.zenuino.in/api';

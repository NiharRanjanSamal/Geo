import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { apiClient } from './api';
import { getSyncQueueItems, removeFromSyncQueue, incrementRetryCount } from '@/db/sync-queue';
import { markAsSynced, getUnsyncedAttendance, AttendanceRecord } from '@/db/attendance';
import { syncAttendanceToServer } from './attendance.service';

const SYNC_TASK_NAME = 'background-sync';

async function hasRequiredBackgroundLocationPermissions(): Promise<boolean> {
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== 'granted') return false;

    // Background permission is required for startLocationUpdatesAsync to run in background.
    // On some platforms/OS versions, this may be "undetermined" until explicitly requested.
    const bg = await Location.getBackgroundPermissionsAsync();
    return bg.status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Process sync queue
 */
export async function processSyncQueue(): Promise<void> {
  if (!apiClient.isConnected()) {
    return;
  }

  const queueItems = await getSyncQueueItems(10); // Process 10 items at a time

  for (const item of queueItems) {
    try {
      const payload = JSON.parse(item.payload);

      if (item.endpoint === '/attendance/mark') {
        // Find the local record and sync it
        const unsyncedRecords = await getUnsyncedAttendance(payload.employeeId);
        const record = unsyncedRecords.find(
          (r) =>
            r.zone_id === payload.zoneId &&
            r.timestamp === payload.timestamp
        );

        if (record) {
          await syncAttendanceToServer(record);
          await markAsSynced(record.id!);
          await removeFromSyncQueue(item.id!);
        } else {
          // Record not found, remove from queue
          await removeFromSyncQueue(item.id!);
        }
      } else {
        // Handle other endpoints
        await apiClient.getClient().request({
          method: item.method,
          url: item.endpoint,
          data: payload,
        });
        await removeFromSyncQueue(item.id!);
      }
    } catch (error) {
      // Increment retry count
      await incrementRetryCount(item.id!);

      // If retry count exceeds max, remove from queue
      if (item.retry_count >= 5) {
        await removeFromSyncQueue(item.id!);
      }
    }
  }
}

/**
 * Sync all unsynced attendance records
 */
export async function syncUnsyncedAttendance(employeeId: string): Promise<void> {
  if (!apiClient.isConnected()) {
    return;
  }

  const unsyncedRecords = await getUnsyncedAttendance(employeeId);

  for (const record of unsyncedRecords) {
    try {
      await syncAttendanceToServer(record);
      await markAsSynced(record.id!);
    } catch (error) {
      // Will be retried later via sync queue
      console.error('Failed to sync attendance:', error);
    }
  }
}

/**
 * Register background sync task
 */
TaskManager.defineTask(SYNC_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background sync error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    // Trigger sync when location updates in background
    await processSyncQueue();
  }
});

/**
 * Start background location updates for sync
 */
export async function startBackgroundSync(): Promise<void> {
  try {
    // TaskManager/background execution isn't supported in all environments (e.g. Expo Go).
    const taskManagerAvailable = await TaskManager.isAvailableAsync();
    if (!taskManagerAvailable) return;

    // Expo Go has additional limitations for background location (especially on Android).
    // This prevents rejected calls + LogBox overlays that can make the UI appear "blank".
    const backgroundLocationAvailable =
      await Location.isBackgroundLocationAvailableAsync();
    if (!backgroundLocationAvailable) return;

    // Avoid throwing/redscreening if the user hasn't granted background permissions yet.
    const hasPerms = await hasRequiredBackgroundLocationPermissions();
    if (!hasPerms) return;

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(SYNC_TASK_NAME);
    if (alreadyStarted) return;

    await Location.startLocationUpdatesAsync(SYNC_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 300000, // 5 minutes
      distanceInterval: 100, // 100 meters
      foregroundService: {
        notificationTitle: 'Syncing attendance',
        notificationBody: 'Syncing your attendance data',
      },
    });
  } catch (error) {
    console.error('Failed to start background sync:', error);
  }
}

/**
 * Stop background sync
 */
export async function stopBackgroundSync(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(SYNC_TASK_NAME);
    if (!isRunning) return;
    await Location.stopLocationUpdatesAsync(SYNC_TASK_NAME);
  } catch (error) {
    console.error('Failed to stop background sync:', error);
  }
}

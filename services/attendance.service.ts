import { apiClient } from './api';
import { addToSyncQueue } from '@/db/sync-queue';
import { insertAttendance, markAsSynced, AttendanceRecord } from '@/db/attendance';

export interface MarkAttendanceRequest {
  zoneId: string | null;
  siteId: string | null;
  type: 'IN' | 'OUT';
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface AttendanceResponse {
  id: string;
  zoneId: string;
  siteId: string;
  type: 'IN' | 'OUT';
  timestamp: number;
  synced: boolean;
}

/**
 * Mark attendance - saves locally first, then syncs if online
 */
export async function markAttendance(
  request: MarkAttendanceRequest,
  employeeId: string
): Promise<AttendanceRecord> {
  // Always save to local DB first
  const recordId = await insertAttendance({
    employee_id: employeeId,
    zone_id: request.zoneId,
    site_id: request.siteId,
    type: request.type,
    timestamp: request.timestamp,
    latitude: request.latitude,
    longitude: request.longitude,
    accuracy: request.accuracy,
    synced: 0,
  });

  const localRecord: AttendanceRecord = {
    id: recordId,
    employee_id: employeeId,
    zone_id: request.zoneId,
    site_id: request.siteId,
    type: request.type,
    timestamp: request.timestamp,
    latitude: request.latitude,
    longitude: request.longitude,
    accuracy: request.accuracy,
    synced: 0,
  };

  // Try to sync if online
  if (apiClient.isConnected()) {
    try {
      console.log('[Attendance] Attempting to sync to server...');
      await syncAttendanceToServer(localRecord);
      await markAsSynced(recordId);
      localRecord.synced = 1;
      console.log('[Attendance] Sync successful');
    } catch (error) {
      console.error('[Attendance] Sync failed, queuing for later:', error);
      // Queue for later sync
      await addToSyncQueue('/attendance/mark', 'POST', {
        ...request,
        employeeId,
      });
      // Don't throw - we saved locally, that's enough for now
    }
  } else {
    console.log('[Attendance] Offline, queuing for later sync');
    // Queue for later sync
    await addToSyncQueue('/attendance/mark', 'POST', {
      ...request,
      employeeId,
    });
  }

  return localRecord;
}

/**
 * Sync attendance to server (MySQL via backend API).
 * In __DEV__, use your machine's IP instead of localhost if testing on a device (e.g. http://192.168.1.x:3000/api).
 */
export async function syncAttendanceToServer(record: AttendanceRecord): Promise<void> {
  console.log('[Attendance] Syncing to server:', {
    zoneId: record.zone_id,
    siteId: record.site_id,
    type: record.type,
  });
  
  const response = await apiClient.getClient().post('/attendance/mark', {
    zoneId: record.zone_id,
    siteId: record.site_id,
    type: record.type,
    latitude: record.latitude,
    longitude: record.longitude,
    accuracy: record.accuracy,
    timestamp: record.timestamp,
  });
  
  console.log('[Attendance] Sync successful:', response.status);
}

/**
 * Get today's attendance
 */
export async function getTodayAttendance(employeeId: string): Promise<AttendanceRecord[]> {
  // In production, fetch from API and merge with local
  // For now, return from local DB
  const { getTodayAttendance } = await import('@/db/attendance');
  return await getTodayAttendance(employeeId);
}

/** Server report row shape for merging check-out from server when local is missing */
interface ReportRow {
  employeeId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalMinutes: number | null;
  date: string;
}

/**
 * Get attendance history.
 * In __DEV__, returns local SQLite records and merges in check-out from server report
 * for any day where we have IN locally but no OUT (so marked OUT in app + synced to server still shows).
 */
export async function getAttendanceHistory(
  employeeId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AttendanceRecord[]> {
  if (__DEV__) {
    const { getAttendanceHistory: getLocalHistory } = await import('@/db/attendance');
    const localRecords = await getLocalHistory(employeeId, limit, offset);

    // Merge check-out from server for days that have IN but no OUT locally
    if (apiClient.isConnected()) {
      try {
        const groupedByDate = new Map<string, AttendanceRecord[]>();
        for (const r of localRecords) {
          const d = new Date(r.timestamp * 1000);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!groupedByDate.has(dateKey)) groupedByDate.set(dateKey, []);
          groupedByDate.get(dateKey)!.push(r);
        }
        const datesMissingOut: string[] = [];
        groupedByDate.forEach((recs, dateKey) => {
          const hasIn = recs.some((r) => r.type === 'IN');
          const hasOut = recs.some((r) => r.type === 'OUT');
          if (hasIn && !hasOut) datesMissingOut.push(dateKey);
        });

        const syntheticOuts: AttendanceRecord[] = [];
        for (const dateKey of datesMissingOut) {
          const res = await apiClient.getClient().get<{ data: ReportRow[] }>('/attendance/report', {
            params: { date: dateKey },
          });
          const myRow = res.data?.data?.find((r) => String(r.employeeId) === String(employeeId));
          if (myRow?.checkOutTime) {
            const recs = groupedByDate.get(dateKey)!;
            const inRec = recs.find((r) => r.type === 'IN')!;
            const outTimestamp = Math.floor(new Date(myRow.checkOutTime).getTime() / 1000);
            syntheticOuts.push({
              id: -outTimestamp,
              employee_id: inRec.employee_id,
              zone_id: inRec.zone_id,
              site_id: inRec.site_id,
              type: 'OUT',
              timestamp: outTimestamp,
              latitude: inRec.latitude,
              longitude: inRec.longitude,
              accuracy: inRec.accuracy,
              synced: 1,
            });
          }
        }
        if (syntheticOuts.length > 0) {
          const merged = [...localRecords, ...syntheticOuts].sort((a, b) => b.timestamp - a.timestamp);
          return merged.slice(0, limit);
        }
      } catch {
        // Offline or server error: use only local
      }
    }
    return localRecords;
  }

  // Production: Fetch from API
  const response = await apiClient.getClient().get<AttendanceResponse[]>('/attendance/history', {
    params: { limit, offset },
  });

  // Transform and return
  return response.data.map((item) => ({
    id: parseInt(item.id),
    employee_id: employeeId,
    zone_id: item.zoneId,
    site_id: item.siteId,
    type: item.type,
    timestamp: item.timestamp,
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    synced: item.synced ? 1 : 0,
  }));
}

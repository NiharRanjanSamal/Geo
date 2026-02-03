import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api';
import { processSyncQueue, syncUnsyncedAttendance } from '@/services/sync.service';
import { useAuthStore } from '@/store/auth.store';

export function useOfflineSync() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // In production, use @react-native-community/netinfo
    // For now, assume online
    setIsOnline(apiClient.isConnected());
  }, []);

  const sync = async () => {
    if (!user || !isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await processSyncQueue();
      if (user) {
        await syncUnsyncedAttendance(user.id);
      }
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    sync,
  };
}

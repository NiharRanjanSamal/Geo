import { create } from 'zustand';
import { AttendanceRecord } from '@/db/attendance';
import { getTodayAttendance, getAttendanceHistory, getLatestAttendance } from '@/db/attendance';

interface AttendanceState {
  todayRecords: AttendanceRecord[];
  historyRecords: AttendanceRecord[];
  latestRecord: AttendanceRecord | null;
  isLoading: boolean;
  error: string | null;
  refreshToday: (employeeId: string) => Promise<void>;
  refreshHistory: (employeeId: string, limit?: number, offset?: number) => Promise<void>;
  refreshLatest: (employeeId: string) => Promise<void>;
  addRecord: (record: AttendanceRecord) => void;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  todayRecords: [],
  historyRecords: [],
  latestRecord: null,
  isLoading: false,
  error: null,

  refreshToday: async (employeeId: string) => {
    try {
      set({ isLoading: true, error: null });
      const records = await getTodayAttendance(employeeId);
      set({ todayRecords: records, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  refreshHistory: async (employeeId: string, limit: number = 50, offset: number = 0) => {
    try {
      set({ isLoading: true, error: null });
      const records = await getAttendanceHistory(employeeId, limit, offset);
      set({ historyRecords: records, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  refreshLatest: async (employeeId: string) => {
    try {
      const record = await getLatestAttendance(employeeId);
      set({ latestRecord: record });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addRecord: (record: AttendanceRecord) => {
    const state = get();
    set({
      todayRecords: [record, ...state.todayRecords],
      historyRecords: [record, ...state.historyRecords],
      latestRecord: record,
    });
  },

  clearError: () => set({ error: null }),
}));

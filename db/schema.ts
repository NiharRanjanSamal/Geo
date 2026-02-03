export const DB_VERSION = 2;

export interface AttendanceRecord {
  id?: number;
  employee_id: string;
  zone_id: string | null;
  site_id: string | null;
  type: 'IN' | 'OUT';
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  synced: number; // 0 = not synced, 1 = synced
  created_at?: number;
}

export interface SyncQueueItem {
  id?: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: string; // JSON stringified
  created_at: number;
  retry_count: number;
  last_attempt?: number;
}

export interface ZoneCache {
  id?: number;
  zone_id: string;
  site_id: string;
  name: string;
  type: 'circle' | 'polygon' | 'digipin';
  coordinates: string; // JSON stringified
  radius?: number; // For circle type
  updated_at: number;
}

export const CREATE_ATTENDANCE_TABLE = `
  CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    zone_id TEXT,
    site_id TEXT,
    type TEXT NOT NULL CHECK(type IN ('IN', 'OUT')),
    timestamp INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    accuracy REAL NOT NULL,
    synced INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`;

export const CREATE_SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    retry_count INTEGER DEFAULT 0,
    last_attempt INTEGER
  );
`;

export const CREATE_ZONES_CACHE_TABLE = `
  CREATE TABLE IF NOT EXISTS zones_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id TEXT UNIQUE NOT NULL,
    site_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('circle', 'polygon', 'digipin')),
    coordinates TEXT NOT NULL,
    radius REAL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`;

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_id);',
  'CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_records(timestamp);',
  'CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance_records(synced);',
  'CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);',
  'CREATE INDEX IF NOT EXISTS idx_zones_site ON zones_cache(site_id);',
];

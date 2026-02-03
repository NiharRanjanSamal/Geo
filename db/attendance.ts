import * as SQLite from 'expo-sqlite';
import { AttendanceRecord, CREATE_ATTENDANCE_TABLE, CREATE_INDEXES } from './schema';
import { runMigrations } from './migrations';

// Re-export types for convenience
export type { AttendanceRecord } from './schema';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Return existing database if already initialized
  if (db) return db;
  
  // If initialization is in progress, wait for it
  if (initPromise) return initPromise;
  
  // Start initialization and store the promise to prevent race conditions
  initPromise = (async () => {
    try {
      const database = await SQLite.openDatabaseAsync('attendance.db');
      
      // MIGRATION FIX: Check if we need to reset the database for nullable zone_id
      const result = await database.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
      );
      const currentVersion = result?.user_version || 0;
      
      // If version is 1 (old schema), drop and recreate
      if (currentVersion === 1) {
        console.log('[Database] Resetting database for schema v2 (nullable zone_id)');
        await database.execAsync('DROP TABLE IF EXISTS attendance_records');
        await database.execAsync('DROP TABLE IF EXISTS sync_queue');
        await database.execAsync('DROP TABLE IF EXISTS zones_cache');
      }
      
      await database.execAsync(CREATE_ATTENDANCE_TABLE);
      await database.execAsync(CREATE_INDEXES[0]);
      await database.execAsync(CREATE_INDEXES[1]);
      await database.execAsync(CREATE_INDEXES[2]);
      await runMigrations(database);
      
      db = database;
      return database;
    } catch (error) {
      // Reset promise on error so initialization can be retried
      initPromise = null;
      throw error;
    }
  })();
  
  return initPromise;
}

export async function insertAttendance(record: Omit<AttendanceRecord, 'id' | 'created_at'>): Promise<number> {
  const database = await initDatabase();
  
  const result = await database.runAsync(
    `INSERT INTO attendance_records 
     (employee_id, zone_id, site_id, type, timestamp, latitude, longitude, accuracy, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.employee_id,
      record.zone_id,
      record.site_id,
      record.type,
      record.timestamp,
      record.latitude,
      record.longitude,
      record.accuracy,
      record.synced || 0,
    ]
  );

  return result.lastInsertRowId;
}

export async function getAttendanceHistory(
  employeeId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AttendanceRecord[]> {
  const database = await initDatabase();
  
  const records = await database.getAllAsync<AttendanceRecord>(
    `SELECT * FROM attendance_records 
     WHERE employee_id = ? 
     ORDER BY timestamp DESC 
     LIMIT ? OFFSET ?`,
    [employeeId, limit, offset]
  );

  return records;
}

export async function getTodayAttendance(employeeId: string): Promise<AttendanceRecord[]> {
  const database = await initDatabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Math.floor(today.getTime() / 1000);

  const records = await database.getAllAsync<AttendanceRecord>(
    `SELECT * FROM attendance_records 
     WHERE employee_id = ? AND timestamp >= ?
     ORDER BY timestamp ASC`,
    [employeeId, todayTimestamp]
  );

  return records;
}

export async function getUnsyncedAttendance(employeeId: string): Promise<AttendanceRecord[]> {
  const database = await initDatabase();
  
  const records = await database.getAllAsync<AttendanceRecord>(
    `SELECT * FROM attendance_records 
     WHERE employee_id = ? AND synced = 0
     ORDER BY timestamp ASC`,
    [employeeId]
  );

  return records;
}

export async function markAsSynced(recordId: number): Promise<void> {
  const database = await initDatabase();
  
  await database.runAsync(
    `UPDATE attendance_records SET synced = 1 WHERE id = ?`,
    [recordId]
  );
}

export async function getLatestAttendance(employeeId: string): Promise<AttendanceRecord | null> {
  const database = await initDatabase();
  
  const record = await database.getFirstAsync<AttendanceRecord>(
    `SELECT * FROM attendance_records 
     WHERE employee_id = ? 
     ORDER BY timestamp DESC 
     LIMIT 1`,
    [employeeId]
  );

  return record || null;
}


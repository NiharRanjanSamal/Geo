import * as SQLite from 'expo-sqlite';
import { DB_VERSION } from './schema';

export async function runMigrations(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version || 0;

  if (currentVersion < DB_VERSION) {
    // Migration from v1 to v2: Make zone_id and site_id nullable for "no location required" support
    if (currentVersion < 2) {
      console.log('[Migration] Running migration to v2: Making zone_id and site_id nullable');
      
      // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
      await db.execAsync(`
        -- Create new table with nullable zone_id and site_id
        CREATE TABLE IF NOT EXISTS attendance_records_new (
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

        -- Copy existing data
        INSERT INTO attendance_records_new 
        SELECT * FROM attendance_records;

        -- Drop old table
        DROP TABLE attendance_records;

        -- Rename new table
        ALTER TABLE attendance_records_new RENAME TO attendance_records;

        -- Recreate indexes
        CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance_records(employee_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_records(timestamp);
        CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance_records(synced);
      `);
      
      console.log('[Migration] Migration to v2 completed');
    }
    
    await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
  }
}

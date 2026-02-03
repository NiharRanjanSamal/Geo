/**
 * ============================================================================
 * DATABASE INITIALIZATION & MANAGEMENT
 * ============================================================================
 * Central module for database connection, initialization, and utilities.
 * Uses expo-sqlite for React Native/Expo applications.
 * ============================================================================
 */

import * as SQLite from 'expo-sqlite';
import {
  ALL_CREATE_TABLES,
  CREATE_ALL_INDEXES,
  CREATE_TRIGGERS,
  CREATE_VIEWS,
  SCHEMA_VERSION,
} from './complete-schema';

// Database singleton
let db: SQLite.SQLiteDatabase | null = null;

// Database file name
const DATABASE_NAME = 'geo_attendance.db';

/**
 * Initialize and return the database connection.
 * Creates all tables, indexes, triggers, and views if they don't exist.
 */
export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    // Open database
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Enable foreign keys (CRITICAL - must be first)
    await db.execAsync('PRAGMA foreign_keys = ON;');

    // Set WAL mode for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create all tables in order (respects foreign key dependencies)
    for (const createStatement of ALL_CREATE_TABLES) {
      await db.execAsync(createStatement);
    }

    // Create all indexes
    for (const indexStatement of CREATE_ALL_INDEXES) {
      await db.execAsync(indexStatement);
    }

    // Create triggers
    for (const triggerStatement of CREATE_TRIGGERS) {
      await db.execAsync(triggerStatement);
    }

    // Create views
    for (const viewStatement of CREATE_VIEWS) {
      await db.execAsync(viewStatement);
    }

    // Store schema version
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );
    `);

    // Check if version exists
    const versionRow = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );

    if (!versionRow) {
      await db.runAsync(
        'INSERT INTO schema_version (version) VALUES (?)',
        [SCHEMA_VERSION]
      );
    }

    console.log(`[Database] Initialized successfully. Schema version: ${SCHEMA_VERSION}`);
    return db;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    throw error;
  }
}

/**
 * Get the database instance (must be initialized first)
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('[Database] Connection closed');
  }
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function executeTransaction<T>(
  callback: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const database = await getDatabase();
  
  await database.execAsync('BEGIN TRANSACTION');
  
  try {
    const result = await callback(database);
    await database.execAsync('COMMIT');
    return result;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
}

/**
 * Reset database (DANGER: Deletes all data)
 * Use only for development/testing
 */
export async function resetDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
  
  await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  console.log('[Database] Database reset complete');
  
  await initializeDatabase();
}

/**
 * Get current schema version
 */
export async function getSchemaVersion(): Promise<number> {
  const database = await getDatabase();
  
  const result = await database.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );
  
  return result?.version ?? 0;
}

/**
 * Verify database integrity
 */
export async function verifyDatabaseIntegrity(): Promise<boolean> {
  const database = await getDatabase();
  
  const result = await database.getFirstAsync<{ integrity_check: string }>(
    'PRAGMA integrity_check'
  );
  
  return result?.integrity_check === 'ok';
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  tableCount: number;
  indexCount: number;
  totalRows: Record<string, number>;
}> {
  const database = await getDatabase();
  
  // Get table count
  const tables = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  
  // Get index count
  const indexes = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='index'"
  );
  
  // Get row counts for each table
  const totalRows: Record<string, number> = {};
  for (const table of tables) {
    const countResult = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table.name}`
    );
    totalRows[table.name] = countResult?.count ?? 0;
  }
  
  return {
    tableCount: tables.length,
    indexCount: indexes.length,
    totalRows,
  };
}

// Export types for convenience
export type { SQLite };

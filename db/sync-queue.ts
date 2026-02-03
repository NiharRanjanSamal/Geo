import * as SQLite from 'expo-sqlite';
import { SyncQueueItem, CREATE_SYNC_QUEUE_TABLE, CREATE_INDEXES } from './schema';
import { initDatabase } from './attendance';

let syncQueueInitialized = false;
let syncQueueInitPromise: Promise<void> | null = null;

export async function initSyncQueue(): Promise<void> {
  if (syncQueueInitialized) return;
  if (syncQueueInitPromise) return syncQueueInitPromise;
  
  syncQueueInitPromise = (async () => {
    try {
      const db = await initDatabase();
      await db.execAsync(CREATE_SYNC_QUEUE_TABLE);
      await db.execAsync(CREATE_INDEXES[3]);
      syncQueueInitialized = true;
    } catch (error) {
      syncQueueInitPromise = null;
      throw error;
    }
  })();
  
  return syncQueueInitPromise;
}

export async function addToSyncQueue(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE',
  payload: any
): Promise<number> {
  const db = await initDatabase();
  await initSyncQueue();
  
  const result = await db.runAsync(
    `INSERT INTO sync_queue (endpoint, method, payload, created_at, retry_count)
     VALUES (?, ?, ?, ?, ?)`,
    [endpoint, method, JSON.stringify(payload), Math.floor(Date.now() / 1000), 0]
  );

  return result.lastInsertRowId;
}

export async function getSyncQueueItems(limit: number = 10): Promise<SyncQueueItem[]> {
  const db = await initDatabase();
  await initSyncQueue();
  
  const items = await db.getAllAsync<SyncQueueItem>(
    `SELECT * FROM sync_queue 
     ORDER BY created_at ASC 
     LIMIT ?`,
    [limit]
  );

  return items;
}

export async function removeFromSyncQueue(id: number): Promise<void> {
  const db = await initDatabase();
  await initSyncQueue();
  
  await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
}

export async function incrementRetryCount(id: number): Promise<void> {
  const db = await initDatabase();
  await initSyncQueue();
  
  await db.runAsync(
    `UPDATE sync_queue 
     SET retry_count = retry_count + 1, 
         last_attempt = ?
     WHERE id = ?`,
    [Math.floor(Date.now() / 1000), id]
  );
}

let zonesCacheInitialized = false;
let zonesCacheInitPromise: Promise<void> | null = null;

async function initZonesCache(): Promise<void> {
  if (zonesCacheInitialized) return;
  if (zonesCacheInitPromise) return zonesCacheInitPromise;
  
  zonesCacheInitPromise = (async () => {
    try {
      const db = await initDatabase();
      await db.execAsync(`
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
      `);
      await db.execAsync(CREATE_INDEXES[4]);
      zonesCacheInitialized = true;
    } catch (error) {
      zonesCacheInitPromise = null;
      throw error;
    }
  })();
  
  return zonesCacheInitPromise;
}

export async function getZonesCache(siteId: string): Promise<any[]> {
  await initZonesCache();
  const db = await initDatabase();
  
  const zones = await db.getAllAsync<any>(
    `SELECT * FROM zones_cache WHERE site_id = ?`,
    [siteId]
  );

  return zones;
}

/** Get zone display name by zone_id from cache. Returns null if not found. */
export async function getZoneNameById(zoneId: string): Promise<string | null> {
  await initZonesCache();
  const db = await initDatabase();
  const row = await db.getFirstAsync<{ name: string }>(
    `SELECT name FROM zones_cache WHERE zone_id = ?`,
    [zoneId]
  );
  return row?.name ?? null;
}

export async function cacheZones(siteId: string, zones: any[]): Promise<void> {
  await initZonesCache();
  const db = await initDatabase();
  
  for (const zone of zones) {
    await db.runAsync(
      `INSERT OR REPLACE INTO zones_cache 
       (zone_id, site_id, name, type, coordinates, radius, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        zone.id,
        siteId,
        zone.name,
        zone.type,
        JSON.stringify(zone.coordinates),
        zone.radius || null,
        Math.floor(Date.now() / 1000),
      ]
    );
  }
}


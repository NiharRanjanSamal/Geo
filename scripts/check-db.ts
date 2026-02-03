/**
 * Quick script to check mobile app database
 * Run this in your app code to see what's in the database
 */

import { initDatabase } from '@/db/attendance';

export async function logDatabaseContents() {
  try {
    const db = await initDatabase();
    
    console.log('\n========== DATABASE DEBUG ==========');
    
    // Check version
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    console.log('📊 Database Version:', version?.user_version || 0);
    
    // Get all attendance records
    const attendance = await db.getAllAsync('SELECT * FROM attendance_records ORDER BY timestamp DESC');
    console.log('\n📋 Attendance Records:', attendance.length);
    if (attendance.length > 0) {
      attendance.forEach((record: any) => {
        console.log('  -', {
          id: record.id,
          employee: record.employee_id,
          zone: record.zone_id || 'NULL',
          site: record.site_id || 'NULL',
          type: record.type,
          synced: record.synced ? 'Yes' : 'No',
          timestamp: new Date(record.timestamp * 1000).toLocaleString(),
        });
      });
    } else {
      console.log('  (empty)');
    }
    
    // Get sync queue
    const syncQueue = await db.getAllAsync('SELECT * FROM sync_queue ORDER BY created_at DESC');
    console.log('\n🔄 Sync Queue:', syncQueue.length);
    if (syncQueue.length > 0) {
      syncQueue.forEach((item: any) => {
        console.log('  -', {
          id: item.id,
          endpoint: item.endpoint,
          method: item.method,
          retries: item.retry_count,
        });
      });
    } else {
      console.log('  (empty)');
    }
    
    console.log('\n====================================\n');
  } catch (error) {
    console.error('❌ Failed to read database:', error);
  }
}

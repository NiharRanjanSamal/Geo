import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { initDatabase } from '@/db/attendance';
import { getDatabase } from '@/db/database';

export default function DebugDatabaseScreen() {
  const router = useRouter();
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [syncQueueData, setSyncQueueData] = useState<any[]>([]);
  const [dbVersion, setDbVersion] = useState<number>(0);

  useEffect(() => {
    loadDatabaseData();
  }, []);

  const loadDatabaseData = async () => {
    try {
      // Get attendance database
      const db = await initDatabase();
      
      // Get version
      const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      setDbVersion(versionResult?.user_version || 0);
      
      // Get all attendance records
      const attendance = await db.getAllAsync('SELECT * FROM attendance_records ORDER BY timestamp DESC LIMIT 20');
      setAttendanceData(attendance || []);
      
      // Get sync queue
      const syncQueue = await db.getAllAsync('SELECT * FROM sync_queue ORDER BY created_at DESC LIMIT 20');
      setSyncQueueData(syncQueue || []);
    } catch (error) {
      console.error('Failed to load database:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Database Debug</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>Database Version: {dbVersion}</Text>
      
      <Pressable onPress={loadDatabaseData} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </Pressable>

      {/* Attendance Records */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Records ({attendanceData.length})</Text>
        {attendanceData.map((record, index) => (
          <View key={index} style={styles.record}>
            <Text style={styles.recordText}>ID: {record.id}</Text>
            <Text style={styles.recordText}>Employee: {record.employee_id}</Text>
            <Text style={styles.recordText}>Zone: {record.zone_id || 'NULL'}</Text>
            <Text style={styles.recordText}>Site: {record.site_id || 'NULL'}</Text>
            <Text style={styles.recordText}>Type: {record.type}</Text>
            <Text style={styles.recordText}>Timestamp: {new Date(record.timestamp * 1000).toLocaleString()}</Text>
            <Text style={styles.recordText}>Synced: {record.synced ? 'Yes' : 'No'}</Text>
          </View>
        ))}
        {attendanceData.length === 0 && (
          <Text style={styles.emptyText}>No attendance records</Text>
        )}
      </View>

      {/* Sync Queue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync Queue ({syncQueueData.length})</Text>
        {syncQueueData.map((item, index) => (
          <View key={index} style={styles.record}>
            <Text style={styles.recordText}>ID: {item.id}</Text>
            <Text style={styles.recordText}>Endpoint: {item.endpoint}</Text>
            <Text style={styles.recordText}>Method: {item.method}</Text>
            <Text style={styles.recordText}>Retry Count: {item.retry_count}</Text>
            <Text style={styles.recordText}>Payload: {item.payload}</Text>
          </View>
        ))}
        {syncQueueData.length === 0 && (
          <Text style={styles.emptyText}>Sync queue is empty</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  record: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  recordText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    padding: 12,
  },
});

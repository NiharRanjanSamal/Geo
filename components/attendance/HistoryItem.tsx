import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDateTime } from '@/utils/date.utils';
import { AttendanceRecord } from '@/db/attendance';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface HistoryItemProps {
  record: AttendanceRecord;
  onPress?: () => void;
}

export function HistoryItem({ record, onPress }: HistoryItemProps) {
  const isIn = record.type === 'IN';
  const isSynced = record.synced === 1;

  const config = isIn
    ? {
        icon: 'log-in' as const,
        gradientColors: [Colors.success[500], Colors.success[600]] as readonly [string, string],
        bgColor: Colors.success[50],
        label: 'Check In',
        textColor: Colors.success[700],
      }
    : {
        icon: 'log-out' as const,
        gradientColors: [Colors.error[500], Colors.error[600]] as readonly [string, string],
        bgColor: Colors.error[50],
        label: 'Check Out',
        textColor: Colors.error[700],
      };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={config.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Ionicons name={config.icon} size={20} color={Colors.neutral[0]} />
          </LinearGradient>

          <View style={styles.textContainer}>
            <View style={styles.topRow}>
              <Text style={styles.typeLabel}>{config.label}</Text>
              <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
                <Text style={[styles.typeBadgeText, { color: config.textColor }]}>
                  {record.type}
                </Text>
              </View>
            </View>
            <Text style={styles.timeText}>{formatDateTime(record.timestamp)}</Text>
          </View>

          <View style={styles.rightSection}>
            {!isSynced && (
              <View style={styles.syncBadge}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={16}
                  color={Colors.warning[500]}
                />
                <Text style={styles.syncText}>Pending</Text>
              </View>
            )}
            {isSynced && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={Colors.success[500]}
              />
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <LinearGradient
          colors={config.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Ionicons name={config.icon} size={20} color={Colors.neutral[0]} />
        </LinearGradient>

        <View style={styles.textContainer}>
          <View style={styles.topRow}>
            <Text style={styles.typeLabel}>{config.label}</Text>
            <View style={[styles.typeBadge, { backgroundColor: config.bgColor }]}>
              <Text style={[styles.typeBadgeText, { color: config.textColor }]}>
                {record.type}
              </Text>
            </View>
          </View>
          <Text style={styles.timeText}>{formatDateTime(record.timestamp)}</Text>
        </View>

        <View style={styles.rightSection}>
          {!isSynced && (
            <View style={styles.syncBadge}>
              <Ionicons
                name="cloud-upload-outline"
                size={16}
                color={Colors.warning[500]}
              />
              <Text style={styles.syncText}>Pending</Text>
            </View>
          )}
          {isSynced && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success[500]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing[4],
    marginVertical: Spacing[1],
    borderRadius: BorderRadius.xl,
    ...Shadows.sm,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  typeLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[900],
    marginRight: Spacing[2],
  },
  typeBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  timeText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  syncText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    color: Colors.warning[600],
    marginLeft: Spacing[1],
  },
});

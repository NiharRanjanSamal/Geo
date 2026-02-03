import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [preciseLocation, setPreciseLocation] = useState(true);

  const SettingRow = ({
    icon,
    label,
    onPress,
    right,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.settingRow,
        onPress && pressed && styles.settingRowPressed,
      ]}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={18} color={Colors.primary[500]} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {right != null ? right : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={Colors.neutral[300]} />
      ) : null}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing[2] }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications */}
        <Card variant="elevated" padding="none" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="notifications-outline" size={18} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>Notifications</Text>
          </View>
          <View style={styles.cardContent}>
            <SettingRow
              icon="alarm-outline"
              label="Check-in reminders"
              right={
                <Switch
                  value={checkInReminders}
                  onValueChange={setCheckInReminders}
                  trackColor={{ false: Colors.neutral[200], true: Colors.primary[200] }}
                  thumbColor={checkInReminders ? Colors.primary[500] : Colors.neutral[0]}
                />
              }
            />
          </View>
        </Card>

        {/* Location */}
        <Card variant="elevated" padding="none" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={18} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          <View style={styles.cardContent}>
            <SettingRow
              icon="navigate-outline"
              label="Use precise location"
              right={
                <Switch
                  value={preciseLocation}
                  onValueChange={setPreciseLocation}
                  trackColor={{ false: Colors.neutral[200], true: Colors.primary[200] }}
                  thumbColor={preciseLocation ? Colors.primary[500] : Colors.neutral[0]}
                />
              }
            />
          </View>
        </Card>

        {/* About */}
        <Card variant="elevated" padding="none" style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.primary[500]} />
            <Text style={styles.cardTitle}>About</Text>
          </View>
          <View style={styles.cardContent}>
            <SettingRow icon="phone-portrait-outline" label="App version" right={<Text style={styles.versionValue}>1.0.0</Text>} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingBottom: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPressed: {
    backgroundColor: Colors.neutral[100],
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[900],
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing[3],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[8],
  },
  card: {
    marginBottom: Spacing[3],
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.neutral[50],
  },
  cardTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[900],
    marginLeft: Spacing[2],
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
  },
  settingRowPressed: {
    backgroundColor: Colors.neutral[50],
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[2],
  },
  settingLabel: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.neutral[900],
  },
  versionValue: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
  },
});

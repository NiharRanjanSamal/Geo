import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Pressable,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useGeoFence } from '@/hooks/useGeoFence';
import { useLocationStore } from '@/store/location.store';
import { useAttendanceStore } from '@/store/attendance.store';
import { markAttendance } from '@/services/attendance.service';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LocationStatus } from '@/components/location/LocationStatus';
import { ZoneIndicator } from '@/components/attendance/ZoneIndicator';
import { Loading } from '@/components/ui/Loading';
import { Zone } from '@/utils/geo.utils';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function MarkAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    currentLocation,
    fetchLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useLocation();
  const {
    zones,
    nearestZone,
    selectedSite,
    findNearestZoneForLocation,
  } = useLocationStore();
  const { latestRecord, todayRecords, addRecord, refreshToday, refreshLatest } =
    useAttendanceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  // Animations
  // Default to visible in case animations are disabled or fail to start on-device.
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for the main button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (user) {
      refreshToday(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!currentLocation) {
      fetchLocation();
    }
  }, []);

  useEffect(() => {
    if (currentLocation && zones.length > 0) {
      findNearestZoneForLocation(
        currentLocation.latitude,
        currentLocation.longitude
      );
    }
  }, [currentLocation, zones]);

  useEffect(() => {
    if (nearestZone) {
      const zone = zones.find((z) => z.id === nearestZone.zone.id);
      if (zone) {
        const geoZone: Zone =
          zone.type === 'circle'
            ? {
                type: 'circle',
                center: zone.coordinates,
                radius: zone.radius!,
              }
            : zone.type === 'polygon'
            ? {
                type: 'polygon',
                coordinates: zone.coordinates,
              }
            : {
                type: 'digipin',
                center: zone.coordinates,
                gridSize: zone.radius || 100,
                pin: zone.id,
              };
        setSelectedZone(geoZone);
      }
    }
  }, [nearestZone, zones]);

  const { validateZone } = useGeoFence(selectedZone);
  const validation = validateZone();

  /** One check-in and one check-out per day. Returns null when already done for today. */
  const getNextAction = (): 'IN' | 'OUT' | null => {
    const hasCheckIn = todayRecords.some((r) => r.type === 'IN');
    const hasCheckOut = todayRecords.some((r) => r.type === 'OUT');
    if (!hasCheckIn) return 'IN';
    if (hasCheckIn && !hasCheckOut) return 'OUT';
    return null;
  };

  const handleMarkAttendance = async () => {
    if (!user || !currentLocation || !nearestZone || !selectedSite) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    const next = getNextAction();
    if (next === null) {
      Alert.alert('Done for today', 'You have already checked in and checked out for today.');
      return;
    }

    const hasCheckIn = todayRecords.some((r) => r.type === 'IN');
    const hasCheckOut = todayRecords.some((r) => r.type === 'OUT');
    if (next === 'IN' && hasCheckIn) {
      Alert.alert('Already checked in', 'You can only check in once per day.');
      return;
    }
    if (next === 'OUT' && (!hasCheckIn || hasCheckOut)) {
      Alert.alert(
        'Cannot check out',
        hasCheckOut
          ? 'You can only check out once per day.'
          : 'You need to check in first before checking out.'
      );
      return;
    }

    if (!validation.isValid) {
      Alert.alert(
        'Validation Failed',
        validation.error || 'Cannot mark attendance at this location'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const attendanceType = next;
      const timestamp = Math.floor(Date.now() / 1000);

      const record = await markAttendance(
        {
          zoneId: nearestZone.zone.id,
          siteId: selectedSite.id,
          type: attendanceType,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy || 0,
          timestamp,
        },
        user.id
      );

      addRecord(record);
      await Promise.all([refreshToday(user.id), refreshLatest(user.id)]);

      Alert.alert(
        'Success',
        `Successfully marked ${attendanceType}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextAction = getNextAction();
  const isCheckIn = nextAction === 'IN';
  const isDoneForToday = nextAction === null;

  if (locationLoading && !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[Colors.primary[600], Colors.primary[500]]}
          style={StyleSheet.absoluteFillObject}
        />
        <Loading message="Getting your location..." size="lg" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={
          isCheckIn
            ? [Colors.success[600], Colors.success[500]]
            : [Colors.error[600], Colors.error[500]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerNav}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.neutral[0]} />
          </Pressable>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <View style={styles.backButton} />
        </View>

        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.actionPreview}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={styles.actionIcon}
            >
              <Ionicons
                name={isCheckIn ? 'log-in' : 'log-out'}
                size={40}
                color={Colors.neutral[0]}
              />
            </LinearGradient>
            <Text style={styles.actionLabel}>
              {isCheckIn ? 'Checking In' : 'Checking Out'}
            </Text>
            <Text style={styles.actionTime}>
              {new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentLocation && (
          <>
            {/* Location Status */}
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <LocationStatus
                accuracy={currentLocation.accuracy}
                latitude={currentLocation.latitude}
                longitude={currentLocation.longitude}
              />
            </Animated.View>

            {/* Zone Information */}
            {nearestZone ? (
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }}
              >
                <ZoneIndicator
                  zoneName={nearestZone.zone.name}
                  siteName={selectedSite?.name}
                  distance={nearestZone.distance}
                  isValid={validation.isValid}
                />
              </Animated.View>
            ) : zones.length === 0 ? (
              <Card variant="elevated" style={{ marginHorizontal: Spacing[4] }}>
                <View style={styles.warningContent}>
                  <View style={styles.warningIcon}>
                    <Ionicons
                      name="warning"
                      size={24}
                      color={Colors.warning[500]}
                    />
                  </View>
                  <Text style={styles.warningText}>
                    No zones available. Please contact your administrator.
                  </Text>
                </View>
              </Card>
            ) : null}

            {/* Error Message */}
            {locationError && (
              <Card variant="elevated" style={{ marginHorizontal: Spacing[4] }}>
                <View style={styles.errorContent}>
                  <View style={styles.errorIcon}>
                    <Ionicons
                      name="alert-circle"
                      size={24}
                      color={Colors.error[500]}
                    />
                  </View>
                  <Text style={styles.errorText}>{locationError}</Text>
                </View>
              </Card>
            )}

            {/* Validation Error */}
            {!validation.isValid && (
              <Card
                variant="outlined"
                style={{
                  marginHorizontal: Spacing[4],
                  borderColor: Colors.error[200],
                  backgroundColor: Colors.error[50],
                }}
              >
                <View style={styles.validationContent}>
                  <View style={styles.validationIcon}>
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={Colors.error[500]}
                    />
                  </View>
                  <View style={styles.validationTextContainer}>
                    <Text style={styles.validationTitle}>Cannot Mark Attendance</Text>
                    <Text style={styles.validationText}>
                      {validation.error}
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              {isDoneForToday ? (
                <Card variant="outlined" style={styles.doneCard}>
                  <View style={styles.doneContent}>
                    <Ionicons name="checkmark-done" size={32} color={Colors.primary[500]} />
                    <Text style={styles.doneTitle}>Done for today</Text>
                    <Text style={styles.doneText}>
                      You have already checked in and checked out for today.
                    </Text>
                  </View>
                </Card>
              ) : (
                <Animated.View style={{ transform: [{ scale: validation.isValid ? pulseAnim : 1 }] }}>
                  <Button
                    title={`Mark ${nextAction}`}
                    onPress={handleMarkAttendance}
                    variant={isCheckIn ? 'success' : 'danger'}
                    size="lg"
                    icon={isCheckIn ? 'log-in' : 'log-out'}
                    disabled={!validation.isValid || isSubmitting}
                    loading={isSubmitting}
                  />
                </Animated.View>
              )}

              <View style={styles.refreshButtonContainer}>
                <Button
                  title="Refresh Location"
                  onPress={fetchLocation}
                  variant="outline"
                  size="md"
                  icon="refresh"
                  disabled={locationLoading}
                />
              </View>
            </View>
          </>
        )}

        {!currentLocation && !locationLoading && (
          <Card variant="elevated" style={{ marginHorizontal: Spacing[4] }}>
            <View style={styles.noLocationContent}>
              <View style={styles.noLocationIcon}>
                <Ionicons
                  name="location-outline"
                  size={48}
                  color={Colors.neutral[300]}
                />
              </View>
              <Text style={styles.noLocationTitle}>Location Unavailable</Text>
              <Text style={styles.noLocationText}>
                Failed to get your location. Please try again.
              </Text>
              <Button
                title="Try Again"
                onPress={fetchLocation}
                variant="primary"
                size="md"
                icon="refresh"
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: Spacing[8],
    borderBottomLeftRadius: BorderRadius['3xl'],
    borderBottomRightRadius: BorderRadius['3xl'],
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[0],
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
  },
  actionPreview: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  actionLabel: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[0],
    marginBottom: Spacing[1],
  },
  actionTime: {
    fontSize: Typography.size.lg,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
    marginTop: -Spacing[4],
  },
  scrollContent: {
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
  },
  actionSection: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },
  doneCard: {
    marginBottom: Spacing[3],
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  doneContent: {
    alignItems: 'center',
  },
  doneTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[900],
    marginTop: Spacing[2],
  },
  doneText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    marginTop: Spacing[1],
    textAlign: 'center',
  },
  refreshButtonContainer: {
    marginTop: Spacing[3],
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.warning[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  warningText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.warning[700],
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  errorText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: Colors.error[700],
  },
  validationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  validationIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.error[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  validationTextContainer: {
    flex: 1,
  },
  validationTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.error[700],
    marginBottom: Spacing[1],
  },
  validationText: {
    fontSize: Typography.size.sm,
    color: Colors.error[600],
  },
  noLocationContent: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  noLocationIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  noLocationTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[700],
    marginBottom: Spacing[2],
  },
  noLocationText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
});

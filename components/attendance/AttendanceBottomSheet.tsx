import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useGeoFence } from '@/hooks/useGeoFence';
import { useLocationStore } from '@/store/location.store';
import { useAttendanceStore } from '@/store/attendance.store';
import { markAttendance } from '@/services/attendance.service';
import { Zone } from '@/utils/geo.utils';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface AttendanceBottomSheetProps {
  onClose: () => void;
  actionType: 'IN' | 'OUT';
}

export const AttendanceBottomSheet: React.FC<AttendanceBottomSheetProps> = ({
  onClose,
  actionType,
}) => {
  const { user } = useAuth();
  const {
    currentLocation,
    fetchLocation,
    isLoading: locationLoading,
  } = useLocation();
  const {
    zones,
    nearestZone,
    selectedSite,
    noLocationRequired,
    findNearestZoneForLocation,
  } = useLocationStore();
  const { todayRecords, addRecord, refreshToday, refreshLatest } = useAttendanceStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

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
    // Check if user is inside ANY assigned zone (prefer zones user is inside)
    if (currentLocation && zones.length > 0) {
      const { isInsideZone } = require('@/utils/geo.utils');
      
      // First, check if inside any zone
      for (const zone of zones) {
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
        
        const inside = isInsideZone(
          currentLocation.latitude,
          currentLocation.longitude,
          geoZone
        );
        
        if (inside) {
          // If inside this zone, use it!
          setSelectedZone(geoZone);
          return;
        }
      }
    }
    
    // If not inside any zone, fall back to nearest zone
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
  }, [nearestZone, zones, currentLocation]);

  // Check if user is inside ANY zone (not just selected)
  const checkAnyZone = (): boolean => {
    if (!currentLocation || zones.length === 0) return false;
    
    const { isInsideZone } = require('@/utils/geo.utils');
    
    for (const zone of zones) {
      const geoZone: Zone =
        zone.type === 'circle'
          ? { type: 'circle', center: zone.coordinates, radius: zone.radius! }
          : zone.type === 'polygon'
          ? { type: 'polygon', coordinates: zone.coordinates }
          : { type: 'digipin', center: zone.coordinates, gridSize: zone.radius || 100, pin: zone.id };
      
      if (isInsideZone(currentLocation.latitude, currentLocation.longitude, geoZone)) {
        return true;
      }
    }
    return false;
  };
  
  const { validateZone } = useGeoFence(selectedZone);
  const baseValidation = validateZone();
  
  // Override validation to check all zones OR if no location is required
  const validation = {
    ...baseValidation,
    isInsideZone: noLocationRequired || checkAnyZone(),
    isValid: noLocationRequired || (baseValidation.hasGoodAccuracy && checkAnyZone()),
    error: noLocationRequired
      ? undefined
      : !baseValidation.hasGoodAccuracy
      ? baseValidation.error
      : !checkAnyZone()
      ? 'You are outside all assigned attendance zones'
      : undefined,
  };

  const handleMarkAttendance = async () => {
    if (!user || !currentLocation) {
      Alert.alert('Error', 'Missing required information');
      return;
    }
    
    // If no location required, allow marking without zone
    let insideZone: typeof zones[0] | null = null;
    
    if (!noLocationRequired) {
      // Find which zone the user is inside
      const { isInsideZone } = require('@/utils/geo.utils');
      
      for (const zone of zones) {
        const geoZone: Zone =
          zone.type === 'circle'
            ? { type: 'circle', center: zone.coordinates, radius: zone.radius! }
            : zone.type === 'polygon'
            ? { type: 'polygon', coordinates: zone.coordinates }
            : { type: 'digipin', center: zone.coordinates, gridSize: zone.radius || 100, pin: zone.id };
        
        if (isInsideZone(currentLocation.latitude, currentLocation.longitude, geoZone)) {
          insideZone = zone;
          break;
        }
      }
      
      if (!insideZone) {
        Alert.alert('Error', 'You are not inside any assigned zone');
        return;
      }
    }

    const hasCheckIn = todayRecords.some((r) => r.type === 'IN');
    const hasCheckOut = todayRecords.some((r) => r.type === 'OUT');
    if (actionType === 'IN' && hasCheckIn) {
      Alert.alert('Already checked in', 'You can only check in once per day.');
      return;
    }
    if (actionType === 'OUT' && (!hasCheckIn || hasCheckOut)) {
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
      const timestamp = Math.floor(Date.now() / 1000);

      const record = await markAttendance(
        {
          zoneId: insideZone?.id || null,
          siteId: selectedSite?.id || null,
          type: actionType,
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
        `Successfully marked ${actionType}`,
        [
          {
            text: 'OK',
            onPress: onClose,
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheckIn = actionType === 'IN';
  const getAccuracyStatus = () => {
    if (!currentLocation?.accuracy) return 'Poor';
    if (currentLocation.accuracy < 20) return 'Excellent';
    if (currentLocation.accuracy < 50) return 'Good';
    if (currentLocation.accuracy < 100) return 'Fair';
    return 'Poor';
  };

  /** GPS bar gradients: Good → army green, Fair → yellow, Poor → burnt orange */
  const GPS_COLORS = {
    armyGreen: ['#6b7329', '#49521d'] as [string, string],
    yellow: ['#ffe033', '#ffd902'] as [string, string],
    burntOrange: ['#e06d1a', '#cc5600'] as [string, string],
  };
  const getGradientColors = (): [string, string] => {
    const status = getAccuracyStatus();
    if (status === 'Excellent' || status === 'Good') return GPS_COLORS.armyGreen;
    if (status === 'Fair') return GPS_COLORS.yellow;
    return GPS_COLORS.burntOrange;
  };

  /** Mark button 3D gradients (lighter top → darker bottom): IN = army green, OUT = burnt orange */
  const markButtonGradient = isCheckIn
    ? (['#6b7329', '#49521d'] as [string, string])
    : (['#e06d1a', '#cc5600'] as [string, string]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
      </View>

      {/* Show zone info or "no location required" message */}
      {noLocationRequired ? (
        <View style={[styles.card, styles.cardSuccess]}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationIconContainer, { backgroundColor: Colors.success[500] }]}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.neutral[0]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.zoneName}>No Location Required</Text>
              <Text style={[styles.siteName, { marginTop: 4 }]}>
                You can mark attendance from anywhere
              </Text>
            </View>
            <View style={[styles.statusBadgeContainer, styles.statusInside]}>
              <Text style={[styles.statusBadgeText, styles.statusInsideText]}>
                Available
              </Text>
            </View>
          </View>
        </View>
      ) : nearestZone ? (
        <View style={[styles.card, !validation.isValid && styles.cardWarning, validation.isValid && styles.cardSuccess]}>
          <View style={styles.locationHeader}>
            <View style={[styles.locationIconContainer, validation.isValid && { backgroundColor: Colors.success[500] }]}>
              <Ionicons name="location" size={18} color={Colors.neutral[0]} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.zoneName}>{nearestZone.zone.name}</Text>
              <View style={styles.siteRow}>
                <Ionicons
                  name="business-outline"
                  size={10}
                  color={Colors.neutral[600]}
                />
                <Text style={styles.siteName}>{selectedSite?.name}</Text>
              </View>
              {/* DEBUG: Show distance and radius */}
              {nearestZone.distance !== undefined && selectedZone && 'radius' in selectedZone && (
                <Text style={styles.debugText}>
                  Distance: {Math.round(nearestZone.distance)}m, Radius: {selectedZone.radius}m
                </Text>
              )}
            </View>
            <View
              style={[
                styles.statusBadgeContainer,
                validation.isValid ? styles.statusInside : styles.statusOutside,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  validation.isValid
                    ? styles.statusInsideText
                    : styles.statusOutsideText,
                ]}
              >
                {validation.isValid ? 'Inside Zone' : 'Outside Zone'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.card, styles.cardWarning]}>
          <View style={styles.warningContent}>
            <Ionicons name="warning" size={16} color={Colors.warning[500]} />
            <Text style={styles.warningText}>No zones available</Text>
          </View>
        </View>
      )}

      {/* GPS signal (gradient only) + circular Mark IN/OUT button */}
      <View style={styles.gpsMarkComposite}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gpsGradientBar}
        />
        <Pressable
          onPress={fetchLocation}
          disabled={locationLoading}
          style={styles.gpsReloadButton}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={Colors.neutral[0]}
            style={locationLoading ? styles.refreshIconLoading : undefined}
          />
        </Pressable>
        <Pressable
          onPress={handleMarkAttendance}
          disabled={!validation.isValid || isSubmitting || locationLoading}
          style={({ pressed }) => [
            styles.markButtonCircle,
            (!validation.isValid || isSubmitting || locationLoading) &&
              styles.markButtonCircleDisabled,
            pressed && styles.markButtonCirclePressed,
          ]}
        >
          <LinearGradient
            colors={markButtonGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.markButtonCircleGradient}
          >
            <View style={styles.markButtonHighlight} pointerEvents="none">
              <LinearGradient
                colors={['rgba(255,255,255,0.35)', 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
            <Ionicons
              name={isCheckIn ? 'log-in' : 'log-out'}
              size={22}
              color={Colors.neutral[0]}
            />
            <Text style={styles.markButtonCircleText} numberOfLines={2}>
              {isSubmitting ? '…' : (actionType === 'OUT' ? 'Mark\nOut' : 'Mark\nIn')}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Validation Error */}
      {!validation.isValid && (
        <View style={styles.errorCard}>
          <View style={styles.errorContent}>
            <Ionicons name="close-circle" size={16} color={Colors.error[500]} />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Cannot Mark Attendance</Text>
              <Text style={styles.errorText}>{validation.error}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[2],
  },
  header: {
    alignItems: 'center',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
  },
  refreshIconLoading: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
    padding: Spacing[2],
    marginBottom: Spacing[1] + 2,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  cardWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  cardSuccess: {
    backgroundColor: Colors.success[50],
    borderColor: Colors.success[300],
  },
  gpsMarkComposite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[1] + 2,
    height: 150,
    position: 'relative',
  },
  gpsGradientBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
  },
  gpsReloadButton: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  markButtonCircle: {
    position: 'absolute',
    left: '50%',
    marginLeft: -44,
    top: 26,
    width: 98,
    height: 98,
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 12 },
    }),
  },
  markButtonCircleDisabled: {
    opacity: 0.5,
  },
  markButtonCirclePressed: {
    opacity: 0.9,
  },
  markButtonCircleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[1],
  },
  markButtonHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '38%',
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    overflow: 'hidden',
  },
  markButtonCircleText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[0],
    textAlign: 'center',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[2],
  },
  locationInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  siteName: {
    fontSize: 10,
    color: Colors.neutral[600],
    marginLeft: 4,
  },
  debugText: {
    fontSize: 9,
    color: Colors.neutral[700],
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusBadgeContainer: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing[1],
  },
  statusInside: {
    backgroundColor: Colors.success[100],
  },
  statusOutside: {
    backgroundColor: Colors.error[100],
  },
  statusBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  statusInsideText: {
    color: Colors.success[700],
  },
  statusOutsideText: {
    color: Colors.error[700],
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: Typography.size.sm,
    color: Colors.warning[700],
    marginLeft: Spacing[2],
  },
  errorCard: {
    backgroundColor: Colors.error[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing[2],
    marginBottom: Spacing[1] + 2,
    borderWidth: 1,
    borderColor: Colors.error[200],
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorTextContainer: {
    flex: 1,
    marginLeft: Spacing[2],
  },
  errorTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.error[700],
    marginBottom: 2,
  },
  errorText: {
    fontSize: 10,
    color: Colors.error[600],
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface ZoneIndicatorProps {
  zoneName?: string;
  siteName?: string;
  distance?: number;
  isValid: boolean;
}

export function ZoneIndicator({ zoneName, siteName, distance, isValid }: ZoneIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for valid state
    if (isValid) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
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
    }
  }, [isValid]);

  const formatDistance = (dist?: number) => {
    if (dist === undefined) return '';
    if (dist < 1000) return `${Math.round(dist)}m away`;
    return `${(dist / 1000).toFixed(1)}km away`;
  };

  const getStatusConfig = () => {
    if (isValid) {
      return {
        icon: 'location' as const,
        gradientColors: [Colors.success[500], Colors.success[600]] as readonly [string, string],
        bgColor: Colors.success[50],
        borderColor: Colors.success[200],
        textColor: Colors.success[700],
        label: 'Within Zone',
      };
    }
    return {
      icon: 'location-outline' as const,
      gradientColors: [Colors.warning[500], Colors.warning[600]] as readonly [string, string],
      bgColor: Colors.warning[50],
      borderColor: Colors.warning[200],
      textColor: Colors.warning[700],
      label: 'Outside Zone',
    };
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card variant="outlined" padding="md" style={{ borderColor: config.borderColor, backgroundColor: config.bgColor }}>
        <View style={styles.content}>
          <Animated.View style={{ transform: [{ scale: isValid ? pulseAnim : 1 }] }}>
            <LinearGradient
              colors={config.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Ionicons
                name={config.icon}
                size={24}
                color={Colors.neutral[0]}
              />
            </LinearGradient>
          </Animated.View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              {zoneName && (
                <Text style={styles.zoneName} numberOfLines={1}>
                  {zoneName}
                </Text>
              )}
              <View style={[styles.statusBadge, { backgroundColor: config.gradientColors[0] }]}>
                <Text style={styles.statusBadgeText}>{config.label}</Text>
              </View>
            </View>
            
            {siteName && (
              <View style={styles.siteRow}>
                <Ionicons
                  name="business-outline"
                  size={14}
                  color={Colors.neutral[500]}
                />
                <Text style={styles.siteName}>{siteName}</Text>
              </View>
            )}
            
            {distance !== undefined && (
              <View style={styles.distanceRow}>
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={config.textColor}
                />
                <Text style={[styles.distanceText, { color: config.textColor }]}>
                  {formatDistance(distance)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[1],
  },
  zoneName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
    flex: 1,
    marginRight: Spacing[2],
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[0],
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  siteName: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    marginLeft: Spacing[1],
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginLeft: Spacing[1],
  },
});

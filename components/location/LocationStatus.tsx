import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface LocationStatusProps {
  accuracy: number | null;
  latitude?: number;
  longitude?: number;
}

export function LocationStatus({ accuracy, latitude, longitude }: LocationStatusProps) {
  const isValid = accuracy !== null && accuracy < 20;
  const accuracyText = accuracy !== null ? `${Math.round(accuracy)}m` : 'Unknown';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isValid) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isValid]);

  const getAccuracyLevel = () => {
    if (accuracy === null) return 'unknown';
    if (accuracy < 10) return 'excellent';
    if (accuracy < 20) return 'good';
    if (accuracy < 50) return 'fair';
    return 'poor';
  };

  const level = getAccuracyLevel();
  
  const config = {
    excellent: {
      label: 'Excellent',
      color: Colors.success[500],
      bgColor: Colors.success[50],
      gradientColors: [Colors.success[500], Colors.success[600]] as readonly [string, string],
      icon: 'radio-button-on' as const,
    },
    good: {
      label: 'Good',
      color: Colors.success[500],
      bgColor: Colors.success[50],
      gradientColors: [Colors.success[500], Colors.success[600]] as readonly [string, string],
      icon: 'radio-button-on' as const,
    },
    fair: {
      label: 'Fair',
      color: Colors.warning[500],
      bgColor: Colors.warning[50],
      gradientColors: [Colors.warning[500], Colors.warning[600]] as readonly [string, string],
      icon: 'radio-button-on' as const,
    },
    poor: {
      label: 'Poor',
      color: Colors.error[500],
      bgColor: Colors.error[50],
      gradientColors: [Colors.error[500], Colors.error[600]] as readonly [string, string],
      icon: 'warning' as const,
    },
    unknown: {
      label: 'Unknown',
      color: Colors.neutral[500],
      bgColor: Colors.neutral[100],
      gradientColors: [Colors.neutral[400], Colors.neutral[500]] as readonly [string, string],
      icon: 'help-circle' as const,
    },
  }[level];

  return (
    <Card variant="elevated" padding="md" style={{ marginHorizontal: Spacing[4] }}>
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ scale: isValid ? pulseAnim : 1 }] }}>
          <LinearGradient
            colors={config.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Ionicons name={config.icon} size={24} color={Colors.neutral[0]} />
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.label}>GPS Signal</Text>
            <View style={[styles.levelBadge, { backgroundColor: config.bgColor }]}>
              <View style={[styles.levelDot, { backgroundColor: config.color }]} />
              <Text style={[styles.levelText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          <View style={styles.accuracyRow}>
            <Text style={[styles.accuracy, { color: config.color }]}>
              {accuracyText}
            </Text>
            <Text style={styles.accuracyLabel}> accuracy</Text>
          </View>

          {latitude !== undefined && longitude !== undefined && (
            <View style={styles.coordsContainer}>
              <Ionicons
                name="navigate-outline"
                size={12}
                color={Colors.neutral[400]}
              />
              <Text style={styles.coords}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[1],
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.neutral[500],
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  levelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing[1],
  },
  levelText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  accuracy: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  accuracyLabel: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  coords: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[400],
    marginLeft: Spacing[1],
    fontFamily: 'monospace',
  },
});

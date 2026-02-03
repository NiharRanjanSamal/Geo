import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../ui/Card';
import { formatTime, isToday } from '@/utils/date.utils';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';

interface StatusCardProps {
  type: 'IN' | 'OUT' | null;
  timestamp?: number;
}

export function StatusCard({ type, timestamp }: StatusCardProps) {
  const isIn = type === 'IN';
  const isOut = type === 'OUT';
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 150,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [type]);

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (isIn) return [Colors.success[500], Colors.success[600]];
    if (isOut) return [Colors.error[500], Colors.error[600]];
    return [Colors.neutral[400], Colors.neutral[500]];
  };

  const getStatusConfig = () => {
    if (isIn) {
      return {
        icon: 'checkmark-circle' as const,
        title: 'Checked In',
        subtitle: 'You are currently at work',
        bgColor: Colors.success[50],
        accentColor: Colors.success[500],
      };
    }
    if (isOut) {
      return {
        icon: 'exit-outline' as const,
        title: 'Checked Out',
        subtitle: 'You have completed your shift',
        bgColor: Colors.error[50],
        accentColor: Colors.error[500],
      };
    }
    return {
      icon: 'time-outline' as const,
      title: 'No Attendance',
      subtitle: 'Mark your attendance to start',
      bgColor: Colors.neutral[100],
      accentColor: Colors.neutral[500],
    };
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Card
        variant="elevated"
        padding="lg"
        style={[styles.card, { backgroundColor: config.bgColor }]}
      >
        <View style={styles.content}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconContainer, Shadows.colored(config.accentColor)]}
          >
            <Ionicons name={config.icon} size={32} color={Colors.neutral[0]} />
          </LinearGradient>

          <View style={styles.textContainer}>
            <Text style={[styles.statusTitle, { color: Colors.neutral[900] }]}>
              {config.title}
            </Text>
            <Text style={styles.statusSubtitle}>{config.subtitle}</Text>
            
            {timestamp && (
              <View style={styles.timeContainer}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={config.accentColor}
                />
                <Text style={[styles.timeText, { color: config.accentColor }]}>
                  {isToday(timestamp) ? 'Today' : 'Previous'} at {formatTime(timestamp)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Status indicator bar */}
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.statusBar}
        />
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing[4],
  },
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  textContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing[1],
  },
  statusSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    marginBottom: Spacing[2],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  timeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginLeft: Spacing[1],
  },
  statusBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});

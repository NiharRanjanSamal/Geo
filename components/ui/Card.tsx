import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient' | 'glass';
  gradientColors?: readonly [string, string, ...string[]];
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  style,
  variant = 'default',
  gradientColors,
  onPress,
  padding = 'md',
}: CardProps) {
  const paddingValue = {
    none: 0,
    sm: Spacing[3],
    md: Spacing[4],
    lg: Spacing[6],
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: Colors.neutral[0],
          ...Shadows.lg,
        };
      case 'outlined':
        return {
          backgroundColor: Colors.neutral[0],
          borderWidth: 1,
          borderColor: Colors.neutral[200],
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.5)',
          ...Shadows.md,
        };
      case 'gradient':
        return {};
      default:
        return {
          backgroundColor: Colors.neutral[0],
          ...Shadows.md,
        };
    }
  };

  const cardContent = (
    <View
      style={[
        styles.card,
        { padding: paddingValue[padding] },
        getVariantStyles(),
        style,
      ]}
    >
      {children}
    </View>
  );

  if (variant === 'gradient') {
    const colors = gradientColors || [Colors.primary[500], Colors.primary[600]];
    return onPress ? (
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.card,
            { padding: paddingValue[padding] },
            Shadows.lg,
            style,
          ]}
        >
          {children}
        </LinearGradient>
      </Pressable>
    ) : (
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          { padding: paddingValue[padding] },
          Shadows.lg,
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed && styles.pressed,
        ]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius['2xl'],
    marginVertical: Spacing[2],
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
});

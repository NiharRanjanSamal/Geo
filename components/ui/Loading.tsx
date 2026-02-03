import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@/constants/theme';

interface LoadingProps {
  message?: string;
  variant?: 'default' | 'overlay' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ message, variant = 'default', size = 'md' }: LoadingProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rotate animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    rotateAnimation.start();
    pulseAnimation.start();

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeConfig = {
    sm: { container: 32, icon: 20 },
    md: { container: 48, icon: 28 },
    lg: { container: 64, icon: 36 },
  };

  const currentSize = sizeConfig[size];

  const renderSpinner = () => (
    <Animated.View
      style={[
        styles.spinnerContainer,
        {
          width: currentSize.container,
          height: currentSize.container,
          transform: [{ rotate: spin }, { scale: pulseAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[Colors.primary[500], Colors.primary[400], Colors.primary[300]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.spinner,
          {
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: currentSize.container / 2,
          },
        ]}
      >
        <View
          style={[
            styles.spinnerInner,
            {
              width: currentSize.container - 8,
              height: currentSize.container - 8,
              borderRadius: (currentSize.container - 8) / 2,
            },
          ]}
        />
      </LinearGradient>
    </Animated.View>
  );

  if (variant === 'inline') {
    return (
      <Animated.View style={[styles.inlineContainer, { opacity: fadeAnim }]}>
        {renderSpinner()}
        {message && <Text style={styles.inlineMessage}>{message}</Text>}
      </Animated.View>
    );
  }

  if (variant === 'overlay') {
    return (
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.overlayContent}>
          {renderSpinner()}
          {message && <Text style={styles.overlayMessage}>{message}</Text>}
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderSpinner()}
      {message && <Text style={styles.message}>{message}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[6],
  },
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerInner: {
    backgroundColor: Colors.neutral[50],
  },
  message: {
    marginTop: Spacing[4],
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[3],
  },
  inlineMessage: {
    marginLeft: Spacing[3],
    fontSize: Typography.size.sm,
    color: Colors.neutral[600],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overlayContent: {
    alignItems: 'center',
    padding: Spacing[6],
    backgroundColor: Colors.neutral[0],
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  overlayMessage: {
    marginTop: Spacing[4],
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    color: Colors.neutral[700],
  },
});

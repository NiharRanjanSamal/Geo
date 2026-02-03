import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Typography, Shadows, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled' | 'outlined';
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  variant = 'default',
  secureTextEntry,
  ...textInputProps
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: false,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: false,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  const getBorderColor = () => {
    if (error) return Colors.error[500];
    if (isFocused) return Colors.primary[500];
    return Colors.neutral[200];
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'filled':
        return isFocused ? Colors.neutral[50] : Colors.neutral[100];
      case 'outlined':
        return 'transparent';
      default:
        return Colors.neutral[0];
    }
  };

  const animatedBorderWidth = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
      )}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
            borderWidth: animatedBorderWidth,
          },
          isFocused && Shadows.sm,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? Colors.primary[500] : Colors.neutral[400]}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || secureTextEntry) && styles.inputWithRightIcon,
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={Colors.neutral[400]}
          selectionColor={Colors.primary[500]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...textInputProps}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.neutral[400]}
            />
          </Pressable>
        )}
        {rightIcon && !secureTextEntry && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? Colors.primary[500] : Colors.neutral[400]}
            />
          </Pressable>
        )}
      </Animated.View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={14} color={Colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[700],
    marginBottom: Spacing[2],
  },
  labelError: {
    color: Colors.error[600],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    fontSize: Typography.size.base,
    color: Colors.neutral[900],
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing[1],
  },
  inputWithRightIcon: {
    paddingRight: Spacing[1],
  },
  leftIcon: {
    marginLeft: Spacing[4],
  },
  rightIconContainer: {
    padding: Spacing[3],
    marginRight: Spacing[1],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  errorText: {
    fontSize: Typography.size.xs,
    color: Colors.error[500],
    marginLeft: Spacing[1],
  },
  hintText: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[500],
    marginTop: Spacing[1],
  },
});

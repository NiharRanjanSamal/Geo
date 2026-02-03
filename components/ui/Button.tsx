import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius, Typography } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  
  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, iconSize: 16, fontSize: Typography.size.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, iconSize: 20, fontSize: Typography.size.base },
    lg: { paddingVertical: 18, paddingHorizontal: 32, iconSize: 24, fontSize: Typography.size.lg },
  };

  const currentSize = sizeStyles[size];

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (variant) {
      case 'primary':
        return [Colors.primary[500], Colors.primary[600]];
      case 'success':
        return [Colors.success[500], Colors.success[600]];
      case 'danger':
        return [Colors.error[500], Colors.error[600]];
      default:
        return [Colors.neutral[100], Colors.neutral[200]];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return Colors.neutral[0];
      case 'secondary':
        return Colors.primary[600];
      case 'ghost':
        return Colors.primary[600];
      case 'outline':
        return Colors.primary[600];
      default:
        return Colors.neutral[0];
    }
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={getTextColor()}
              style={styles.iconLeft}
            />
          )}
          <Text
            style={[
              styles.text,
              { fontSize: currentSize.fontSize, color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={currentSize.iconSize}
              color={getTextColor()}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  // Use gradient for primary, success, danger variants
  if (['primary', 'success', 'danger'].includes(variant)) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            variant === 'primary' && Shadows.colored(Colors.primary[500]),
            variant === 'success' && Shadows.colored(Colors.success[500]),
            variant === 'danger' && Shadows.colored(Colors.error[500]),
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Non-gradient variants
  const variantStyles = {
    secondary: {
      backgroundColor: Colors.primary[50],
      borderWidth: 0,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: Colors.primary[500],
    },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        variantStyles[variant as keyof typeof variantStyles],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        variant === 'secondary' && Shadows.sm,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: Typography.weight.semibold,
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Pressable,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validateEmail } from '@/utils/validation.utils';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { apiClient } from '@/services/api';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formSlide = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 80,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.spring(formSlide, {
        toValue: 0,
        damping: 18,
        stiffness: 80,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRequestReset = async () => {
    setErrors({});
    
    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.getClient().post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      Alert.alert(
        'Email Sent!',
        `A password reset link has been sent to ${email.trim()}. Please check your email and click the link to reset your password.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to request password reset. Please try again.';
      Alert.alert('Request Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    
    if (!resetToken.trim()) {
      newErrors.resetToken = 'Reset token is required';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.getClient().post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        token: resetToken.trim(),
        newPassword: newPassword,
      });

      Alert.alert(
        'Password Reset Successful',
        'Your password has been changed. You can now login with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password. Please check your token and try again.';
      Alert.alert('Reset Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={[Colors.primary[700], Colors.primary[600], Colors.primary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Decorative Circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoSection,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim },
                  { scale: logoScale },
                ],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[Colors.neutral[0], Colors.neutral[100]]}
                style={styles.logoBackground}
              >
                <Ionicons name="key" size={40} color={Colors.primary[500]} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Reset Password</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            {step === 'request' ? (
              <>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Forgot Password?</Text>
                  <Text style={styles.formSubtitle}>
                    Enter your email address and we'll help you reset your password
                  </Text>
                </View>

                <View style={styles.form}>
                  <Input
                    label="Email Address"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={errors.email}
                    leftIcon="mail-outline"
                    variant="filled"
                  />

                  <Button
                    title="Request Reset"
                    onPress={handleRequestReset}
                    loading={isLoading}
                    size="lg"
                    icon="send"
                    iconPosition="right"
                  />

                  <Pressable 
                    style={styles.backLink}
                    onPress={() => router.back()}
                  >
                    <Ionicons name="arrow-back" size={16} color={Colors.primary[600]} />
                    <Text style={styles.backLinkText}>Back to Login</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>Enter Reset Token</Text>
                  <Text style={styles.formSubtitle}>
                    Enter the reset token provided by your administrator and choose a new password
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color={Colors.primary[600]} />
                    <Text style={styles.infoText}>
                      Contact your administrator to get the password reset token.
                    </Text>
                  </View>

                  <Input
                    label="Reset Token"
                    placeholder="Enter the token from admin"
                    value={resetToken}
                    onChangeText={setResetToken}
                    autoCapitalize="none"
                    error={errors.resetToken}
                    leftIcon="ticket-outline"
                    variant="filled"
                  />

                  <Input
                    label="New Password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    error={errors.newPassword}
                    leftIcon="lock-closed-outline"
                    variant="filled"
                  />

                  <Input
                    label="Confirm New Password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    error={errors.confirmPassword}
                    leftIcon="lock-closed-outline"
                    variant="filled"
                  />

                  <Button
                    title="Reset Password"
                    onPress={handleResetPassword}
                    loading={isLoading}
                    size="lg"
                    icon="checkmark-circle"
                    iconPosition="right"
                  />

                  <Pressable 
                    style={styles.backLink}
                    onPress={() => setStep('request')}
                  >
                    <Ionicons name="arrow-back" size={16} color={Colors.primary[600]} />
                    <Text style={styles.backLinkText}>Back</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary[600],
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    top: height * 0.3,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorCircle3: {
    position: 'absolute',
    bottom: 100,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: height * 0.1,
    paddingBottom: Spacing[6],
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  logoContainer: {
    marginBottom: Spacing[3],
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  appName: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[0],
  },
  formContainer: {
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[6],
    ...Shadows.xl,
  },
  formHeader: {
    marginBottom: Spacing[6],
  },
  formTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing[1],
  },
  formSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    lineHeight: Typography.size.sm * 1.5,
  },
  form: {
    width: '100%',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[4],
  },
  infoText: {
    fontSize: Typography.size.sm,
    color: Colors.primary[700],
    marginLeft: Spacing[2],
    flex: 1,
    lineHeight: Typography.size.sm * 1.4,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[4],
    gap: Spacing[2],
  },
  backLinkText: {
    fontSize: Typography.size.sm,
    color: Colors.primary[600],
    fontWeight: Typography.weight.medium,
  },
});

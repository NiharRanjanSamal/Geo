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
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { validateEmail, validatePassword } from '@/utils/validation.utils';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { BiometricService } from '@/services/biometric.service';
import { GoogleAuthService } from '@/services/google-auth.service';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');

  // Google Auth
  const { request, response, promptAsync } = GoogleAuthService.useGoogleAuth();

  // Animations
  // Default to visible in case animations are disabled or fail to start on-device.
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

    // Check biometric availability
    checkBiometricAvailability();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    if (response) {
      GoogleAuthService.handleGoogleSignIn(response, async (userData) => {
        // Here you would call your backend to authenticate with Google token
        // For now, we'll show the user data
        Alert.alert(
          t('login.googleSignInSuccess'),
          `${t('login.googleSignInWelcome')} ${userData.user.name}!\n\nTo complete Google Sign-In, you need to:\n1. Add a backend endpoint for OAuth authentication\n2. Send the Google token to your server\n3. Create/login the user in your database`,
          [{ text: t('common.ok') }]
        );
        
        // TODO: Implement backend OAuth endpoint
        // await loginWithGoogle(userData.idToken);
      });
    }
  }, [response]);

  const checkBiometricAvailability = async () => {
    const available = await BiometricService.isAvailable();
    setBiometricAvailable(available);
    
    if (available) {
      const name = await BiometricService.getBiometricName();
      setBiometricName(name);
    }
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    clearError();

    // Validate inputs
    if (!email.trim()) {
      setEmailError(t('login.emailRequired'));
      return;
    }
    if (!validateEmail(email)) {
      setEmailError(t('login.validEmail'));
      return;
    }
    if (!password) {
      setPasswordError(t('login.passwordRequired'));
      return;
    }
    if (!validatePassword(password)) {
      setPasswordError(t('login.passwordMinLength'));
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      
      // Save credentials for biometric login
      await SecureStore.setItemAsync('saved_email', email.trim());
      await SecureStore.setItemAsync('saved_password', password);
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      
      router.replace('/(dashboard)');
    } catch (err: any) {
      Alert.alert(t('login.loginFailed'), err.message || t('login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      // Check if user has saved credentials
      const savedEmail = await SecureStore.getItemAsync('saved_email');
      const savedPassword = await SecureStore.getItemAsync('saved_password');
      const biometricEnabled = await SecureStore.getItemAsync('biometric_enabled');

      if (!savedEmail || !savedPassword || biometricEnabled !== 'true') {
        Alert.alert(
          t('login.biometricNotSetUp'),
          t('login.biometricSetUpMessage'),
          [{ text: t('common.ok') }]
        );
        return;
      }

      // Authenticate with biometrics
      const authenticated = await BiometricService.authenticate(
        `Sign in to GeoAttend with ${biometricName}`
      );

      if (authenticated) {
        setIsLoading(true);
        try {
          await login(savedEmail, savedPassword);
          router.replace('/(dashboard)');
        } catch (err: any) {
          Alert.alert(t('login.loginFailed'), err.message || t('login.invalidCredentials'));
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        t('common.error'),
        t('login.googleSignInError'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const handleAppleSignIn = async () => {
    Alert.alert(
      t('login.comingSoon'),
      t('login.appleSignInComingSoon'),
      [{ text: t('common.ok') }]
    );
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
                <Ionicons name="location" size={48} color={Colors.primary[500]} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>{t('login.appName')}</Text>
            <Text style={styles.tagline}>{t('login.tagline')}</Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{t('login.welcomeBack')}</Text>
              <Text style={styles.formSubtitle}>
                {t('login.signInContinue')}
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label={t('login.emailAddress')}
                placeholder={t('login.enterEmail')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={emailError}
                leftIcon="mail-outline"
                variant="filled"
              />

              <Input
                label={t('login.password')}
                placeholder={t('login.enterPassword')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                error={passwordError}
                leftIcon="lock-closed-outline"
                variant="filled"
              />

              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color={Colors.error[500]} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable 
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
              </Pressable>

              <Button
                title={t('login.signIn')}
                onPress={handleLogin}
                loading={isLoading}
                size="lg"
                icon="arrow-forward"
                iconPosition="right"
              />

              <Pressable 
                style={styles.signupLink}
                onPress={() => router.push('/(auth)/signup')}
              >
                <Text style={styles.signupLinkText}>
                  {t('login.noAccount')} <Text style={styles.signupLinkBold}>{t('login.signUp')}</Text>
                </Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('login.orContinueWith')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialButtons}>
              <Pressable 
                style={[
                  styles.socialButton,
                  !request && styles.socialButtonDisabled
                ]} 
                onPress={handleGoogleSignIn}
                disabled={!request}
              >
                <Ionicons name="logo-google" size={24} color={Colors.neutral[700]} />
              </Pressable>
              <Pressable 
                style={styles.socialButton}
                onPress={handleAppleSignIn}
              >
                <Ionicons name="logo-apple" size={24} color={Colors.neutral[700]} />
              </Pressable>
              <Pressable 
                style={[
                  styles.socialButton,
                  !biometricAvailable && styles.socialButtonDisabled
                ]}
                onPress={handleBiometricLogin}
                disabled={!biometricAvailable}
              >
                <Ionicons 
                  name="finger-print" 
                  size={24} 
                  color={biometricAvailable ? Colors.neutral[700] : Colors.neutral[400]} 
                />
              </Pressable>
            </View>
            
            {biometricAvailable && (
              <Text style={styles.biometricHint}>
                {biometricName} {t('login.biometricLoginAvailable')}
              </Text>
            )}
          </Animated.View>

          {/* Footer */}
          <Animated.View
            style={[
              styles.footer,
              { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.footerText}>
              {t('login.termsPrefix')}{' '}
              <Text style={styles.footerLink}>{t('login.termsOfService')}</Text>
              {' '}{t('login.and')}{' '}
              <Text style={styles.footerLink}>{t('login.privacyPolicy')}</Text>
            </Text>
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
    paddingTop: height * 0.08,
    paddingBottom: Spacing[6],
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  logoContainer: {
    marginBottom: Spacing[4],
  },
  logoBackground: {
    width: 96,
    height: 96,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.xl,
  },
  appName: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[0],
    marginBottom: Spacing[1],
  },
  tagline: {
    fontSize: Typography.size.base,
    color: Colors.primary[100],
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
  },
  form: {
    width: '100%',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[4],
  },
  errorText: {
    fontSize: Typography.size.sm,
    color: Colors.error[700],
    marginLeft: Spacing[2],
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing[4],
    marginTop: -Spacing[2],
  },
  forgotPasswordText: {
    fontSize: Typography.size.sm,
    color: Colors.primary[600],
    fontWeight: Typography.weight.medium,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  signupLinkText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[600],
  },
  signupLinkBold: {
    color: Colors.primary[600],
    fontWeight: Typography.weight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[6],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[500],
    marginHorizontal: Spacing[3],
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  socialButtonDisabled: {
    opacity: 0.5,
  },
  biometricHint: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[600],
    textAlign: 'center',
    marginTop: Spacing[2],
  },
  footer: {
    marginTop: Spacing[6],
    paddingHorizontal: Spacing[4],
  },
  footerText: {
    fontSize: Typography.size.xs,
    color: Colors.primary[100],
    textAlign: 'center',
    lineHeight: Typography.size.xs * Typography.lineHeight.relaxed,
  },
  footerLink: {
    color: Colors.neutral[0],
    fontWeight: Typography.weight.medium,
  },
});

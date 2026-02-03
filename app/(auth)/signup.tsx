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
import { validateEmail, validatePassword } from '@/utils/validation.utils';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { signup } from '@/services/auth.service';

const { width, height } = Dimensions.get('window');

const STEPS = [
  { id: 1, title: 'Personal & Contact', icon: 'person' },
  { id: 2, title: 'Employee Details', icon: 'briefcase' },
  { id: 3, title: 'Password', icon: 'lock-closed' },
];

export default function SignupScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeCode: '',
    companyCode: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
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

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Personal Info
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      // Contact Info
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    } else if (step === 2) {
      if (!formData.employeeCode.trim()) {
        newErrors.employeeCode = 'Employee code is required';
      }
      if (!formData.companyCode.trim()) {
        newErrors.companyCode = 'Company code is required';
      }
    } else if (step === 3) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (!validatePassword(formData.password)) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSignup = async () => {
    if (!validateStep(3)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        employeeCode: formData.employeeCode,
        companyCode: formData.companyCode,
        password: formData.password,
        displayName: formData.displayName || undefined,
      });

      Alert.alert(
        'Registration Successful!',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: any) {
      const isNetworkError = !err.response && (err.message === 'Network Error' || err.code === 'ERR_NETWORK');
      const errorMessage = isNetworkError
        ? "Can't reach the server. Check that:\n• Backend is running (npm start in server folder)\n• Phone and computer are on the same Wi‑Fi\n• API URL in constants/api.ts uses your computer's IP"
        : err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            {/* Name Fields */}
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <Input
                  label="First Name *"
                  placeholder="John"
                  value={formData.firstName}
                  onChangeText={(value) => updateField('firstName', value)}
                  autoCapitalize="words"
                  error={errors.firstName}
                  leftIcon="person-outline"
                  variant="filled"
                />
              </View>
              <View style={styles.halfField}>
                <Input
                  label="Last Name *"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChangeText={(value) => updateField('lastName', value)}
                  autoCapitalize="words"
                  error={errors.lastName}
                  leftIcon="person-outline"
                  variant="filled"
                />
              </View>
            </View>

            {/* Contact Fields */}
            <Input
              label="Email Address *"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              leftIcon="mail-outline"
              variant="filled"
            />

            <Input
              label="Phone Number *"
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              autoComplete="tel"
              error={errors.phone}
              leftIcon="call-outline"
              variant="filled"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Input
              label="Employee Code *"
              placeholder="EMP001"
              value={formData.employeeCode}
              onChangeText={(value) => updateField('employeeCode', value)}
              autoCapitalize="characters"
              error={errors.employeeCode}
              leftIcon="id-card-outline"
              variant="filled"
            />

            <Input
              label="Company Code *"
              placeholder="ABC123"
              value={formData.companyCode}
              onChangeText={(value) => updateField('companyCode', value)}
              autoCapitalize="characters"
              error={errors.companyCode}
              leftIcon="business-outline"
              variant="filled"
            />

            <Input
              label="Display Name (Optional)"
              placeholder="Johnny"
              value={formData.displayName}
              onChangeText={(value) => updateField('displayName', value)}
              autoCapitalize="words"
              leftIcon="sparkles-outline"
              variant="filled"
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Input
              label="Password *"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              error={errors.password}
              leftIcon="lock-closed-outline"
              variant="filled"
            />

            <Input
              label="Confirm Password *"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              error={errors.confirmPassword}
              leftIcon="lock-closed-outline"
              variant="filled"
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary[600]} />
              <Text style={styles.infoText}>
                Your account will be pending approval. You'll receive an email once approved by your administrator.
              </Text>
            </View>
          </View>
        );

      default:
        return null;
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
                <Ionicons name="location" size={40} color={Colors.primary[500]} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>GeoAttend</Text>
          </Animated.View>

          {/* Signup Form */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              {STEPS.map((step, index) => (
                <View key={step.id} style={styles.progressStepContainer}>
                  <View
                    style={[
                      styles.progressDot,
                      currentStep >= step.id && styles.progressDotActive,
                      currentStep > step.id && styles.progressDotCompleted,
                    ]}
                  >
                    {currentStep > step.id ? (
                      <Ionicons name="checkmark" size={16} color={Colors.neutral[0]} />
                    ) : (
                      <Text
                        style={[
                          styles.progressDotText,
                          currentStep >= step.id && styles.progressDotTextActive,
                        ]}
                      >
                        {step.id}
                      </Text>
                    )}
                  </View>
                  {index < STEPS.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        currentStep > step.id && styles.progressLineActive,
                      ]}
                    />
                  )}
                </View>
              ))}
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{STEPS[currentStep - 1].title}</Text>
              <Text style={styles.formSubtitle}>
                Step {currentStep} of {STEPS.length}
              </Text>
            </View>

            <View style={styles.form}>
              {renderStepContent()}

              {/* Navigation Buttons */}
              <View style={styles.buttonContainer}>
                {currentStep > 1 && (
                  <View style={styles.buttonHalf}>
                    <Button
                      title="Back"
                      onPress={handleBack}
                      size="lg"
                      variant="outline"
                      icon="arrow-back"
                    />
                  </View>
                )}
                <View style={[styles.buttonHalf, currentStep === 1 && styles.buttonFull]}>
                  <Button
                    title={currentStep === STEPS.length ? 'Create Account' : 'Next'}
                    onPress={currentStep === STEPS.length ? handleSignup : handleNext}
                    loading={isLoading}
                    size="lg"
                    icon={currentStep === STEPS.length ? 'checkmark-circle' : 'arrow-forward'}
                    iconPosition="right"
                  />
                </View>
              </View>

              <Pressable 
                style={styles.loginLink}
                onPress={() => router.back()}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View
            style={[
              styles.footer,
              { opacity: fadeAnim },
            ]}
          >
            <Text style={styles.footerText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
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
    paddingTop: height * 0.06,
    paddingBottom: Spacing[6],
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing[6],
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
    marginBottom: Spacing[5],
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[6],
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.primary[600],
  },
  progressDotCompleted: {
    backgroundColor: Colors.success[500],
  },
  progressDotText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[500],
  },
  progressDotTextActive: {
    color: Colors.neutral[0],
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.neutral[200],
  },
  progressLineActive: {
    backgroundColor: Colors.success[500],
  },
  stepContent: {
    marginBottom: Spacing[4],
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  buttonHalf: {
    flex: 1,
  },
  buttonFull: {
    flex: 1,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  halfField: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary[50],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[4],
    marginTop: Spacing[2],
  },
  infoText: {
    fontSize: Typography.size.sm,
    color: Colors.primary[700],
    marginLeft: Spacing[2],
    flex: 1,
    lineHeight: Typography.size.sm * 1.4,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  loginLinkText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[600],
  },
  loginLinkBold: {
    color: Colors.primary[600],
    fontWeight: Typography.weight.semibold,
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

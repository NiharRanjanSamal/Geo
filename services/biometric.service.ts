import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';

export class BiometricService {
  /**
   * Check if the device supports biometric authentication
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get the type of biometric authentication available
   */
  static async getSupportedTypes(): Promise<string[]> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Face Recognition';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Iris';
          default:
            return 'Biometric';
        }
      });
    } catch (error) {
      console.error('Error getting supported types:', error);
      return [];
    }
  }

  /**
   * Authenticate using biometrics
   */
  static async authenticate(
    promptMessage: string = 'Authenticate to sign in'
  ): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      
      if (!isAvailable) {
        Alert.alert(
          'Biometric Not Available',
          'Your device does not support biometric authentication or no biometric data is enrolled. Please use email and password to sign in.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return true;
      } else {
        if (result.error === 'user_cancel') {
          // User cancelled, no need to show error
          return false;
        } else if (result.error === 'lockout') {
          Alert.alert(
            'Too Many Attempts',
            'Biometric authentication is temporarily disabled. Please try again later.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Authentication Failed',
            'Biometric authentication failed. Please try again.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Error',
        'An error occurred during biometric authentication.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Get a user-friendly name for biometric authentication
   */
  static async getBiometricName(): Promise<string> {
    const types = await this.getSupportedTypes();
    
    if (types.includes('Face Recognition')) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    } else if (types.includes('Fingerprint')) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (types.includes('Iris')) {
      return 'Iris Scan';
    }
    
    return 'Biometric';
  }
}

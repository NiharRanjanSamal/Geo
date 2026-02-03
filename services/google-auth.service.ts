import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { Alert } from 'react-native';

// This is required for web-based OAuth flows
WebBrowser.maybeCompleteAuthSession();

export interface GoogleAuthResponse {
  accessToken: string | null;
  idToken: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    photo: string;
  } | null;
}

export class GoogleAuthService {
  /**
   * Initialize Google Sign-In
   * You need to add your OAuth credentials in app.json
   */
  static useGoogleAuth() {
    const [request, response, promptAsync] = Google.useAuthRequest({
      expoClientId: 'YOUR_EXPO_CLIENT_ID', // Add in app.json
      iosClientId: 'YOUR_IOS_CLIENT_ID', // Add in app.json
      androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Add in app.json
      webClientId: 'YOUR_WEB_CLIENT_ID', // Add in app.json
      scopes: ['profile', 'email'],
    });

    return { request, response, promptAsync };
  }

  /**
   * Get user info from Google
   */
  static async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const user = await response.json();
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        photo: user.picture,
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Handle Google Sign-In response
   */
  static async handleGoogleSignIn(
    response: any,
    onSuccess: (userData: any) => void
  ): Promise<void> {
    if (response?.type === 'success') {
      const { authentication } = response;
      
      try {
        // Get user info from Google
        const userInfo = await this.getUserInfo(authentication.accessToken);
        
        // Call your backend to authenticate/register the user
        // You'll need to add a new endpoint in your server for OAuth authentication
        onSuccess({
          accessToken: authentication.accessToken,
          idToken: authentication.idToken,
          user: userInfo,
        });
      } catch (error) {
        console.error('Error getting user info:', error);
        Alert.alert(
          'Authentication Error',
          'Failed to get user information from Google.',
          [{ text: 'OK' }]
        );
      }
    } else if (response?.type === 'error') {
      Alert.alert(
        'Google Sign-In Failed',
        'An error occurred during Google sign-in. Please try again.',
        [{ text: 'OK' }]
      );
    }
    // If type is 'cancel', user cancelled - no need to show error
  }
}

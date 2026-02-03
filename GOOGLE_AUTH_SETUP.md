# Google Authentication Setup Guide

This guide will help you set up Google Sign-In for your GeoAttend app.

## Prerequisites

- Google Cloud Console account
- Your app's bundle identifier (iOS) and package name (Android)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** for your project

## Step 2: Create OAuth 2.0 Credentials

### For Web (Testing & Development)

1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   ```
   https://auth.expo.io/@your-expo-username/geo-attendance
   ```
5. Copy the **Client ID** - this is your `WEB_CLIENT_ID`

### For Android

1. Click **Create Credentials** > **OAuth client ID**
2. Select **Android**
3. Package name: `com.geoattendance.app`
4. Get your SHA-1 certificate fingerprint:
   ```bash
   # For debug build
   keytool -keystore ~/.android/debug.keystore -list -v
   # Password is usually: android
   ```
5. Copy the **Client ID** - this is your `ANDROID_CLIENT_ID`

### For iOS

1. Click **Create Credentials** > **OAuth client ID**
2. Select **iOS**
3. Bundle ID: `com.geoattendance.app`
4. Copy the **Client ID** - this is your `IOS_CLIENT_ID`
5. Download the `GoogleService-Info.plist` file

## Step 3: Update Your App Configuration

### 3.1 Update `google-auth.service.ts`

Open `services/google-auth.service.ts` and replace the placeholder values:

```typescript
static useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID', // Optional, for Expo Go
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  return { request, response, promptAsync };
}
```

### 3.2 Add Google Service Files

**For iOS:**
- Place `GoogleService-Info.plist` in your project root

**For Android:**
- Place `google-services.json` in your project root

### 3.3 Update `app.json`

The configuration is already added, but verify these sections exist:

```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

## Step 4: Add Backend OAuth Endpoint

You need to create a backend endpoint to handle Google OAuth authentication.

### 4.1 Update Server Environment Variables

Add to `server/.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

### 4.2 Create OAuth Route

Create `server/src/routes/oauth.ts`:

```typescript
import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload!;
    
    // Check if user exists or create new user
    // ... your user logic here ...
    
    // Generate JWT token
    // ... your token logic here ...
    
    res.json({
      success: true,
      token: 'YOUR_JWT_TOKEN',
      user: { email, name, picture }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
```

### 4.3 Install Required Package

```bash
cd server
npm install google-auth-library
```

### 4.4 Register Route in Server

In `server/src/index.ts`:

```typescript
import oauthRoutes from './routes/oauth';

app.use('/api/oauth', oauthRoutes);
```

## Step 5: Update Mobile App to Use Backend

Update `services/google-auth.service.ts`:

```typescript
static async handleGoogleSignIn(
  response: any,
  onSuccess: (userData: any) => void
): Promise<void> {
  if (response?.type === 'success') {
    const { authentication } = response;
    
    try {
      // Send idToken to your backend
      const backendResponse = await fetch(`${API_BASE_URL}/oauth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: authentication.idToken }),
      });
      
      const data = await backendResponse.json();
      
      if (data.success) {
        // Save token and user data
        await SecureStore.setItemAsync('auth_token', data.token);
        onSuccess(data);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Error authenticating with backend:', error);
      Alert.alert('Authentication Error', 'Failed to authenticate with server.');
    }
  }
}
```

## Step 6: Testing

### Test Biometric Authentication

1. Sign in with email and password first
2. This will save credentials securely
3. Sign out and try the fingerprint/Face ID button
4. The biometric prompt should appear

### Test Google Sign-In

1. Click the Google icon
2. Select your Google account
3. Grant permissions
4. User should be authenticated and redirected to dashboard

## Troubleshooting

### Common Issues

1. **"Google Sign-In not working in Expo Go"**
   - Solution: Use development build or test on standalone app

2. **"Invalid OAuth client"**
   - Solution: Verify your Client IDs match your app's bundle ID/package name

3. **"Biometric not available"**
   - Solution: Ensure device has biometric hardware and at least one fingerprint/face enrolled

4. **"Unauthorized redirect URI"**
   - Solution: Add the correct redirect URI in Google Cloud Console

### Debug Mode

Enable debug logging in your services:

```typescript
console.log('Google auth response:', response);
console.log('Biometric available:', available);
```

## Security Best Practices

1. **Never commit** your Google Client Secret to version control
2. Store sensitive credentials in `.env` files
3. Use HTTPS for production
4. Validate tokens on the backend
5. Implement rate limiting for OAuth endpoints
6. Regularly rotate your OAuth credentials

## Additional Resources

- [Expo Google Sign-In Documentation](https://docs.expo.dev/guides/authentication/#google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)

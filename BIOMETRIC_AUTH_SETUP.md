# Biometric Authentication Setup Guide

This guide explains how biometric authentication (Fingerprint/Face ID) works in your GeoAttend app.

## Overview

Biometric authentication provides a quick and secure way for users to sign in to the app without typing their credentials every time.

## How It Works

1. **First Time Setup:**
   - User signs in with email and password
   - Credentials are securely stored in device's secure storage
   - Biometric authentication is automatically enabled

2. **Subsequent Logins:**
   - User taps the fingerprint/Face ID button
   - Device prompts for biometric verification
   - Upon successful verification, user is automatically signed in

## Features Implemented

### ✅ Automatic Detection
- The app automatically detects if the device supports biometric authentication
- Checks if user has enrolled fingerprints or Face ID
- Disables the button if biometric is not available

### ✅ Secure Storage
- User credentials are stored using `expo-secure-store`
- Data is encrypted and stored in device's secure enclave
- Only accessible after biometric verification

### ✅ User-Friendly Messages
- Shows appropriate icon based on device capability
- Displays biometric type (Touch ID, Face ID, Fingerprint)
- Provides clear feedback for errors

### ✅ Fallback Options
- Users can always sign in with email/password
- System password fallback available if biometric fails

## Device Requirements

### iOS
- **Touch ID:** iPhone 5s or later, iPad with Touch ID
- **Face ID:** iPhone X or later, iPad Pro 11" or later

### Android
- Fingerprint sensor or Face unlock
- Android 6.0 (API 23) or later
- Device must have at least one biometric enrolled

## Security Features

1. **Secure Enclave:** Credentials stored in device's secure hardware
2. **No Plain Text:** Passwords never stored in plain text
3. **Device-Only:** Biometric data never leaves the device
4. **Auto-Clear:** Credentials cleared when user signs out
5. **Re-authentication:** Requires biometric verification each time

## Testing Biometric Authentication

### Test on Physical Device

**Note:** Biometric authentication doesn't work in simulators/emulators. Test on real devices.

#### iOS Testing Steps:

1. **Ensure Face ID/Touch ID is set up:**
   - Settings → Face ID & Passcode (or Touch ID & Passcode)
   - Add at least one biometric

2. **Test the app:**
   - Launch GeoAttend
   - Sign in with email and password
   - Sign out
   - You should now see "Face ID login available" or "Touch ID login available"
   - Tap the fingerprint button
   - Authenticate with Face ID/Touch ID

#### Android Testing Steps:

1. **Ensure fingerprint is enrolled:**
   - Settings → Security → Fingerprint
   - Add at least one fingerprint

2. **Test the app:**
   - Launch GeoAttend
   - Sign in with email and password
   - Sign out
   - You should see "Fingerprint login available"
   - Tap the fingerprint button
   - Authenticate with your fingerprint

### Simulator/Emulator Testing

For development purposes, you can test the UI:

**iOS Simulator:**
```bash
# Enable Touch ID/Face ID simulation
# In iOS Simulator: Features → Touch ID/Face ID → Enrolled
# Then use: Features → Touch ID/Face ID → Matching Touch/Face
```

**Android Emulator:**
```bash
# Enable fingerprint in emulator
# Settings → Security → Fingerprint
# Use adb to simulate fingerprint:
adb -e emu finger touch 1
```

## User Flow

### First Login (Enable Biometric)

```
1. User opens app
2. Enters email and password
3. Taps "Sign In"
4. ✅ Credentials saved securely
5. ✅ Biometric enabled automatically
6. Navigated to dashboard
```

### Subsequent Login (Use Biometric)

```
1. User opens app
2. Taps fingerprint/Face ID button
3. Device shows biometric prompt
4. User authenticates with biometric
5. ✅ Auto-signed in
6. Navigated to dashboard
```

### Disabling Biometric

Users can disable biometric by:
- Signing out of the app
- Clearing app data
- Uninstalling and reinstalling

## Code Structure

### Files Modified/Added

1. **`services/biometric.service.ts`**
   - Main biometric service
   - Handles availability checks
   - Manages authentication flow

2. **`app/(auth)/login.tsx`**
   - Updated with biometric button functionality
   - Saves credentials on successful login
   - Retrieves and uses saved credentials

3. **`app.json`**
   - Added biometric permissions
   - Added Face ID usage description

## Error Handling

The app handles various biometric scenarios:

| Scenario | Behavior |
|----------|----------|
| No biometric hardware | Button disabled, no error shown |
| No biometric enrolled | Alert: "Please set up biometric first" |
| Biometric not set up in app | Alert: "Sign in with email first" |
| User cancels | No error, returns to login screen |
| Too many failed attempts | Alert: "Try again later" |
| Authentication fails | Alert: "Authentication failed" |

## Privacy & Security

### What We Store
- ✅ Email address (encrypted)
- ✅ Password (encrypted)
- ✅ Biometric enabled flag

### What We DON'T Store
- ❌ Actual biometric data (stays on device)
- ❌ Biometric templates
- ❌ Face/fingerprint images

### Where Data is Stored
- **iOS:** Keychain Services (secure enclave)
- **Android:** Keystore System (hardware-backed)

## Best Practices Implemented

1. ✅ Require initial email/password login
2. ✅ Store credentials securely
3. ✅ Check device capability before enabling
4. ✅ Provide clear user feedback
5. ✅ Handle all error cases gracefully
6. ✅ Don't force users to use biometric
7. ✅ Clear credentials on sign out

## Troubleshooting

### "Biometric Login Not Available"

**Possible causes:**
1. Device doesn't have biometric hardware
2. No biometric is enrolled on device
3. User hasn't signed in with email/password first

**Solution:** 
1. Check device settings and enroll biometric
2. Sign in with email and password once
3. Then biometric will be enabled

### "Authentication Failed"

**Possible causes:**
1. Biometric doesn't match enrolled data
2. Too many failed attempts
3. Sensor is dirty or wet

**Solution:**
1. Try again with different finger/angle
2. Clean the sensor
3. Wait if locked out
4. Use email/password instead

### "Button is Disabled"

**Cause:** Device doesn't support biometric or none enrolled

**Solution:** Check device settings and add biometric

## Additional Features to Consider

Future enhancements you might want to add:

1. **Biometric Settings Page:**
   - Toggle to enable/disable biometric
   - Option to clear saved credentials
   - View which account has biometric enabled

2. **Multiple Account Support:**
   - Save biometric for multiple accounts
   - Choose account when using biometric

3. **Biometric for Sensitive Actions:**
   - Require biometric for check-in/check-out
   - Require biometric for viewing sensitive data
   - Require biometric before viewing salary/reports

4. **Smart Biometric Prompts:**
   - Auto-show biometric on app launch
   - Remember user preference for auto-prompt
   - Background authentication for seamless UX

## Resources

- [Expo Local Authentication Docs](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [iOS Face ID Documentation](https://developer.apple.com/documentation/localauthentication)
- [Android BiometricPrompt Documentation](https://developer.android.com/training/sign-in/biometric-auth)

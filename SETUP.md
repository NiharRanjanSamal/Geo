# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## First Run

1. The app will request location permissions on first launch
2. Use any email/password to login (mock authentication in dev mode)
3. The app will load mock sites and zones for testing

## Mock Data

In development mode (`__DEV__`), the app uses mock API responses:

- **Login**: Any email/password works
- **Sites**: 2 mock sites (Main Office, Branch Office)
- **Zones**: Circle and Polygon zones for testing
- **Attendance**: Stored locally in SQLite

## Testing Geo-Fencing

1. The mock zones are set around coordinates:
   - Main Office: 40.7128, -74.0060 (New York area)
   - Branch Office: 40.7580, -73.9855

2. To test:
   - Use a location simulator/spoofer
   - Set coordinates within 50m of zone center
   - GPS accuracy must be < 20m

## Production Setup

1. Update API base URL in `services/api.ts`
2. Replace mock implementations in service files
3. Configure proper network detection (use @react-native-community/netinfo)
4. Add real assets (icon.png, splash.png, etc.)
5. Configure EAS Build for production builds

## Troubleshooting

### Location Permission Issues
- Check `app.json` permissions configuration
- Ensure location services are enabled on device
- For iOS, check Info.plist location usage descriptions

### Database Errors
- Database auto-initializes on first app launch
- If issues occur, clear app data and restart

### Sync Issues
- Background sync requires location permissions
- Check network connectivity
- Review sync queue in database

## Next Steps

1. Connect to real API endpoints
2. Add proper error handling and retry logic
3. Implement push notifications for sync status
4. Add analytics and crash reporting
5. Set up CI/CD pipeline

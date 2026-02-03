import { Ionicons } from '@expo/vector-icons';
import { Stack, SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/store/auth.store';
import { initDatabase } from '@/db/attendance';
import { initSyncQueue } from '@/db/sync-queue';
import { startBackgroundSync, stopBackgroundSync } from '@/services/sync.service';

const ANDROID_NAV_BAR_GREEN = '#1B4332';

function setAndroidNavBarOpaque() {
  if (Platform.OS !== 'android') return;
  NavigationBar.setBackgroundColorAsync(ANDROID_NAV_BAR_GREEN).catch(() => {});
  NavigationBar.setButtonStyleAsync('light').catch(() => {});
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    setAndroidNavBarOpaque();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setAndroidNavBarOpaque();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Initialize database and check auth
    const initialize = async () => {
      try {
        await initDatabase();
        await initSyncQueue();
        await checkAuth();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    // Start/stop background sync based on auth state
    const setupSync = async () => {
      if (isAuthenticated) {
        await startBackgroundSync();
      } else {
        await stopBackgroundSync();
      }
    };

    if (!isLoading) {
      setupSync();
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(dashboard)" />
        <Stack.Screen name="mark" options={{ presentation: 'modal' }} />
      </Stack>
    </LanguageProvider>
  );
}

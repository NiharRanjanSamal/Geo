import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TabBar } from '@/constants/theme';
import { useLanguage } from '@/contexts/LanguageContext';

const TAB_BAR_HEIGHT = 60;

export default function DashboardLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  // Inset the whole tab area from the bottom so nothing draws under the Android system nav bar.
  const bottomInset = insets.bottom ?? 0;

  return (
    <View style={[styles.wrapper, { paddingBottom: bottomInset }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 20,
            right: 20,
          height: TAB_BAR_HEIGHT,
          backgroundColor: TabBar.backgroundColor,
          borderTopLeftRadius: 35,
          borderTopRightRadius: 35,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderTopWidth: 0,
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          overflow: 'hidden',
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#FFFFFF',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabItem,
                focused && styles.tabItemActive,
              ]}
            >
              <Ionicons name="home" size={22} color="#FFFFFF" />
              {focused && <Text style={styles.tabLabel}>{t('tabs.home')}</Text>}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabItem,
                focused && styles.tabItemActive,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color="#FFFFFF"
              />
              {focused && (
                <Text style={styles.tabLabel}>{t('tabs.calendar')}</Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.tabItem,
                focused && styles.tabItemActive,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={22}
                color="#FFFFFF"
              />
              {focused && (
                <Text style={styles.tabLabel}>{t('tabs.profile')}</Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    minWidth: 125,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  tabItemActive: {
    backgroundColor: TabBar.activeBackgroundColor,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});

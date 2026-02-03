import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Animated,
  Pressable,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAttendanceStore } from '@/store/attendance.store';
import { useLocationStore } from '@/store/location.store';
import { useLocation } from '@/hooks/useLocation';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { getSites, getSiteZones } from '@/services/sites.service';
import { Loading } from '@/components/ui/Loading';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AttendanceBottomSheet } from '@/components/attendance/AttendanceBottomSheet';
import { Ionicons } from '@expo/vector-icons';

const TAB_BAR_BOTTOM_PADDING = 60 + 32;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user, profileImageUri } = useAuth();
  const { fetchLocation, currentLocation, hasPermission, requestPermission } = useLocation();
  const { sync, isOnline } = useOfflineSync();
  const {
    todayRecords,
    latestRecord,
    refreshToday,
    refreshLatest,
    isLoading,
  } = useAttendanceStore();
  const {
    sites,
    zones,
    selectedSite,
    noLocationRequired,
    setSites,
    setZones,
    setSelectedSite,
    setNoLocationRequired,
  } = useLocationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Trigger re-render every minute when checked in to update total hours
  useEffect(() => {
    if (latestRecord?.type === 'IN') {
      const interval = setInterval(() => {
        // Force re-render by updating a state
        setCurrentTime(new Date());
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [latestRecord]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
      // DEBUG: Log database contents
      if (__DEV__) {
        import('@/scripts/check-db').then(({ logDatabaseContents }) => {
          logDatabaseContents();
        });
      }
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      await Promise.all([
        refreshToday(user.id),
        refreshLatest(user.id),
        loadSites(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const loadSites = async () => {
    try {
      const { sites: siteList, noLocationRequired: noLoc } = await getSites();
      setSites(siteList);
      setNoLocationRequired(noLoc);
      
      if (siteList.length > 0) {
        setSelectedSite(siteList[0]);
        const zoneList = await getSiteZones(siteList[0].id);
        setZones(zoneList);
      }
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), sync()]);
    setRefreshing(false);
  };

  const handleCheckInPress = async () => {
    if (isDoneForToday) {
      Alert.alert(t('dashboard.doneForTodayAlert'), t('dashboard.doneForTodayMessage'));
      return;
    }

    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(t('dashboard.permissionRequired'), t('dashboard.locationRequired'));
        return;
      }
    }

    if (!currentLocation) {
      await fetchLocation();
    }

    // Open bottom sheet instead of navigating
    setShowBottomSheet(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 17) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  const getFirstName = () => {
    const name = user?.name || t('common.user');
    return name.split(' ')[0];
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  /** One check-in and one check-out per day. Returns null when already done for today. */
  const getNextAction = (): 'IN' | 'OUT' | null => {
    const hasCheckIn = todayRecords.some((r) => r.type === 'IN');
    const hasCheckOut = todayRecords.some((r) => r.type === 'OUT');
    if (!hasCheckIn) return 'IN';
    if (hasCheckIn && !hasCheckOut) return 'OUT';
    return null;
  };

  const getCheckInTime = () => {
    // Get the latest check-in record for today
    const checkIns = todayRecords.filter(r => r.type === 'IN');
    if (checkIns.length > 0) {
      // Get the most recent check-in
      const latestCheckIn = checkIns[checkIns.length - 1];
      const date = new Date(latestCheckIn.timestamp * 1000);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '--:--';
  };

  const getCheckOutTime = () => {
    // Get the latest check-out record for today
    const checkOuts = todayRecords.filter(r => r.type === 'OUT');
    if (checkOuts.length > 0) {
      // Get the most recent check-out
      const lastCheckOut = checkOuts[checkOuts.length - 1];
      const date = new Date(lastCheckOut.timestamp * 1000);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '--:--';
  };

  const getTotalHours = () => {
    if (todayRecords.length === 0) return '--:--';
    
    let totalSeconds = 0;
    const sortedRecords = [...todayRecords].sort((a, b) => a.timestamp - b.timestamp);
    
    // Calculate total hours by pairing IN and OUT records
    for (let i = 0; i < sortedRecords.length; i++) {
      if (sortedRecords[i].type === 'IN') {
        // Find the next OUT record
        const nextOutIndex = sortedRecords.findIndex((r, idx) => idx > i && r.type === 'OUT');
        if (nextOutIndex !== -1) {
          // Paired IN-OUT found
          totalSeconds += sortedRecords[nextOutIndex].timestamp - sortedRecords[i].timestamp;
        } else {
          // Still checked in (no matching OUT), calculate time until now
          totalSeconds += Math.floor(Date.now() / 1000) - sortedRecords[i].timestamp;
        }
      }
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const nextAction = getNextAction();
  const isCheckingIn = nextAction === 'IN';
  const isDoneForToday = nextAction === null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 60 : 50,
          paddingBottom: TAB_BAR_BOTTOM_PADDING + (insets.bottom || 0),
          paddingHorizontal: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1B4332"
            colors={['#1B4332']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !todayRecords.length ? (
          <Loading message={t('dashboard.loadingAttendance')} />
        ) : (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            {/* Header Section */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 40,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: 4,
                }}>
                  Hey {getFirstName()}!
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: '#555555',
                  fontWeight: '400',
                }}>
                  {getGreeting()} {t('dashboard.markAttendance')}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Debug Button (Development Only) */}
                {__DEV__ && (
                  <Pressable
                    onPress={() => router.push('/debug-db')}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#4CAF50',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Ionicons name="bug" size={20} color="#FFFFFF" />
                  </Pressable>
                )}
                
                <Pressable
                  onPress={() => router.push('/profile')}
                  style={{ position: 'relative' }}
                >
                  {profileImageUri ? (
                    <Image
                      source={{ uri: profileImageUri }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                      }}
                    />
                  ) : (
                    <View style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: '#1B4332',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}>
                      <Text style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: '#FFFFFF',
                      }}>
                        {getFirstName().charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {!isOnline && (
                  <View style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: '#F59E0B',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                  }}>
                    <Ionicons name="cloud-offline" size={10} color="#FFFFFF" />
                  </View>
                )}
                </Pressable>
              </View>
            </View>

            {/* Time Display */}
            <View style={{ alignItems: 'center', marginBottom: 50 }}>
              <Text style={{
                fontSize: 56,
                fontWeight: '700',
                color: '#000000',
                letterSpacing: -1,
              }}>
                {formatTime(currentTime)}
              </Text>
              <Text style={{
                fontSize: 16,
                color: '#008080',
                marginTop: 8,
                fontWeight: '600',
              }}>
                {formatDate(currentTime)}
              </Text>
            </View>

            {/* Check In/Out Button */}
            <View style={{ alignItems: 'center', marginBottom: 50 }}>
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <Pressable
                  onPress={handleCheckInPress}
                  disabled={isDoneForToday}
                  style={({ pressed }) => ({
                    width: 160,
                    height: 160,
                    borderRadius: 80,
                    backgroundColor: isDoneForToday ? '#E8E8E8' : pressed ? '#E8E8E8' : '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDoneForToday ? 0.05 : 0.15,
                    shadowRadius: 20,
                    elevation: 10,
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    opacity: isDoneForToday ? 0.9 : 1,
                  })}
                >
                  <View style={{
                    width: 130,
                    height: 130,
                    borderRadius: 65,
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#F0F0F0',
                    paddingHorizontal: 12,
                  }}>
                    <Ionicons
                      name={isDoneForToday ? 'checkmark-done' : isCheckingIn ? 'finger-print' : 'log-out-outline'}
                      size={isDoneForToday ? 32 : 40}
                      color={isDoneForToday ? '#6B7280' : '#1B4332'}
                    />
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: isDoneForToday ? 14 : 16,
                        fontWeight: '600',
                        color: isDoneForToday ? '#6B7280' : '#1B4332',
                        marginTop: 8,
                        textAlign: 'center',
                      }}
                    >
                      {isDoneForToday ? t('dashboard.doneForToday') : isCheckingIn ? t('dashboard.checkIn') : t('dashboard.checkOut')}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            </View>

            {/* Status Cards */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              {/* Check In Card */}
              <View style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 20,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E8F5E9',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Ionicons name="time-outline" size={24} color="#1B4332" />
                </View>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: 4,
                }}>
                  {getCheckInTime()}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#777777',
                  fontWeight: '500',
                }}>
                  {t('dashboard.checkIn')}
                </Text>
              </View>

              {/* Check Out Card */}
              <View style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 20,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E8F5E9',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Ionicons name="time-outline" size={24} color="#1B4332" />
                </View>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: 4,
                }}>
                  {getCheckOutTime()}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#777777',
                  fontWeight: '500',
                }}>
                  {t('dashboard.checkOut')}
                </Text>
              </View>

              {/* Total Hours Card */}
              <View style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 20,
                paddingHorizontal: 12,
                alignItems: 'center',
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
              }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: '#E8F5E9',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                  <Ionicons name="checkmark-done-outline" size={24} color="#1B4332" />
                </View>
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#000000',
                  marginBottom: 4,
                }}>
                  {getTotalHours()}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: '#777777',
                  fontWeight: '500',
                }}>
                  {t('dashboard.totalHrs')}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Attendance Bottom Sheet */}
      <BottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        height={35}
      >
        <AttendanceBottomSheet
          onClose={() => setShowBottomSheet(false)}
          actionType={(nextAction ?? 'IN') as 'IN' | 'OUT'}
        />
      </BottomSheet>
    </View>
  );
}

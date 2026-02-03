import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAttendanceStore } from '@/store/attendance.store';
import { getZoneNameById } from '@/db/sync-queue';
import { Loading } from '@/components/ui/Loading';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { AttendanceRecord } from '@/db/attendance';

// Types
interface DayCell {
  date: number;
  isCurrentMonth: boolean;
  hasAttendance: boolean;
  isSelected: boolean;
  fullDate: Date;
}

interface AttendanceCardData {
  date: number;
  day: string;
  checkIn: string;
  checkOut: string;
  totalHours: string;
  location: string;
  record: AttendanceRecord;
  isIncompletePastDay: boolean; // check-in only, no check-out, and day has passed
}

const TAB_BAR_BOTTOM_PADDING = 60 + 32;

export default function AttendanceHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { historyRecords, refreshHistory, isLoading } = useAttendanceStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [zoneNames, setZoneNames] = useState<Record<string, string>>({});

  // Touch gesture state
  const touchStart = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (user) {
      refreshHistory(user.id);
    }
  }, [user]);

  // Resolve zone names for displayed records so location shows actual zone, not placeholder
  useEffect(() => {
    const zoneIds = [...new Set(historyRecords.map((r) => r.zone_id))];
    if (zoneIds.length === 0) {
      setZoneNames({});
      return;
    }
    let cancelled = false;
    (async () => {
      const names: Record<string, string> = {};
      for (const zoneId of zoneIds) {
        if (cancelled) return;
        const name = await getZoneNameById(zoneId);
        if (name) names[zoneId] = name;
      }
      if (!cancelled) setZoneNames(names);
    })();
    return () => {
      cancelled = true;
    };
  }, [historyRecords]);

  // Pull to refresh handler
  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await refreshHistory(user.id);
    setRefreshing(false);
  };

  // Generate calendar days
  const generateCalendarDays = (): DayCell[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday)
    const startingDayOfWeek = firstDay.getDay();
    
    const days: DayCell[] = [];
    
    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i;
      const fullDate = new Date(year, month - 1, date);
      days.push({
        date,
        isCurrentMonth: false,
        hasAttendance: hasAttendanceOnDate(fullDate),
        isSelected: false,
        fullDate,
      });
    }
    
    // Add current month's days
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const fullDate = new Date(year, month, date);
      const isSelected = 
        selectedDate.getDate() === date &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;
      
      days.push({
        date,
        isCurrentMonth: true,
        hasAttendance: hasAttendanceOnDate(fullDate),
        isSelected,
        fullDate,
      });
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      const fullDate = new Date(year, month + 1, date);
      days.push({
        date,
        isCurrentMonth: false,
        hasAttendance: hasAttendanceOnDate(fullDate),
        isSelected: false,
        fullDate,
      });
    }
    
    return days;
  };

  // Check if there's attendance on a specific date
  const hasAttendanceOnDate = (date: Date): boolean => {
    return historyRecords.some(record => {
      const recordDate = new Date(record.timestamp * 1000); // Convert seconds to milliseconds
      return (
        recordDate.getDate() === date.getDate() &&
        recordDate.getMonth() === date.getMonth() &&
        recordDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get attendance data for the selected date and surrounding dates
  const getAttendanceCards = (): AttendanceCardData[] => {
    // Group records by date
    const groupedByDate = new Map<string, AttendanceRecord[]>();
    
    historyRecords.forEach(record => {
      const date = new Date(record.timestamp * 1000); // Convert seconds to milliseconds
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(record);
    });

    // Convert to card data
    const cards: AttendanceCardData[] = [];
    
    groupedByDate.forEach((records, dateKey) => {
      const date = new Date(records[0].timestamp * 1000); // Convert seconds to milliseconds
      const checkInRecord = records.find(r => r.type === 'IN');
      const checkOutRecord = records.find(r => r.type === 'OUT');
      
      const checkInTime = checkInRecord 
        ? new Date(checkInRecord.timestamp * 1000).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        : '-';
      
      const checkOutTime = checkOutRecord
        ? new Date(checkOutRecord.timestamp * 1000).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        : '-';

      // Calculate total hours
      let totalHours = '-';
      if (checkInRecord && checkOutRecord) {
        const diff = (checkOutRecord.timestamp - checkInRecord.timestamp) * 1000; // Convert to milliseconds
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        totalHours = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      const record = checkInRecord || checkOutRecord!;
      const zoneName = zoneNames[record.zone_id];
      const locationLabel = zoneName ?? `${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}`;

      const cardDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const isPastDay = cardDate.getTime() < todayStart.getTime();
      const isIncomplete = checkOutTime === '-';
      const isIncompletePastDay = isPastDay && isIncomplete;

      cards.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        checkIn: checkInTime,
        checkOut: checkOutTime,
        totalHours,
        location: locationLabel,
        record,
        isIncompletePastDay,
      });
    });

    // Sort by date descending (need to use timestamp for proper sorting)
    return cards.sort((a, b) => b.record.timestamp - a.record.timestamp);
  };

  const calendarDays = generateCalendarDays();
  const attendanceCards = getAttendanceCards();

  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Gesture handlers for calendar swipe
  const handleTouchStart = (evt: any) => {
    touchStart.current = {
      x: evt.nativeEvent.pageX,
      y: evt.nativeEvent.pageY,
    };
  };

  const handleTouchEnd = (evt: any) => {
    const touchEnd = {
      x: evt.nativeEvent.pageX,
      y: evt.nativeEvent.pageY,
    };
    
    const deltaX = touchEnd.x - touchStart.current.x;
    const deltaY = touchEnd.y - touchStart.current.y;
    
    // Only trigger if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous month
        goToPreviousMonth();
      } else {
        // Swipe left - next month
        goToNextMonth();
      }
    }
  };

  if (isLoading && historyRecords.length === 0) {
    return <Loading message={t('history.loadingHistory')} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.neutral[800]} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('history.attendanceHistory')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_BOTTOM_PADDING + (insets.bottom || 0) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.teal[500]}
            colors={[Colors.teal[500]]}
          />
        }
      >
        {/* Calendar Section */}
        <View 
          style={styles.calendarContainer}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <Pressable 
              onPress={goToPreviousMonth}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={20} color={Colors.neutral[600]} />
            </Pressable>
            
            <Text style={styles.monthYearText}>{monthYear}</Text>
            
            <Pressable 
              onPress={goToNextMonth}
              style={styles.navButton}
            >
              <Ionicons name="chevron-forward" size={20} color={Colors.neutral[600]} />
            </Pressable>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdaysContainer}>
            {[t('history.days.sun'), t('history.days.mon'), t('history.days.tue'), t('history.days.wed'), t('history.days.thu'), t('history.days.fri'), t('history.days.sat')].map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  if (day.isCurrentMonth) {
                    setSelectedDate(day.fullDate);
                  }
                }}
                style={styles.dayCell}
              >
                {day.hasAttendance && day.isCurrentMonth ? (
                  <View style={[
                    styles.dayWithAttendance,
                    day.isSelected && styles.selectedDay
                  ]}>
                    <Text style={[
                      styles.dayTextWithAttendance,
                      day.isSelected && styles.selectedDayText
                    ]}>
                      {day.date}
                    </Text>
                  </View>
                ) : (
                  <Text style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.inactiveDayText
                  ]}>
                    {day.date}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Your Attendance Section */}
        <View style={styles.attendanceSection}>
          <Text style={styles.sectionTitle}>{t('history.yourAttendance')}</Text>
          
          {attendanceCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={Colors.neutral[300]} />
              <Text style={styles.emptyText}>{t('history.noRecords')}</Text>
            </View>
          ) : (
            attendanceCards.map((card, index) => {
              const isGreyed = card.isIncompletePastDay;
              return (
              <View
                key={index}
                style={[
                  styles.attendanceCard,
                  isGreyed && styles.attendanceCardIncomplete,
                ]}
              >
                {/* Date Box */}
                <View style={[styles.dateBox, isGreyed && styles.dateBoxIncomplete]}>
                  <Text style={styles.dateNumber}>{card.date}</Text>
                  <Text style={styles.dateDay}>{card.day}</Text>
                </View>

                {/* Attendance Details */}
                <View style={styles.attendanceDetails}>
                  {/* Time Row */}
                  <View style={styles.timeRow}>
                    <View style={styles.timeColumn}>
                      <Text style={[styles.timeLabel, isGreyed && styles.timeLabelIncomplete]}>{t('dashboard.checkIn')}</Text>
                      <Text style={[styles.timeValue, isGreyed && styles.timeValueIncomplete]}>{card.checkIn}</Text>
                    </View>
                    <View style={[styles.timeDivider, isGreyed && styles.timeDividerIncomplete]} />
                    <View style={styles.timeColumn}>
                      <Text style={[styles.timeLabel, isGreyed && styles.timeLabelIncomplete]}>{t('history.checkOut')}</Text>
                      <Text style={[styles.timeValue, isGreyed && styles.timeValueIncomplete]}>{card.checkOut}</Text>
                    </View>
                    <View style={[styles.timeDivider, isGreyed && styles.timeDividerIncomplete]} />
                    <View style={styles.timeColumn}>
                      <Text style={[styles.timeLabel, isGreyed && styles.timeLabelIncomplete]}>{t('history.totalHours')}</Text>
                      <Text style={[styles.timeValue, isGreyed && styles.timeValueIncomplete]}>{card.totalHours}</Text>
                    </View>
                  </View>

                  {/* Location */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={isGreyed ? Colors.neutral[400] : Colors.neutral[0]} />
                    <Text style={[styles.locationText, isGreyed && styles.locationTextIncomplete]}>{card.location}</Text>
                  </View>
                </View>
              </View>
            );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing[4],
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.neutral[0],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[900],
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Calendar Styles
  calendarContainer: {
    backgroundColor: Colors.neutral[0],
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[0],
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[5],
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[900],
  },
  weekdaysContainer: {
    flexDirection: 'row',
    marginBottom: Spacing[2],
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[2],
  },
  weekdayText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    color: Colors.neutral[600],
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[1],
  },
  dayText: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[900],
    fontWeight: Typography.weight.medium,
  },
  inactiveDayText: {
    color: Colors.neutral[300],
  },
  dayWithAttendance: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.teal[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: Colors.primary[500],
  },
  dayTextWithAttendance: {
    fontSize: Typography.size.sm,
    color: Colors.neutral[0],
    fontWeight: Typography.weight.bold,
  },
  selectedDayText: {
    color: Colors.neutral[0],
  },

  // Attendance Section
  attendanceSection: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[0],
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing[4],
  },
  attendanceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.teal[600],
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateBox: {
    width: 60,
    height: 60,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  dateNumber: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.neutral[900],
    lineHeight: Typography.size['2xl'] * 1.2,
  },
  dateDay: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    color: Colors.neutral[600],
  },
  attendanceDetails: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  timeColumn: {
    flex: 1,
  },
  timeDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: Spacing[2],
  },
  timeLabel: {
    fontSize: Typography.size.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: Colors.neutral[0],
  },
  attendanceCardIncomplete: {
    backgroundColor: Colors.neutral[400],
  },
  dateBoxIncomplete: {
    backgroundColor: Colors.neutral[200],
  },
  timeLabelIncomplete: {
    color: Colors.neutral[600],
  },
  timeValueIncomplete: {
    color: Colors.neutral[800],
  },
  timeDividerIncomplete: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  locationTextIncomplete: {
    color: Colors.neutral[600],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  locationText: {
    fontSize: Typography.size.xs,
    color: Colors.neutral[0],
    marginLeft: 4,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[10],
  },
  emptyText: {
    fontSize: Typography.size.base,
    color: Colors.neutral[400],
    marginTop: Spacing[3],
  },
});

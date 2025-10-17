import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  MenuIcon,
  BackIcon,
  ForwardIcon,
  FileTextIcon,
} from '../components/icons/AppIcons';
import { useTheme } from '../contexts/ThemeContext';
import { JournalService, JournalEntryWithInsights } from '../services/journalService';

interface CalendarScreenProps {
  userId: string;
  onBack: () => void;
  onDateSelect?: (date: Date) => void;
  onEntryPress?: (entry: any) => void;
  onNewEntry?: (date: Date) => void;
  onMenuPress?: () => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  hasEntries: boolean;
  isSelected: boolean;
  isToday: boolean;
  entries: JournalEntryWithInsights[];
}

const { width } = Dimensions.get('window');
// Account for calendarContainer marginHorizontal (24px) + padding (24px) = 48px total
const CELL_SIZE = (width - 48) / 7; // 7 days per week

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  userId,
  onBack,
  onDateSelect,
  onEntryPress,
  onNewEntry,
  onMenuPress
}) => {
  const { theme, isDark } = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entriesMap, setEntriesMap] = useState<Map<string, JournalEntryWithInsights[]>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Calendar generation
  const generateCalendarData = useCallback((month: Date): CalendarDay[] => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    // First day of the month
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Generate 42 days (6 weeks)
    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const dateKey = date.toISOString().split('T')[0];
      const dayEntries = entriesMap.get(dateKey) || [];

      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === monthIndex,
        hasEntries: dayEntries.length > 0,
        isSelected: isSameDay(date, selectedDate),
        isToday: isSameDay(date, today),
        entries: dayEntries
      });
    }

    return days;
  }, [selectedDate, entriesMap]);

  // Date utilities
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
  };

  const formatSelectedDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Load entries for current month
  const loadEntriesForMonth = useCallback(async (month: Date) => {
    setIsLoading(true);
    try {
      // Get first and last day of the month
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      console.log('📅 Calendar: Loading entries for month:', {
        month: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      const { entries, error } = await JournalService.getUserEntriesInDateRange(
        userId,
        startDate,
        endDate
      );

      if (error) {
        console.error('Error loading calendar entries:', error);
        Alert.alert('Error', 'Failed to load calendar entries.');
        return;
      }

      // Group entries by date
      const newEntriesMap = new Map<string, JournalEntryWithInsights[]>();
      entries.forEach(entry => {
        const entryDate = new Date(entry.created_at);
        const dateKey = entryDate.toISOString().split('T')[0];

        if (!newEntriesMap.has(dateKey)) {
          newEntriesMap.set(dateKey, []);
        }
        newEntriesMap.get(dateKey)!.push(entry);
      });

      console.log('📋 Calendar: Entries grouped by date:', {
        totalEntries: entries.length,
        uniqueDates: newEntriesMap.size,
        dates: Array.from(newEntriesMap.keys())
      });

      setEntriesMap(newEntriesMap);
    } catch (error) {
      console.error('Unexpected error loading calendar entries:', error);
      Alert.alert('Error', 'Something went wrong loading the calendar.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Navigation handlers
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleTodayPress = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const handleDatePress = (date: Date) => {
    console.log('📆 Calendar: Date pressed:', {
      date: date.toISOString(),
      dateKey: date.toISOString().split('T')[0],
      hasEntries: entriesMap.has(date.toISOString().split('T')[0]),
      entriesCount: (entriesMap.get(date.toISOString().split('T')[0]) || []).length
    });
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  // Load entries when month changes
  useEffect(() => {
    loadEntriesForMonth(currentMonth);
  }, [currentMonth, loadEntriesForMonth]);

  const calendarDays = generateCalendarData(currentMonth);
  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedEntries = entriesMap.get(selectedDateKey) || [];

  console.log('🔍 Calendar render:', {
    selectedDate: selectedDate.toISOString(),
    selectedDateKey,
    selectedEntriesCount: selectedEntries.length,
    entriesMapSize: entriesMap.size,
    entriesMapKeys: Array.from(entriesMap.keys())
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.backgroundSecondary }]}>
        <AnimatedButton onPress={onMenuPress} style={styles.backButton} hapticFeedback="light">
          <MenuIcon size={24} color={theme.textPrimary} strokeWidth={2.5} />
        </AnimatedButton>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Calendar</Text>
        <View style={styles.backButton} />
      </View>

      {/* Month Navigation */}
      <View style={[styles.monthHeader, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.monthNavigation}>
          <AnimatedButton onPress={handlePreviousMonth} style={styles.navButton} hapticFeedback="light">
            <BackIcon size={20} color={theme.textPrimary} strokeWidth={2.5} />
          </AnimatedButton>
          <Text style={[styles.monthText, { color: theme.textPrimary }]}>{formatMonthYear(currentMonth)}</Text>
          <AnimatedButton onPress={handleNextMonth} style={styles.navButton} hapticFeedback="light">
            <ForwardIcon size={20} color={theme.textPrimary} strokeWidth={2.5} />
          </AnimatedButton>
        </View>
        <AnimatedButton onPress={handleTodayPress} style={[styles.todayButton, { backgroundColor: theme.primary }]} hapticFeedback="medium">
          <Text style={[styles.todayButtonText, { color: theme.white }]}>TODAY</Text>
        </AnimatedButton>
      </View>

      {/* Single ScrollView for entire content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={true}
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
      >
        {/* Calendar Grid */}
        <View style={[styles.calendarContainer, { backgroundColor: theme.backgroundSecondary }]}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <View key={day} style={styles.dayHeader}>
                <Text style={[styles.dayHeaderText, { color: theme.textSecondary }]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => (
              <AnimatedButton
                key={index}
                style={[
                  styles.dayCell,
                  day.isSelected && { ...styles.dayCellSelected, backgroundColor: theme.primary },
                  day.isToday && !day.isSelected && { ...styles.dayCellToday, borderColor: theme.primary }
                ]}
                onPress={() => handleDatePress(day.date)}
                hapticFeedback="light"
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: theme.textPrimary },
                    !day.isCurrentMonth && { color: theme.textMuted },
                    day.isSelected && { color: theme.white, fontWeight: '600' },
                    day.isToday && !day.isSelected && { color: theme.primary, fontWeight: '600' }
                  ]}
                >
                  {day.date.getDate()}
                </Text>
                {day.hasEntries && (
                  <View style={[styles.entryIndicator, { backgroundColor: theme.warning }]} />
                )}
              </AnimatedButton>
            ))}
          </View>
        </View>

        {/* Selected Date Info */}
        <View style={[styles.dateInfoPanel, { backgroundColor: theme.surface }]}>
          <Text style={[styles.selectedDateText, { color: theme.primaryLight }]}>{formatSelectedDate(selectedDate)}</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading entries...</Text>
            </View>
          ) : selectedEntries.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconWrapper}>
                <FileTextIcon size={48} color={theme.textMuted} strokeWidth={1.5} />
              </View>
              <Text style={[styles.noEntriesText, { color: theme.textSecondary }]}>No entry for this date</Text>
              <Text style={[styles.noEntriesSubtext, { color: theme.textMuted }]}>
                Tap the + button to create one
              </Text>
            </View>
          ) : (
            <View style={styles.entriesListContainer}>
              {selectedEntries.map(entry => {
                const getTagColor = (tag: string): string => {
                  const colors: { [key: string]: string } = {
                    'journal': '#8B5CF6',
                    'note': '#10B981',
                    'thought': '#3B82F6',
                    'idea': '#F59E0B',
                    'goal': '#EF4444',
                    'gratitude': '#EC4899'
                  };
                  return colors[tag.toLowerCase()] || '#6B7280';
                };

                return (
                  <AnimatedButton
                    key={entry.id}
                    style={[styles.entryPreview, { backgroundColor: theme.backgroundTertiary, borderLeftColor: theme.primary }]}
                    onPress={() => onEntryPress?.(entry)}
                    hapticFeedback="light"
                  >
                    {entry.title && (
                      <Text style={[styles.entryTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {entry.title}
                      </Text>
                    )}
                    <Text style={[styles.entryPreviewText, { color: theme.textSecondary }]} numberOfLines={3}>
                      {entry.content}
                    </Text>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <View style={styles.entryTags}>
                        {entry.tags.map((tag, index) => (
                          <View
                            key={index}
                            style={[styles.tagChip, { backgroundColor: getTagColor(tag) + '20' }]}
                          >
                            <Text style={[styles.tagText, { color: getTagColor(tag) }]}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.entryMeta}>
                      <Text style={[styles.entryTime, { color: theme.textMuted }]}>
                        {new Date(entry.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </Text>
                      {entry.mood_rating && (
                        <Text style={styles.entryMood}>
                          {[null, '😢', '😕', '😐', '😊', '😄'][entry.mood_rating] || '😐'}
                        </Text>
                      )}
                    </View>
                  </AnimatedButton>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  mediaViewButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaViewText: {
    fontSize: 14,
  },

  // Month Navigation
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Calendar
  calendarContainer: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    width: CELL_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayCellSelected: {
    borderRadius: (CELL_SIZE * 0.9) / 2,
  },
  dayCellToday: {
    borderWidth: 2,
    borderRadius: (CELL_SIZE * 0.9) / 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dayTextOtherMonth: {},
  dayTextSelected: {},
  dayTextToday: {},
  entryIndicator: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Date Info Panel
  dateInfoPanel: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIconWrapper: {
    marginBottom: 16,
  },
  noEntriesText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  noEntriesSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  entriesListContainer: {
    paddingBottom: 16,
  },
  entryPreview: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  entryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  entryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTime: {
    fontSize: 12,
  },
  entryMood: {
    fontSize: 18,
  },
});
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
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
const CELL_SIZE = (width - 32) / 7; // 7 days per week

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
      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

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
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const handleAddEntry = () => {
    onNewEntry?.(selectedDate);
  };

  // Load entries when month changes
  useEffect(() => {
    loadEntriesForMonth(currentMonth);
  }, [currentMonth, loadEntriesForMonth]);

  const calendarDays = generateCalendarData(currentMonth);
  const selectedEntries = entriesMap.get(selectedDate.toISOString().split('T')[0]) || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.backgroundSecondary }]}>
        <TouchableOpacity onPress={onMenuPress} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Calendar</Text>
        <View style={styles.backButton} />
      </View>

      {/* Month Navigation */}
      <View style={[styles.monthHeader, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.cardBorder }]}>
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: theme.textPrimary }]}>◀</Text>
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.textPrimary }]}>{formatMonthYear(currentMonth)}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: theme.textPrimary }]}>▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleTodayPress} style={[styles.todayButton, { backgroundColor: theme.primary }]}>
          <Text style={[styles.todayButtonText, { color: theme.white }]}>TODAY</Text>
        </TouchableOpacity>
      </View>

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
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day.isSelected && { ...styles.dayCellSelected, backgroundColor: theme.primary },
                day.isToday && !day.isSelected && { ...styles.dayCellToday, borderColor: theme.primary }
              ]}
              onPress={() => handleDatePress(day.date)}
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
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Date Info */}
      <View style={[styles.dateInfoPanel, { backgroundColor: theme.surface }]}>
        <Text style={[styles.selectedDateText, { color: theme.primaryLight }]}>{formatSelectedDate(selectedDate)}</Text>

        {selectedEntries.length === 0 ? (
          <Text style={[styles.noEntriesText, { color: theme.textMuted }]}>No diaries on this day.</Text>
        ) : (
          <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
            {selectedEntries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={[styles.entryPreview, { backgroundColor: theme.backgroundTertiary, borderLeftColor: theme.primary }]}
                onPress={() => onEntryPress?.(entry)}
              >
                <Text style={[styles.entryPreviewText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {entry.content}
                </Text>
                <Text style={[styles.entryTime, { color: theme.textMuted }]}>
                  {new Date(entry.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity style={[styles.floatingButton, { backgroundColor: theme.primary }]} onPress={handleAddEntry}>
        <Text style={[styles.floatingButtonText, { color: theme.white }]}>+</Text>
      </TouchableOpacity>
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
  backButtonText: {
    fontSize: 20,
    fontWeight: '600',
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
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
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

  // Calendar
  calendarContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
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
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayCellSelected: {
    borderRadius: CELL_SIZE / 2,
  },
  dayCellToday: {
    borderWidth: 2,
    borderRadius: CELL_SIZE / 2,
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
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Date Info Panel
  dateInfoPanel: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 16,
  },
  noEntriesText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  entriesContainer: {
    flex: 1,
  },
  entryPreview: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  entryPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 12,
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
});
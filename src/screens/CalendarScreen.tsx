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
import { colors } from '../styles/designSystem';
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onMenuPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={styles.backButton} />
      </View>

      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <View style={styles.monthNavigation}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentMonth)}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleTodayPress} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>TODAY</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarContainer}>
        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{day}</Text>
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
                day.isSelected && styles.dayCellSelected,
                day.isToday && !day.isSelected && styles.dayCellToday
              ]}
              onPress={() => handleDatePress(day.date)}
            >
              <Text
                style={[
                  styles.dayText,
                  !day.isCurrentMonth && styles.dayTextOtherMonth,
                  day.isSelected && styles.dayTextSelected,
                  day.isToday && !day.isSelected && styles.dayTextToday
                ]}
              >
                {day.date.getDate()}
              </Text>
              {day.hasEntries && (
                <View style={styles.entryIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selected Date Info */}
      <View style={styles.dateInfoPanel}>
        <Text style={styles.selectedDateText}>{formatSelectedDate(selectedDate)}</Text>

        {selectedEntries.length === 0 ? (
          <Text style={styles.noEntriesText}>No diaries on this day.</Text>
        ) : (
          <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
            {selectedEntries.map(entry => (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryPreview}
                onPress={() => onEntryPress?.(entry)}
              >
                <Text style={styles.entryPreviewText} numberOfLines={2}>
                  {entry.content}
                </Text>
                <Text style={styles.entryTime}>
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
      <TouchableOpacity style={styles.floatingButton} onPress={handleAddEntry}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mediaViewButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaViewText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Month Navigation
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
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
    color: colors.textPrimary,
    fontWeight: '600',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginHorizontal: 16,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },

  // Calendar
  calendarContainer: {
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.textSecondary,
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
    backgroundColor: colors.white,
    borderRadius: CELL_SIZE / 2,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: CELL_SIZE / 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayTextOtherMonth: {
    color: colors.textMuted,
  },
  dayTextSelected: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '600',
  },
  entryIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },

  // Date Info Panel
  dateInfoPanel: {
    flex: 1,
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.primaryLight,
    marginBottom: 16,
  },
  noEntriesText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  entriesContainer: {
    flex: 1,
  },
  entryPreview: {
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  entryPreviewText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
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
    color: colors.white,
    fontWeight: '600',
  },
});
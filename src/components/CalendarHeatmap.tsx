import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { DatabaseJournalEntry } from '../config/supabase';
import { spacing } from '../styles/designSystem';

interface CalendarHeatmapProps {
  entries: DatabaseJournalEntry[];
  startDate?: Date;
  endDate?: Date;
}

interface DayData {
  date: Date;
  entryCount: number;
  totalWords: number;
}

interface TooltipData {
  date: Date;
  entryCount: number;
  totalWords: number;
  visible: boolean;
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  entries,
  startDate,
  endDate,
}) => {
  const { theme } = useTheme();
  const [tooltip, setTooltip] = useState<TooltipData>({
    date: new Date(),
    entryCount: 0,
    totalWords: 0,
    visible: false,
  });

  // Calculate heatmap data
  const heatmapData = useMemo(() => {
    const end = endDate || new Date();
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Create map of date -> data
    const dateMap = new Map<string, DayData>();

    // Initialize all dates with 0 entries
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: new Date(currentDate),
        entryCount: 0,
        totalWords: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill in actual entry data
    entries.forEach(entry => {
      const entryDate = new Date(entry.created_at);
      const dateStr = entryDate.toISOString().split('T')[0];

      if (dateMap.has(dateStr)) {
        const existing = dateMap.get(dateStr)!;
        dateMap.set(dateStr, {
          date: existing.date,
          entryCount: existing.entryCount + 1,
          totalWords: existing.totalWords + entry.word_count,
        });
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entries, startDate, endDate]);

  // Get color intensity based on entry count
  const getColorIntensity = (entryCount: number): string => {
    if (entryCount === 0) return theme.surface;
    if (entryCount <= 2) return theme.primary + '30';
    if (entryCount <= 4) return theme.primary + '60';
    return theme.primary;
  };

  // Organize data into weeks
  const weeks = useMemo(() => {
    const weekArray: DayData[][] = [];
    let currentWeek: DayData[] = [];

    // Fill initial empty days to align with day of week
    const firstDay = heatmapData[0];
    if (firstDay) {
      const dayOfWeek = firstDay.date.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({
          date: new Date(0),
          entryCount: -1,
          totalWords: 0,
        });
      }
    }

    heatmapData.forEach((day) => {
      currentWeek.push(day);

      if (currentWeek.length === 7) {
        weekArray.push([...currentWeek]);
        currentWeek = [];
      }
    });

    // Fill remaining days in last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(0),
          entryCount: -1,
          totalWords: 0,
        });
      }
      weekArray.push(currentWeek);
    }

    return weekArray;
  }, [heatmapData]);

  const handleDayPress = (day: DayData) => {
    if (day.entryCount >= 0) {
      setTooltip({
        date: day.date,
        entryCount: day.entryCount,
        totalWords: day.totalWords,
        visible: true,
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Activity Calendar
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heatmapContainer}>
          {/* Day labels */}
          <View style={styles.dayLabelsColumn}>
            {dayLabels.map((label, index) => (
              <Text
                key={index}
                style={[styles.dayLabel, { color: theme.textSecondary }]}
              >
                {label}
              </Text>
            ))}
          </View>

          {/* Heatmap grid */}
          <View style={styles.weeksContainer}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekColumn}>
                {week.map((day, dayIndex) => (
                  <TouchableOpacity
                    key={dayIndex}
                    onPress={() => handleDayPress(day)}
                    style={[
                      styles.dayCell,
                      {
                        backgroundColor: day.entryCount >= 0
                          ? getColorIntensity(day.entryCount)
                          : 'transparent',
                        borderColor: day.entryCount >= 0
                          ? theme.primary + '20'
                          : 'transparent',
                      },
                    ]}
                    disabled={day.entryCount < 0}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>
          Less
        </Text>
        <View style={[styles.legendCell, { backgroundColor: theme.surface }]} />
        <View style={[styles.legendCell, { backgroundColor: theme.primary + '30' }]} />
        <View style={[styles.legendCell, { backgroundColor: theme.primary + '60' }]} />
        <View style={[styles.legendCell, { backgroundColor: theme.primary }]} />
        <Text style={[styles.legendText, { color: theme.textSecondary }]}>
          More
        </Text>
      </View>

      {/* Tooltip Modal */}
      <Modal
        transparent
        visible={tooltip.visible}
        animationType="fade"
        onRequestClose={() => setTooltip({ ...tooltip, visible: false })}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTooltip({ ...tooltip, visible: false })}
        >
          <View style={[styles.tooltipContainer, { backgroundColor: theme.surface }]}>
            <Text style={[styles.tooltipDate, { color: theme.textPrimary }]}>
              {formatDate(tooltip.date)}
            </Text>
            <Text style={[styles.tooltipInfo, { color: theme.textSecondary }]}>
              {tooltip.entryCount} {tooltip.entryCount === 1 ? 'entry' : 'entries'}
            </Text>
            {tooltip.totalWords > 0 && (
              <Text style={[styles.tooltipInfo, { color: theme.textSecondary }]}>
                {tooltip.totalWords.toLocaleString()} words
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
  },
  heatmapContainer: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    marginRight: 4,
    justifyContent: 'space-around',
  },
  dayLabel: {
    fontSize: 10,
    height: 14,
    textAlign: 'center',
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: 3,
  },
  weekColumn: {
    gap: 3,
  },
  dayCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  legendText: {
    fontSize: 10,
  },
  legendCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    padding: spacing.md,
    borderRadius: 8,
    minWidth: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  tooltipDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  tooltipInfo: {
    fontSize: 12,
  },
});

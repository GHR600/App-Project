import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MenuIcon } from '../components/icons/AppIcons';
import { AnimatedButton } from '../components/AnimatedButton';
import { GradientBackground } from '../components/GradientBackground';
import { useTheme } from '../contexts/ThemeContext';
import { spacing } from '../styles/designSystem';
import { AnalyticsService } from '../services/analyticsService';
import { saveAndShareFile } from '../utils/fileExport';
import { useAuth } from '../contexts/AuthContext';

interface ExportScreenProps {
  onMenuPress?: () => void;
}

export const ExportScreen: React.FC<ExportScreenProps> = ({ onMenuPress }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  // Date range state
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Export options state
  const [exportType, setExportType] = useState<'stats' | 'entries'>('stats');
  const [entryFormat, setEntryFormat] = useState<'pdf' | 'txt'>('txt');
  const [includeInsights, setIncludeInsights] = useState(true);
  const [includeMood, setIncludeMood] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const setPresetDateRange = (days: number | 'all') => {
    const end = new Date();
    let start: Date;

    if (days === 'all') {
      start = new Date(2020, 0, 1); // Start from a very early date
    } else {
      start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    setStartDate(start);
    setEndDate(end);
  };

  const handleExport = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Invalid Date Range', 'End date must be after start date');
      return;
    }

    setIsExporting(true);

    try {
      const options = {
        format: exportType === 'stats' ? ('csv' as const) : entryFormat,
        dateRange: { start: startDate, end: endDate },
        includeInsights: exportType === 'entries' ? includeInsights : false,
        includeAnalytics: exportType === 'stats',
        includeImages: false,
      };

      const { data, filename, error } = await AnalyticsService.exportData(
        user.id,
        options
      );

      if (error) {
        Alert.alert('Export Error', 'Failed to export data. Please try again.');
        return;
      }

      // Save and share the file
      const { success, error: saveError } = await saveAndShareFile(data, filename);

      if (success) {
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        Alert.alert('Error', 'Failed to save file. Please try again.');
        console.error('Save error:', saveError);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.topHeader, { backgroundColor: theme.backgroundSecondary }]}>
        <AnimatedButton onPress={onMenuPress} style={styles.menuButton} hapticFeedback="light">
          <MenuIcon size={24} color={theme.textPrimary} strokeWidth={2.5} />
        </AnimatedButton>
        <Text style={styles.headerTitle}>Export</Text>
        <View style={styles.menuButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        

      {/* Date Range Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          📅 Date Range
        </Text>

        <View style={styles.datePickerRow}>
          <View style={styles.datePickerContainer}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
              Start Date
            </Text>
            <AnimatedButton
              style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
              onPress={() => setShowStartPicker(true)}
              hapticFeedback="light"
            >
              <Text style={[styles.dateButtonText, { color: theme.textPrimary }]}>
                {formatDate(startDate)}
              </Text>
            </AnimatedButton>
          </View>

          <View style={styles.datePickerContainer}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>
              End Date
            </Text>
            <AnimatedButton
              style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
              onPress={() => setShowEndPicker(true)}
              hapticFeedback="light"
            >
              <Text style={[styles.dateButtonText, { color: theme.textPrimary }]}>
                {formatDate(endDate)}
              </Text>
            </AnimatedButton>
          </View>
        </View>

        {/* Date Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowStartPicker(Platform.OS === 'ios');
              if (selectedDate) {
                setStartDate(selectedDate);
              }
            }}
            maximumDate={endDate}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowEndPicker(Platform.OS === 'ios');
              if (selectedDate) {
                setEndDate(selectedDate);
              }
            }}
            minimumDate={startDate}
            maximumDate={new Date()}
          />
        )}

        {/* Preset Buttons */}
        <View style={styles.presetContainer}>
          <AnimatedButton
            style={[styles.presetButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => setPresetDateRange(7)}
            hapticFeedback="light"
          >
            <Text style={[styles.presetButtonText, { color: theme.textPrimary }]}>
              Last 7 days
            </Text>
          </AnimatedButton>

          <AnimatedButton
            style={[styles.presetButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => setPresetDateRange(30)}
            hapticFeedback="light"
          >
            <Text style={[styles.presetButtonText, { color: theme.textPrimary }]}>
              Last 30 days
            </Text>
          </AnimatedButton>

          <AnimatedButton
            style={[styles.presetButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => setPresetDateRange(90)}
            hapticFeedback="light"
          >
            <Text style={[styles.presetButtonText, { color: theme.textPrimary }]}>
              Last 3 months
            </Text>
          </AnimatedButton>

          <AnimatedButton
            style={[styles.presetButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => setPresetDateRange('all')}
            hapticFeedback="light"
          >
            <Text style={[styles.presetButtonText, { color: theme.textPrimary }]}>
              All time
            </Text>
          </AnimatedButton>
        </View>
      </View>

      {/* Export Type Section */}
      <View style={[styles.section, { backgroundColor: theme.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          📊 What to Export?
        </Text>

        <AnimatedButton
          style={[
            styles.radioOption,
            { borderColor: exportType === 'stats' ? theme.primary : theme.cardBorder }
          ]}
          onPress={() => setExportType('stats')}
          hapticFeedback="light"
        >
          <View style={[
            styles.radioCircle,
            { borderColor: exportType === 'stats' ? theme.primary : theme.textMuted }
          ]}>
            {exportType === 'stats' && (
              <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
            )}
          </View>
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, { color: theme.textPrimary }]}>
              Export Statistics (CSV)
            </Text>
            <Text style={[styles.radioDescription, { color: theme.textSecondary }]}>
              Analytics, trends, and insights about your journaling
            </Text>
          </View>
        </AnimatedButton>

        <AnimatedButton
          style={[
            styles.radioOption,
            { borderColor: exportType === 'entries' ? theme.primary : theme.cardBorder }
          ]}
          onPress={() => setExportType('entries')}
          hapticFeedback="light"
        >
          <View style={[
            styles.radioCircle,
            { borderColor: exportType === 'entries' ? theme.primary : theme.textMuted }
          ]}>
            {exportType === 'entries' && (
              <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
            )}
          </View>
          <View style={styles.radioContent}>
            <Text style={[styles.radioLabel, { color: theme.textPrimary }]}>
              Export Entries
            </Text>
            <Text style={[styles.radioDescription, { color: theme.textSecondary }]}>
              Your journal entries with content and metadata
            </Text>
          </View>
        </AnimatedButton>
      </View>

      {/* Format Selection (only for entries) */}
      {exportType === 'entries' && (
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            📄 Entry Format
          </Text>

          <View style={styles.formatContainer}>
            <AnimatedButton
              style={[
                styles.formatButton,
                {
                  backgroundColor: entryFormat === 'txt' ? 'transparent' : theme.backgroundSecondary,
                  borderColor: entryFormat === 'txt' ? theme.primary : theme.cardBorder,
                  overflow: entryFormat === 'txt' ? 'hidden' : 'visible',
                }
              ]}
              onPress={() => setEntryFormat('txt')}
              hapticFeedback="light"
            >
              {entryFormat === 'txt' ? (
                <GradientBackground style={styles.formatGradient}>
                  <Text style={[styles.formatButtonText, { color: theme.textInverse }]}>
                    TXT
                  </Text>
                </GradientBackground>
              ) : (
                <Text style={[styles.formatButtonText, { color: theme.textPrimary }]}>
                  TXT
                </Text>
              )}
            </AnimatedButton>

            <AnimatedButton
              style={[
                styles.formatButton,
                {
                  backgroundColor: entryFormat === 'pdf' ? 'transparent' : theme.backgroundSecondary,
                  borderColor: entryFormat === 'pdf' ? theme.primary : theme.cardBorder,
                  overflow: entryFormat === 'pdf' ? 'hidden' : 'visible',
                }
              ]}
              onPress={() => setEntryFormat('pdf')}
              hapticFeedback="light"
            >
              {entryFormat === 'pdf' ? (
                <GradientBackground style={styles.formatGradient}>
                  <Text style={[styles.formatButtonText, { color: theme.textInverse }]}>
                    PDF
                  </Text>
                </GradientBackground>
              ) : (
                <Text style={[styles.formatButtonText, { color: theme.textPrimary }]}>
                  PDF
                </Text>
              )}
            </AnimatedButton>
          </View>
        </View>
      )}

      {/* Additional Options (only for entries) */}
      {exportType === 'entries' && (
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            ⚙️ Options
          </Text>

          <AnimatedButton
            style={styles.checkboxOption}
            onPress={() => setIncludeInsights(!includeInsights)}
            hapticFeedback="light"
          >
            <View style={[
              styles.checkbox,
              {
                backgroundColor: includeInsights ? theme.primary : 'transparent',
                borderColor: includeInsights ? theme.primary : theme.textMuted
              }
            ]}>
              {includeInsights && (
                <Text style={[styles.checkmark, { color: theme.textInverse }]}>✓</Text>
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
              Include AI insights
            </Text>
          </AnimatedButton>

          <AnimatedButton
            style={styles.checkboxOption}
            onPress={() => setIncludeMood(!includeMood)}
            hapticFeedback="light"
          >
            <View style={[
              styles.checkbox,
              {
                backgroundColor: includeMood ? theme.primary : 'transparent',
                borderColor: includeMood ? theme.primary : theme.textMuted
              }
            ]}>
              {includeMood && (
                <Text style={[styles.checkmark, { color: theme.textInverse }]}>✓</Text>
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.textPrimary }]}>
              Include mood data
            </Text>
          </AnimatedButton>
        </View>
      )}

      {/* Export Button */}
      <AnimatedButton
        style={styles.exportButton}
        onPress={handleExport}
        disabled={isExporting}
        hapticFeedback="medium"
      >
        <GradientBackground
          style={styles.gradientButton}
          colors={isExporting ? [theme.textMuted, theme.textMuted, theme.textMuted] : undefined}
        >
          <Text style={[styles.exportButtonText, { color: theme.textInverse }]}>
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Text>
        </GradientBackground>
      </AnimatedButton>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Yellowtail_400Regular',
    fontSize: 32,
    color: '#eab308',
    lineHeight: 44,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 42,
    fontWeight: '600',
    color: '#eab308',
    lineHeight: 56,
    paddingHorizontal: 4,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    fontWeight: '600',
    color: '#eab308',
    lineHeight: 36,
    paddingHorizontal: 4,
    marginBottom: spacing.md,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  datePickerContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  dateButton: {
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetButton: {
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 12,
  },
  formatContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formatButton: {
    flex: 1,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formatGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  gradientButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: spacing.md,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

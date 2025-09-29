import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/designSystem';
import { FloatingActionButton } from '../components/FloatingActionButton';
import { DayCardData, JournalEntry } from '../types';
import { EntryService } from '../services/entryService';

interface DayDetailScreenProps {
  route: {
    params: {
      date: string;
      dayData: DayCardData;
      userId: string;
    };
  };
  navigation: any;
}

export const DayDetailScreen: React.FC<DayDetailScreenProps> = ({ route, navigation }) => {
  const { date, dayData: initialDayData, userId } = route.params;
  const [dayData, setDayData] = useState<DayCardData>(initialDayData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMoodEmoji = (rating: number | undefined | null) => {
    if (!rating) return '😐';
    return EntryService.getMoodEmoji(rating);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const { entries, error } = await EntryService.getEntriesForDate(userId, date);
      if (!error && entries.length > 0) {
        const updatedDayData = EntryService.groupEntriesByDay(entries)[0];
        if (updatedDayData) {
          setDayData(updatedDayData);
        }
      }
    } catch (error) {
      console.error('Error refreshing day data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEntryPress = (entry: JournalEntry) => {
    navigation.navigate('JournalEntry', {
      mode: 'edit',
      entryId: entry.id,
      fromScreen: 'DayDetail'
    });
  };

  const handleNewEntry = () => {
    navigation.navigate('JournalEntry', {
      mode: 'create',
      initialDate: date,
      fromScreen: 'DayDetail'
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{formatDate(date)}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderJournalEntry = () => {
    if (!dayData.journalEntry) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MAIN JOURNAL ENTRY</Text>
        <TouchableOpacity
          style={styles.entryCard}
          onPress={() => handleEntryPress(dayData.journalEntry!)}
        >
          <View style={styles.entryHeader}>
            <Text style={styles.entryIcon}>📝</Text>
            <Text style={styles.entryTime}>
              {formatTime(dayData.journalEntry.created_at)}
            </Text>
            <Text style={styles.entryMood}>
              {getMoodEmoji(dayData.journalEntry.mood_rating)}
            </Text>
          </View>

          {dayData.journalEntry.title && (
            <Text style={styles.entryTitle} numberOfLines={2}>
              {dayData.journalEntry.title}
            </Text>
          )}

          <Text style={styles.entryContent} numberOfLines={3}>
            {dayData.journalEntry.content}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderNotes = () => {
    if (dayData.notes.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTES OF THE DAY</Text>
        {dayData.notes.map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.entryCard}
            onPress={() => handleEntryPress(note)}
          >
            <View style={styles.entryHeader}>
              <Text style={styles.entryIcon}>🗒️</Text>
              <Text style={styles.entryTime}>
                {formatTime(note.created_at)}
              </Text>
              <Text style={styles.entryMood}>
                {getMoodEmoji(note.mood_rating)}
              </Text>
            </View>

            {note.title && (
              <Text style={styles.entryTitle} numberOfLines={1}>
                {note.title}
              </Text>
            )}

            <Text style={styles.entryContent} numberOfLines={2}>
              {note.content}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderAddEntryButton = () => (
    <TouchableOpacity style={styles.addEntryButton} onPress={handleNewEntry}>
      <Text style={styles.addEntryIcon}>+</Text>
      <Text style={styles.addEntryText}>Add Entry</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={colors.background} />

      {renderHeader()}

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {renderJournalEntry()}
        {renderNotes()}
        {renderAddEntryButton()}
      </ScrollView>

      <FloatingActionButton onPress={handleNewEntry} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h2,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.small,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  entryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  entryIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  entryTime: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  entryMood: {
    fontSize: 20,
  },
  entryTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  entryContent: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  addEntryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addEntryIcon: {
    fontSize: 32,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  addEntryText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
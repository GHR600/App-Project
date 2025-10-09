# Homepage Day Cards Implementation Guide

## Overview
Transform the current entry-based homepage into a day-based card system with consistent MyDiary dark purple theming throughout the entire application.

## New Navigation Flow
```
Homepage (Day Cards) → Day Detail Screen → JournalEntryScreen (existing entry)
                    ↘ New Entry (floating +)
```

## 1. Homepage Transformation (DashboardHomeScreen.tsx)

### Current State Changes Required
- **Replace**: Individual entry cards → Day cards
- **Show**: Last 7 days with entries only
- **Add**: "Show More" button at bottom
- **Keep**: Stats header (but make more compact)
- **Add**: Floating + button for new entry

### Day Card Structure
```typescript
interface DayCard {
  date: Date;
  journalEntry?: JournalEntry;  // Main diary entry (max 1)
  notes: JournalEntry[];        // Additional notes for the day
  totalEntries: number;
  moodSummary: string;         // Most frequent mood or latest mood
}
```

### Day Card Visual Design
```
┌─────────────────────────────────────────┐
│ 26 Aug                              😊  │
│ Mega turnaround since last entry        │
│ + 2 more entries                        │
│ ────────────────────────────────────────│
│ 📝 Main Journal • 🗒️ Morning Note      │
│ 🗒️ Evening Thoughts                     │
└─────────────────────────────────────────┘
```

### Implementation Details
```typescript
// DashboardHomeScreen.tsx modifications:

interface DayCardData {
  date: string;           // ISO date string
  entries: JournalEntry[];
  journalEntry?: JournalEntry;    // The main journal entry
  notes: JournalEntry[];          // Additional notes
  dominantMood: string;           // Emoji representation
  previewText: string;            // First journal title or note titles
}

// New functions needed:
const groupEntriesByDay = (entries: JournalEntry[]): DayCardData[] => {
  // Group entries by date
  // Separate journal entries from notes
  // Calculate mood summaries
  // Generate preview text from titles
};

const getLastSevenDaysWithEntries = (entries: JournalEntry[]): DayCardData[] => {
  // Filter last 7 days that have entries
  // Return empty array if no entries
};
```

## 2. New Day Detail Screen Creation

### File: `src/screens/DayDetailScreen.tsx`
New screen to show all entries for a specific day.

### Day Detail Screen Structure
```
┌─────────────────────────────────────────┐
│ ← Back    Tuesday, Aug 26               │
├─────────────────────────────────────────┤
│ MAIN JOURNAL ENTRY                      │
│ ┌─ 📝 9:30 PM ─────────────────────────┐ │
│ │ Mega turnaround since last entry  😊 │ │
│ │ Today was really productive and...    │ │
│ └───────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ NOTES OF THE DAY                        │
│ ┌─ 🗒️ 7:15 AM ─────────────────────────┐ │
│ │ Morning thoughts              😐     │ │
│ │ Quick note about breakfast plans      │ │
│ └───────────────────────────────────────┘ │
│ ┌─ 🗒️ 11:45 PM ────────────────────────┐ │
│ │ Late night reflection         😊     │ │
│ │ Grateful for today's progress         │ │
│ └───────────────────────────────────────┘ │
│                                         │
│                [+] Add Entry            │
└─────────────────────────────────────────┘
```

### Day Detail Screen Implementation
```typescript
// DayDetailScreen.tsx structure:

interface DayDetailScreenProps {
  route: {
    params: {
      date: string;        // ISO date string
      dayData: DayCardData; // Pre-computed day data
    }
  };
}

const DayDetailScreen: React.FC<DayDetailScreenProps> = ({ route, navigation }) => {
  const { date, dayData } = route.params;
  
  // Functions needed:
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
};
```

## 3. Journal Entry Type System

### Database Schema Updates
```sql
-- Add entry_type column to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN entry_type VARCHAR(20) DEFAULT 'note' CHECK (entry_type IN ('journal', 'note'));

-- Add constraint: only one journal entry per user per day
CREATE UNIQUE INDEX unique_journal_per_day 
ON journal_entries (user_id, DATE(created_at)) 
WHERE entry_type = 'journal';
```

### Entry Type Interface Updates
```typescript
// Update JournalEntry interface
interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  mood_rating?: number;
  entry_type: 'journal' | 'note';  // NEW FIELD
  title?: string;                   // NEW FIELD for better organization
  created_at: string;
  updated_at: string;
  ai_insight_generated?: boolean;
}
```

## 4. JournalEntryScreen Updates

### Entry Type Selection
Add dropdown/picker for entry type selection when creating new entries.

```typescript
// JournalEntryScreen.tsx additions:

const [entryType, setEntryType] = useState<'journal' | 'note'>('journal');
const [title, setTitle] = useState('');

// UI Component for entry type selection:
const EntryTypeSelector = () => (
  <View style={styles.entryTypeContainer}>
    <Text style={styles.entryTypeLabel}>Entry Type:</Text>
    <Picker
      selectedValue={entryType}
      onValueChange={(value) => setEntryType(value)}
      style={styles.entryTypePicker}
    >
      <Picker.Item label="📝 Journal Entry" value="journal" />
      <Picker.Item label="🗒️ Quick Note" value="note" />
    </Picker>
  </View>
);
```

### Entry Type Validation
```typescript
const validateEntryType = async (type: 'journal' | 'note', date: string) => {
  if (type === 'journal') {
    // Check if journal entry already exists for this date
    const existingJournal = await supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('entry_type', 'journal')
      .gte('created_at', `${date}T00:00:00.000Z`)
      .lt('created_at', `${date}T23:59:59.999Z`);
      
    if (existingJournal.data?.length > 0) {
      throw new Error('You can only have one journal entry per day');
    }
  }
};
```

## 5. Consistent Dark Purple Theme Implementation

### Theme Configuration (designSystem.ts)
```typescript
// Complete theme object for consistent application
export const theme = {
  colors: {
    // Primary Colors (MyDiary Purple Theme)
    primary: '#7C3AED',           // Main purple (buttons, links, accents)
    primaryDark: '#6D28D9',       // Darker purple (hover states)
    primaryLight: '#A855F7',      // Lighter purple (highlights)

    // Background Colors (Dark Theme)
    background: '#1e1b4b',        // Main dark background
    backgroundSecondary: '#312e81', // Secondary dark background
    backgroundTertiary: '#1e293b', // Card/component backgrounds
    surface: 'rgba(255,255,255,0.1)', // Semi-transparent surfaces
    surfaceElevated: 'rgba(255,255,255,0.15)', // Elevated components

    // Text Colors (Light on Dark)
    textPrimary: '#e2e8f0',       // Main text (light gray)
    textSecondary: '#94a3b8',     // Secondary text
    textMuted: '#64748b',         // Muted text
    textInverse: '#1e1b4b',       // Text on light backgrounds

    // Status Colors
    success: '#10b981',           // Success green
    warning: '#f59e0b',           // Warning orange
    error: '#ef4444',             // Error red
    info: '#3b82f6',              // Info blue

    // Component-specific colors
    cardBackground: 'rgba(255,255,255,0.08)',
    cardBorder: 'rgba(255,255,255,0.12)',
    buttonPrimary: '#7C3AED',
    buttonSecondary: 'rgba(255,255,255,0.1)',
    inputBackground: 'rgba(255,255,255,0.1)',
    inputBorder: 'rgba(255,255,255,0.2)',
    placeholderText: '#9ca3af',
    
    // Floating Action Button
    floatingButton: '#7C3AED',
    floatingButtonShadow: 'rgba(124, 58, 237, 0.3)',
  },

  typography: {
    // Consistent typography across all screens
    h1: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#e2e8f0',
      lineHeight: 34,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      color: '#e2e8f0',
      lineHeight: 30,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#e2e8f0',
      lineHeight: 26,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: '#e2e8f0',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      color: '#94a3b8',
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400',
      color: '#64748b',
      lineHeight: 16,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },

  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
  },

  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
    },
  },
};
```

### Global Theme Provider Setup
```typescript
// App.tsx or theme context
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext(theme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

## 6. Floating Action Button Component

### Reusable FloatingActionButton Component
```typescript
// src/components/FloatingActionButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../styles/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: any;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ 
  onPress, 
  style 
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.floatingButton }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.plusIcon}>+</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  plusIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
```

## 7. Navigation Updates

### Navigation Configuration
```typescript
// Add new screen to navigation stack
import { DayDetailScreen } from '../screens/DayDetailScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e1b4b' },
        headerTintColor: '#e2e8f0',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      {/* Existing screens */}
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardHomeScreen}
        options={{ headerShown: false }}
      />
      
      {/* New Day Detail Screen */}
      <Stack.Screen 
        name="DayDetail" 
        component={DayDetailScreen}
        options={{
          title: 'Day Entries',
          headerBackTitle: 'Back',
        }}
      />
      
      <Stack.Screen 
        name="JournalEntry" 
        component={JournalEntryScreen}
        options={{
          title: 'Journal Entry',
          headerBackTitle: 'Back',
        }}
      />
    </Stack.Navigator>
  );
}
```

## 8. Database Query Updates

### Service Functions for Day-Based Data
```typescript
// src/services/entryService.ts additions:

export const getEntriesGroupedByDay = async (limit: number = 7): Promise<DayCardData[]> => {
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit * 5); // Get more entries to ensure we have enough days

  if (error) throw error;

  return groupEntriesByDay(entries);
};

export const getEntriesForDate = async (date: string): Promise<JournalEntry[]> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const checkJournalEntryExists = async (date: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('user_id', user.id)
    .eq('entry_type', 'journal')
    .gte('created_at', `${date}T00:00:00.000Z`)
    .lt('created_at', `${date}T23:59:59.999Z`);

  if (error) throw error;
  return (data?.length || 0) > 0;
};
```

## 9. Implementation Phases

### Phase 1: Theme Consistency (1-2 hours)
1. Update `designSystem.ts` with complete theme object
2. Apply theme to all existing screens
3. Create `ThemeProvider` and `useTheme` hook
4. Test theme consistency across all screens

### Phase 2: Database Updates (30 minutes)
1. Add `entry_type` and `title` columns to database
2. Update JournalEntry interface
3. Create database constraints for journal entry limits
4. Test database migrations

### Phase 3: Homepage Transformation (2-3 hours)
1. Update `DashboardHomeScreen.tsx` to show day cards
2. Implement day grouping logic
3. Create day card components
4. Add "Show More" functionality
5. Add floating action button

### Phase 4: Day Detail Screen (2-3 hours)
1. Create new `DayDetailScreen.tsx`
2. Implement entry organization (journal vs notes)
3. Add time-based sorting
4. Implement entry navigation
5. Add floating action button

### Phase 5: Entry Type System (1-2 hours)
1. Update `JournalEntryScreen.tsx` with entry type selection
2. Add title field for better organization
3. Implement entry type validation
4. Update entry creation/editing logic

### Phase 6: Testing & Polish (1-2 hours)
1. Test complete navigation flow
2. Verify theme consistency
3. Test entry type constraints
4. Polish animations and transitions
5. Test edge cases (no entries, network issues)

## 10. Success Criteria

### Functional Requirements ✅
- [x] Homepage shows day cards for last 7 days with entries
- [x] Day cards show entry previews and mood summaries
- [x] Day detail screen separates journal entries from notes
- [x] Only one journal entry allowed per day
- [x] Multiple notes allowed per day
- [x] Floating + button on both screens
- [x] Consistent navigation flow
- [x] Theme consistency across all screens

### Visual Requirements ✅
- [x] MyDiary dark purple theme throughout
- [x] Clean, minimal card design
- [x] Proper typography hierarchy
- [x] Smooth animations and transitions
- [x] Responsive layout on different screen sizes

### Technical Requirements ✅
- [x] Database schema supports entry types
- [x] Proper data validation and constraints
- [x] Error handling for edge cases
- [x] Performance optimization for day grouping
- [x] Consistent state management

## 11. File Structure After Implementation

```
src/
├── components/
│   ├── FloatingActionButton.tsx     [NEW]
│   ├── DayCard.tsx                  [NEW]
│   └── EntryCard.tsx                [UPDATED]
├── screens/
│   ├── DashboardHomeScreen.tsx      [MAJOR UPDATE]
│   ├── DayDetailScreen.tsx          [NEW]
│   ├── JournalEntryScreen.tsx       [UPDATED]
│   └── ... (other existing screens)
├── services/
│   ├── entryService.ts              [UPDATED]
│   └── ... (other services)
├── styles/
│   ├── designSystem.ts              [MAJOR UPDATE]
│   └── theme.ts                     [NEW]
├── types/
│   └── index.ts                     [UPDATED - add entry types]
└── utils/
    └── dateHelpers.ts               [NEW]
```

This implementation guide provides a complete roadmap for transforming your journal app into a day-based system with consistent theming. Each phase builds upon the previous one, ensuring a smooth development process.
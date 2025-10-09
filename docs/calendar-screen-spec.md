# Calendar Screen Implementation Specification

## Current State
Currently no calendar screen exists - this is a new feature to implement as a separate page/screen from the home dashboard.

## Target State (Based on MyDiary Screenshots)
Create a dedicated calendar screen that matches the MyDiary calendar interface:

```
┌─────────────────────────────────────┐
│ ← Calendar           Media View     │
├─────────────────────────────────────┤
│ ◀ SEPTEMBER 2025 ▶     TODAY       │
├─────────────────────────────────────┤
│ Sun Mon Tue Wed Thu Fri Sat         │
│                                     │
│ 31   1   2   3   4   5   6         │
│                                     │
│  7   8   9  10  11  12  13         │
│                                     │
│ 14  15  16  17  18  19  20         │
│                                     │
│ 21  22  23  24  25  26 (27)        │
│                                     │
│ 28  29  30   1   2   3   4         │
├─────────────────────────────────────┤
│ Saturday, Sept 27, 2025             │
│                                     │
│ [Entry preview or "No diaries..."]  │
│                                     │
├─────────────────────────────────────┤
│                 (+)                 │
└─────────────────────────────────────┘
```

## Component Architecture

### Main Calendar Screen
```typescript
// New file: src/screens/CalendarScreen.tsx
const CalendarScreen: React.FC = () => {
  // State management for:
  // - Current month/year
  // - Selected date
  // - Entries for visible dates
  // - Loading states
};
```

### Sub-Components Required
```typescript
// 1. Calendar Header
const CalendarHeader: React.FC<{
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onTodayPress: () => void;
}>;

// 2. Calendar Grid
const CalendarGrid: React.FC<{
  currentMonth: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  entriesMap: Map<string, JournalEntry[]>;
}>;

// 3. Date Info Panel
const DateInfoPanel: React.FC<{
  selectedDate: Date;
  entries: JournalEntry[];
  onEntryPress: (entry: JournalEntry) => void;
}>;

// 4. Floating Action Button
const FloatingAddButton: React.FC<{
  onPress: () => void;
}>;
```

## Detailed Implementation Requirements

### 1. Calendar Header
**Visual Design**: Matches MyDiary's header exactly
```typescript
// Structure:
// [←] "Calendar"                    "Media View"
// [◀] "SEPTEMBER 2025" [▶]         "TODAY"

// Functionality:
// - Back arrow: Returns to main dashboard
// - Media View: Optional feature (could show photo grid)
// - Month navigation: Previous/Next month arrows
// - TODAY button: Jumps to current date
// - Month/Year display: Shows current calendar view
```

**Styling Requirements**:
```typescript
const headerStyles = {
  backgroundColor: '#1e1b4b', // Dark purple
  height: 120, // Adequate space for two rows
  paddingTop: StatusBar.currentHeight,
  paddingHorizontal: 16,
};
```

### 2. Calendar Grid Implementation
**Core Logic**:
```typescript
// Generate calendar grid for current month
// Show 6 weeks (42 days total) to accommodate all months
// Include previous/next month dates in gray
// Highlight current date and selected date differently
// Show indicators for dates with entries

const generateCalendarData = (month: Date) => {
  // Returns array of 42 CalendarDay objects
  // Each day includes: date, isCurrentMonth, hasEntries, isSelected, isToday
};
```

**Day Cell Component**:
```typescript
const CalendarDayCell: React.FC<{
  day: CalendarDay;
  onPress: (date: Date) => void;
}> = ({ day, onPress }) => {
  // Styling variations:
  // - Current month vs other months (opacity)
  // - Selected date (white circle background)
  // - Today (underline or border)
  // - Has entries (small dot indicator)
  
  return (
    <TouchableOpacity style={getCellStyle(day)} onPress={() => onPress(day.date)}>
      <Text style={getTextStyle(day)}>{day.date.getDate()}</Text>
      {day.hasEntries && <View style={styles.entryIndicator} />}
    </TouchableOpacity>
  );
};
```

### 3. Selected Date Info Panel
**Functionality**:
```typescript
// Shows selected date in readable format
// Lists entries for that date (if any)
// Displays "No diaries on this day" when empty
// Allows tapping entries to open them

const DateInfoPanel: React.FC = ({ selectedDate, entries }) => {
  return (
    <View style={styles.infoPanel}>
      <Text style={styles.dateHeader}>
        {formatDate(selectedDate)} // "Saturday, Sept 27, 2025"
      </Text>
      
      {entries.length === 0 ? (
        <Text style={styles.emptyText}>No diaries on this day.</Text>
      ) : (
        <ScrollView style={styles.entriesContainer}>
          {entries.map(entry => (
            <EntryPreviewCard key={entry.id} entry={entry} />
          ))}
        </ScrollView>
      )}
    </View>
  );
};
```

### 4. Data Integration

**Entry Loading Strategy**:
```typescript
// Load entries for current month when screen mounts
// Preload previous/next months when user navigates
// Update entry indicators in calendar grid
// Efficient querying to avoid loading unnecessary data

const useCalendarData = (currentMonth: Date) => {
  const [entries, setEntries] = useState<Map<string, JournalEntry[]>>(new Map());
  const [loading, setLoading] = useState(false);
  
  // Load entries for month range
  const loadEntriesForMonth = useCallback(async (month: Date) => {
    const startDate = startOfMonth(month);
    const endDate = endOfMonth(month);
    
    const monthEntries = await journalService.getEntriesInDateRange(
      startDate, 
      endDate
    );
    
    // Group by date for efficient calendar lookup
    const entriesMap = groupEntriesByDate(monthEntries);
    setEntries(entriesMap);
  }, []);
  
  return { entries, loading, loadEntriesForMonth };
};
```

### 5. Navigation Integration
**How users access the calendar**:
```typescript
// Option 1: Tab navigation (add calendar tab)
// Option 2: Header button on dashboard (calendar icon)
// Option 3: Drawer menu item
// Option 4: Floating action menu

// Recommended: Header button on dashboard
// - Calendar icon in top-right of DashboardHomeScreen
// - Navigates to CalendarScreen
// - Back button returns to dashboard
```

**Screen transitions**:
```typescript
// From Dashboard -> Calendar
navigation.navigate('Calendar', { 
  selectedDate: new Date() // Optional initial date
});

// From Calendar -> Entry Detail
navigation.navigate('EntryDetail', {
  entryId: entry.id,
  fromScreen: 'Calendar'
});

// From Calendar -> New Entry
navigation.navigate('JournalEntry', {
  initialDate: selectedDate,
  mode: 'create'
});
```

## Visual Design Specifications

### Color Scheme (Dark Purple Theme)
```typescript
const calendarColors = {
  background: '#1e1b4b',           // Main background
  headerBackground: '#312e81',     // Header area
  textPrimary: '#e2e8f0',         // Main text
  textSecondary: '#94a3b8',       // Secondary text
  textMuted: '#64748b',           // Muted text (other months)
  accent: '#a855f7',              // Purple accent
  selectedBackground: '#ffffff',   // Selected date circle
  selectedText: '#1e1b4b',        // Text on selected date
  todayIndicator: '#a855f7',      // Today underline/border
  entryIndicator: '#fbbf24',      // Small dot for entries
  borderColor: 'rgba(255,255,255,0.1)', // Subtle borders
};
```

### Typography
```typescript
const calendarTypography = {
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: calendarColors.textPrimary,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '600',
    color: calendarColors.textPrimary,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: calendarColors.textPrimary,
  },
  dayNumberOtherMonth: {
    fontSize: 16,
    fontWeight: '500',
    color: calendarColors.textMuted,
  },
  dayNumberSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: calendarColors.selectedText,
  },
  dateInfo: {
    fontSize: 18,
    fontWeight: '500',
    color: calendarColors.accent,
  },
  emptyState: {
    fontSize: 14,
    color: calendarColors.textSecondary,
    fontStyle: 'italic',
  },
};
```

### Layout Spacing
```typescript
const calendarSpacing = {
  screenPadding: 16,
  headerHeight: 120,
  calendarGridHeight: 300,
  dateInfoPanelHeight: 200,
  dayHitSlop: 44, // Minimum touch target
  dayCircleSize: 36,
  entryIndicatorSize: 6,
  sectionGap: 24,
};
```

## Interactive Behaviors

### Date Selection
```typescript
// Single tap on date:
// - Updates selected date state
// - Loads entries for that date
// - Updates info panel
// - Smooth animation to highlight selection

// Long press on date (optional enhancement):
// - Shows quick entry creation option
// - Or shows date options menu
```

### Month Navigation
```typescript
// Arrow button taps:
// - Animate month transition
// - Load new month data
// - Preserve selected date if possible
// - Update month/year display

// Swipe gestures (optional):
// - Horizontal swipes change months
// - Smooth animation transitions
// - Haptic feedback on month change
```

### Entry Interaction
```typescript
// Tap on entry preview:
// - Navigates to full entry view
// - Maintains calendar context for back navigation

// Floating + button:
// - Creates new entry for selected date
// - Pre-fills date field
// - Returns to calendar after save
```

## Implementation Phases

### Phase 1: Basic Calendar Structure (3-4 hours)
1. Create CalendarScreen component
2. Implement calendar grid generation
3. Add month navigation
4. Apply basic dark theme styling

### Phase 2: Data Integration (2-3 hours)
1. Connect to journal entries API
2. Implement entry loading by date range
3. Add entry indicators to calendar
4. Handle loading and error states

### Phase 3: Date Selection & Info Panel (2-3 hours)
1. Implement date selection logic
2. Create date info panel component
3. Show entries for selected date
4. Add entry preview cards

### Phase 4: Navigation & Actions (1-2 hours)
1. Add floating action button
2. Implement navigation to/from other screens
3. Handle new entry creation
4. Add header navigation

### Phase 5: Polish & Animations (1-2 hours)
1. Add smooth transitions
2. Implement loading animations
3. Fine-tune spacing and typography
4. Test responsive behavior

## Technical Considerations

### Date Utilities
```typescript
// Required date manipulation functions:
// - startOfMonth(date)
// - endOfMonth(date)
// - addMonths(date, count)
// - isSameDay(date1, date2)
// - format(date, pattern)
// - getWeeksInMonth(date)

// Recommended: Use date-fns library
import { 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  isSameDay, 
  format 
} from 'date-fns';
```

### Performance Optimization
```typescript
// Optimize calendar rendering:
// - Memoize calendar day calculations
// - Use React.memo for day cells
// - Virtualize month transitions
// - Cache entry queries

const CalendarDay = React.memo<CalendarDayProps>(({ day, onPress }) => {
  // Component implementation
});
```

### Accessibility
```typescript
// Calendar accessibility requirements:
// - Proper role and aria-label for calendar
// - Keyboard navigation between dates
// - Screen reader announcements for date changes
// - Focus management for month navigation

const accessibilityProps = {
  accessibilityRole: 'button',
  accessibilityLabel: `${day.date.getDate()}, ${formatDate(day.date)}`,
  accessibilityHint: day.hasEntries ? 'Has journal entries' : 'No entries',
};
```

## Success Criteria
✅ Calendar visually matches MyDiary screenshots
✅ Month navigation works smoothly
✅ Entry indicators show correctly
✅ Date selection updates info panel
✅ Navigation to/from other screens works
✅ Performance is smooth (no lag on month changes)
✅ Accessibility standards met
✅ Works correctly on different screen sizes
✅ Loading states provide good feedback
✅ Error handling is graceful

## Integration with Existing App
- Add navigation route in your navigation config
- Update DashboardHomeScreen to include calendar button
- Ensure consistent theming with other screens
- Share entry data loading logic with dashboard
- Maintain authentication context throughout
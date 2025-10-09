# Theme Migration Guide

## Completed Screens ✅
- App.tsx (home screen)
- WelcomeScreen.tsx
- SettingsScreen.tsx

## Remaining Screens to Update

### Quick Migration Steps for Each Screen:

#### 1. Update Imports
```typescript
// REMOVE:
import { colors, typography, components } from '../styles/designSystem';

// ADD:
import { useTheme } from '../contexts/ThemeContext';
import { components } from '../styles/designSystem';  // Keep if needed
```

#### 2. Add Theme Hook
```typescript
export const YourScreen: React.FC<Props> = (props) => {
  const { theme } = useTheme();  // Add this line

  // Rest of component...
}
```

#### 3. Update Container/Background Colors
```typescript
// BEFORE:
<View style={styles.container}>
<SafeAreaView style={styles.container}>

// AFTER:
<View style={[styles.container, { backgroundColor: theme.background }]}>
<SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
```

#### 4. Update Text Colors
```typescript
// BEFORE:
<Text style={styles.title}>Hello</Text>

// AFTER:
<Text style={[styles.title, { color: theme.textPrimary }]}>Hello</Text>
```

#### 5. Update Card/Surface Colors
```typescript
// BEFORE:
<View style={styles.card}>

// AFTER:
<View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
```

#### 6. Update Button Colors
```typescript
// BEFORE:
<TouchableOpacity style={styles.button}>

// AFTER:
<TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]}>
  <Text style={[styles.buttonText, { color: theme.white }]}>...</Text>
</TouchableOpacity>
```

#### 7. Remove Hardcoded Colors from StyleSheet
```typescript
// BEFORE:
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',  // REMOVE
    flex: 1,
  },
  title: {
    color: '#000000',  // REMOVE
    fontSize: 20,
  },
});

// AFTER:
const styles = StyleSheet.create({
  container: {
    flex: 1,  // backgroundColor removed - applied dynamically
  },
  title: {
    fontSize: 20,  // color removed - applied dynamically
  },
});
```

## Color Mapping Reference

### Background Colors:
- `#ffffff`, `colors.white`, `colors.gray100` → `theme.background`
- `#f8fafc`, `colors.gray50` → `theme.backgroundSecondary`
- Card backgrounds → `theme.cardBackground`
- Surface backgrounds → `theme.surface`

### Text Colors:
- `#000000`, `colors.gray900`, primary text → `theme.textPrimary`
- `colors.gray600`, `colors.gray700`, secondary text → `theme.textSecondary`
- `colors.gray500`, muted text → `theme.textMuted`

### Border Colors:
- Card borders → `theme.cardBorder`
- Input borders → `theme.inputBorder`

### Component Colors:
- Primary buttons → `theme.primary` (bg), `theme.white` (text)
- Secondary buttons → `theme.surface` (bg), `theme.primary` (text/border)
- Success → `theme.success`
- Error → `theme.error`
- Warning → `theme.warning`

## Screen-Specific Notes:

### SignInScreen.tsx & SignUpScreen.tsx
- Update form backgrounds
- Update input styles
- Update error message colors
- Update button colors

### Onboarding Screens
- OnboardingFlow.tsx - Container and navigation
- OnboardingPreferencesScreen.tsx - Cards and options
- OnboardingFirstEntryScreen.tsx - Entry form and mood selector

### Dashboard & Entry Screens
- DashboardHomeScreen.tsx - Main dashboard, cards, FAB
- JournalEntryScreen.tsx - Entry editor, chat interface
- EntryDetailScreen.tsx - Entry display, insight cards
- DayDetailScreen.tsx - Day summary, entry list
- CalendarScreen.tsx - Calendar grid, day indicators

### Other Screens
- SubscriptionPaywallScreen.tsx - Pricing cards, features

## Testing Checklist

For each updated screen:
- [ ] Check in light mode
- [ ] Check in dark mode
- [ ] Check in system mode (both light and dark)
- [ ] Verify all text is readable
- [ ] Verify all borders are visible
- [ ] Verify buttons have proper contrast
- [ ] Check loading states
- [ ] Check error states
- [ ] Check empty states

## Common Patterns

### Pattern 1: Simple Background
```typescript
<View style={[styles.container, { backgroundColor: theme.background }]}>
```

### Pattern 2: Card with Border
```typescript
<View style={[
  styles.card,
  {
    backgroundColor: theme.cardBackground,
    borderColor: theme.cardBorder
  }
]}>
```

### Pattern 3: Text Hierarchy
```typescript
<Text style={[styles.heading, { color: theme.textPrimary }]}>Title</Text>
<Text style={[styles.body, { color: theme.textSecondary }]}>Body</Text>
<Text style={[styles.caption, { color: theme.textMuted }]}>Caption</Text>
```

### Pattern 4: Conditional Styling (Selected State)
```typescript
<View style={[
  styles.option,
  isSelected && {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  }
]}>
  <Text style={[
    styles.optionText,
    { color: isSelected ? theme.white : theme.textPrimary }
  ]}>
    Option
  </Text>
</View>
```

## Automation Script (Future)

Consider creating a script to automate common replacements:
- Replace `backgroundColor: colors.white` → remove from stylesheet
- Replace `color: colors.gray900` → remove from stylesheet
- Add theme hook import
- Add theme destructuring

## Next Steps

1. Update screens one by one following the migration steps
2. Test each screen in both light and dark modes
3. Fix any contrast or visibility issues
4. Update THEME_SYSTEM.md to mark screens as completed
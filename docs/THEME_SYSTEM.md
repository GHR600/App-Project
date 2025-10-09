# Theme System Implementation

## Overview
A comprehensive theme system has been implemented with support for light mode, dark mode, and automatic system theme detection.

## Files Created/Modified

### New Files:
1. **`src/contexts/ThemeContext.tsx`** - Theme provider with React Context
   - Light and dark theme definitions
   - System theme detection
   - Theme persistence with AsyncStorage
   - `useTheme()` hook for consuming theme

2. **`src/screens/SettingsScreen.tsx`** - Settings screen with theme toggle
   - Theme selection UI (Light, Dark, System)
   - Visual theme previews
   - Additional settings sections

### Modified Files:
1. **`src/App.tsx`** - Integrated theme throughout the app
   - Added ThemeProvider wrapper
   - Updated home screen to use theme colors
   - Dynamic StatusBar style based on theme

## Theme Structure

### Theme Colors
Both light and dark themes include:
- **Primary colors**: `primary`, `primaryDark`, `primaryLight`
- **Background colors**: `background`, `backgroundSecondary`, `backgroundTertiary`, `surface`, `surfaceElevated`
- **Text colors**: `textPrimary`, `textSecondary`, `textMuted`, `textInverse`
- **Status colors**: `success`, `warning`, `error`, `info`
- **Component colors**: `cardBackground`, `cardBorder`, `buttonPrimary`, `buttonSecondary`, `inputBackground`, `inputBorder`, etc.
- **Legacy colors**: Full gray scale palette for compatibility

### Light Theme
- Clean white backgrounds
- Dark text on light backgrounds
- High contrast for readability
- Traditional app appearance

### Dark Theme
- Deep dark backgrounds (`#0f172a`)
- Light text on dark backgrounds
- Semi-transparent surfaces
- Reduced eye strain in low light

## Usage

### Accessing Theme in Components

```typescript
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.textPrimary }}>Hello</Text>
    </View>
  );
};
```

### Theme Properties
- `theme`: Current theme object with all colors
- `isDark`: Boolean indicating if dark mode is active
- `themeMode`: Current mode ('light' | 'dark' | 'system')
- `setThemeMode(mode)`: Function to change theme mode

### System Theme Detection
When set to 'system' mode, the app automatically:
- Detects the device's appearance preference
- Updates when the system theme changes
- Persists the system preference

## Theme Persistence
Theme preferences are saved to AsyncStorage and restored on app launch.

## Next Steps

### Screens to Update:
The following screens still need theme integration:
1. ✓ App.tsx (home screen) - COMPLETED
2. ✗ WelcomeScreen.tsx
3. ✗ SignInScreen.tsx
4. ✗ SignUpScreen.tsx
5. ✗ OnboardingFlow.tsx
6. ✗ OnboardingPreferencesScreen.tsx
7. ✗ OnboardingFirstEntryScreen.tsx
8. ✗ DashboardHomeScreen.tsx
9. ✗ JournalEntryScreen.tsx
10. ✗ EntryDetailScreen.tsx
11. ✗ DayDetailScreen.tsx
12. ✗ CalendarScreen.tsx
13. ✗ SubscriptionPaywallScreen.tsx

### Update Pattern:
For each screen:
1. Import `useTheme` hook
2. Replace hardcoded colors with theme colors
3. Remove backgroundColor from StyleSheet, apply dynamically
4. Update text colors to use theme
5. Test in both light and dark modes

### Example Migration:
```typescript
// Before:
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>

const styles = StyleSheet.create({
  container: { backgroundColor: '#ffffff' },
  title: { color: '#000000' }
});

// After:
const { theme } = useTheme();

<View style={[styles.container, { backgroundColor: theme.background }]}>
  <Text style={[styles.title, { color: theme.textPrimary }]}>Hello</Text>
</View>

const styles = StyleSheet.create({
  container: { flex: 1 },  // Remove backgroundColor
  title: { fontSize: 20 }   // Remove color
});
```

## Benefits
- ✅ Consistent appearance across the app
- ✅ Reduced eye strain with dark mode
- ✅ Follows system preferences
- ✅ Persists user choice
- ✅ Easy to maintain and extend
- ✅ Accessible design patterns
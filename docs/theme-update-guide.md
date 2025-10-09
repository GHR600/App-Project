# MyDiary Dark Purple Theme Implementation

## Current Theme Analysis
Your app currently uses a blue-based theme defined in `src/styles/designSystem.ts`:
- Primary: `#2563eb` (blue)
- Secondary: `#7c3aed` (purple - already partially there!)
- Background: White/light grays
- Text: Dark colors

## Target Theme (MyDiary Style)
Based on the screenshots, implement this dark purple theme:

### Core Color Palette
```typescript
// Update src/styles/designSystem.ts with these colors:

export const colors = {
  // Primary Colors
  primary: '#7C3AED',           // Main purple (buttons, links, accents)
  primaryDark: '#6D28D9',       // Darker purple (hover states)
  primaryLight: '#A855F7',      // Lighter purple (highlights)
  
  // Background Colors
  background: '#1e1b4b',        // Main dark background
  backgroundSecondary: '#312e81', // Secondary dark background
  backgroundTertiary: '#1e293b', // Card/component backgrounds
  surface: 'rgba(255,255,255,0.1)', // Semi-transparent surfaces
  surfaceElevated: 'rgba(255,255,255,0.15)', // Elevated components
  
  // Text Colors
  textPrimary: '#e2e8f0',       // Main text (light gray)
  textSecondary: '#94a3b8',     // Secondary text
  textMuted: '#64748b',         // Muted text
  textInverse: '#1e1b4b',       // Text on light backgrounds
  
  // Status Colors (keep existing but adjust for dark theme)
  success: '#10b981',           // Success green
  error: '#ef4444',             // Error red
  warning: '#f59e0b',           // Warning orange
  info: '#3b82f6',              // Info blue
  
  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  
  // Component-specific colors
  cardBackground: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.12)',
  buttonPrimary: '#7C3AED',
  buttonSecondary: 'rgba(255,255,255,0.1)',
  inputBackground: 'rgba(255,255,255,0.1)',
  inputBorder: 'rgba(255,255,255,0.2)',
  placeholderText: '#9ca3af',
};
```

### Typography Updates
```typescript
// Adjust typography for dark theme readability
export const typography = {
  heading: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary, // Update to light text
    lineHeight: 32,
  },
  subheading: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 28,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  small: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 16,
  },
};
```

## Component Theme Updates

### 1. Card Components
```typescript
// Update card styling for dark theme
export const components = {
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, // Increased for dark theme
    shadowRadius: 8,
    elevation: 8,
  },
  
  // ... other component styles
};
```

### 2. Button Components
```typescript
// Update button styles for purple theme
const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  secondary: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  
  text: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
};
```

### 3. Input Components
```typescript
const inputStyles = {
  container: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  text: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  
  placeholder: {
    color: colors.placeholderText,
  },
  
  focused: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
};
```

## Screen-Specific Theme Applications

### 1. Status Bar Configuration
```typescript
// Update App.tsx or screen headers
import { StatusBar } from 'expo-status-bar';

// Set status bar to light content for dark theme
<StatusBar style="light" backgroundColor={colors.background} />
```

### 2. Navigation Theme
```typescript
// If using React Navigation, update theme
import { DefaultTheme } from '@react-navigation/native';

const DarkPurpleTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.backgroundSecondary,
    text: colors.textPrimary,
    border: colors.cardBorder,
    notification: colors.primary,
  },
};
```

### 3. Safe Area Styling
```typescript
// Update SafeAreaView styling
const safeAreaStyle = {
  flex: 1,
  backgroundColor: colors.background,
};
```

## Gradient Backgrounds (Optional Enhancement)
```typescript
// For more visual appeal, add subtle gradients
import { LinearGradient } from 'expo-linear-gradient';

const backgroundGradient = {
  colors: ['#1e1b4b', '#312e81', '#1e293b'],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

// Usage in components:
<LinearGradient 
  colors={backgroundGradient.colors}
  start={backgroundGradient.start}
  end={backgroundGradient.end}
  style={styles.container}
>
  {/* Your content */}
</LinearGradient>
```

## Implementation Steps

### Phase 1: Update Design System (15 minutes)
1. Replace colors in `src/styles/designSystem.ts`
2. Update typography colors
3. Adjust component base styles

### Phase 2: Screen-by-Screen Updates (2-3 hours)
1. **App.tsx**: Update status bar and theme provider
2. **DashboardHomeScreen.tsx**: Apply new colors and card styles
3. **JournalEntryScreen.tsx**: Update input and button styling
4. **WelcomeScreen.tsx**: Adjust for dark theme
5. **SignUpScreen.tsx**: Update form styling
6. **OnboardingFlow screens**: Apply consistent theming

### Phase 3: Component Updates (1-2 hours)
1. Update any custom components in `src/components/`
2. Ensure all text is visible on dark backgrounds
3. Test input field visibility and contrast
4. Verify button states (pressed, disabled, etc.)

### Phase 4: Testing & Refinement (30 minutes)
1. Test on both iOS and Android
2. Verify accessibility contrast ratios
3. Check all interactive states
4. Fine-tune any visual issues

## Dark Theme Best Practices

### Contrast Requirements
```typescript
// Ensure sufficient contrast ratios:
// - Normal text: 4.5:1 minimum
// - Large text: 3:1 minimum
// - Interactive elements: 3:1 minimum

// Use these utilities to verify:
const checkContrast = (foreground: string, background: string) => {
  // Implementation to calculate contrast ratio
  // Should be ≥ 4.5 for normal text
};
```

### Visual Hierarchy
```typescript
// Use opacity and color variations for hierarchy:
const textHierarchy = {
  primary: colors.textPrimary,           // 100% opacity - main content
  secondary: colors.textSecondary,       // 70% opacity - secondary content
  muted: colors.textMuted,              // 50% opacity - subtle content
  disabled: `${colors.textPrimary}40`,  // 25% opacity - disabled content
};
```

### Elevation & Shadows
```typescript
// Adjust shadows for dark theme:
const darkThemeShadows = {
  elevation1: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5, // Higher opacity for visibility
    shadowRadius: 2,
    elevation: 2,
  },
  elevation2: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  // ... additional elevation levels
};
```

## Success Criteria
✅ All screens use consistent dark purple theme
✅ Text is clearly readable on all backgrounds
✅ Interactive elements have clear visual feedback
✅ App feels cohesive with MyDiary aesthetic
✅ No accessibility contrast violations
✅ Smooth transitions between light and dark elements
✅ Purple accent color is used consistently throughout
✅ All input fields and buttons follow new theme

## Common Issues to Watch For
- White text on white backgrounds
- Invisible placeholder text
- Poor contrast on disabled states
- Inconsistent purple accent usage
- Missing focus indicators
- Broken card shadows on dark backgrounds

## Testing Checklist
- [ ] All screens render correctly
- [ ] Text inputs are visible and functional
- [ ] Buttons show proper states (normal, pressed, disabled)
- [ ] Navigation elements are clearly visible
- [ ] Loading states work with dark theme
- [ ] Error messages are readable
- [ ] Success feedback is visible
- [ ] Interactive elements have proper touch feedback

## File-by-File Implementation Guide

### 1. Update Design System First
**File**: `src/styles/designSystem.ts`
```typescript
// Replace the entire colors object with the new palette above
// Update typography color references
// Adjust component styles for dark theme
```

### 2. Update App Root
**File**: `src/App.tsx`
```typescript
// Add status bar configuration
// Apply navigation theme if using React Navigation
// Ensure safe area uses dark background
```

### 3. Update Individual Screens
**In order of priority:**

**DashboardHomeScreen.tsx**:
- Apply new card background colors
- Update text colors to light variants
- Adjust stat card styling
- Test entry card readability

**JournalEntryScreen.tsx**:
- Update input field backgrounds
- Ensure placeholder text is visible
- Apply purple accents to buttons
- Test mood selection visibility

**WelcomeScreen.tsx**:
- Update background colors
- Ensure feature text is readable
- Adjust button styling
- Test logo/image visibility

**SignUpScreen.tsx**:
- Update form input styling
- Ensure validation messages are visible
- Apply consistent button theming
- Test error state visibility

**OnboardingFlow screens**:
- Apply consistent dark theming
- Update progress indicators
- Ensure step navigation is clear
- Test completion states

### 4. Component Updates
**File**: `src/components/` (any custom components)
- Update background colors
- Ensure text contrast
- Apply consistent styling
- Test all interactive states

## Verification Steps

### Visual Verification
1. Launch app and navigate through all screens
2. Check text readability in all lighting conditions
3. Verify button states (normal, pressed, disabled)
4. Ensure loading states are visible
5. Test form inputs and placeholders

### Functional Verification
1. All touch targets respond correctly
2. Navigation works smoothly
3. Input fields accept text properly
4. Error messages display correctly
5. Success feedback is visible

### Cross-Platform Testing
1. Test on iOS simulator/device
2. Test on Android emulator/device
3. Verify consistent appearance
4. Check platform-specific elements (status bar, navigation)

## Rollback Plan
If issues arise during implementation:

1. **Keep backup of original `designSystem.ts`**
2. **Test one screen at a time**
3. **Revert problematic changes immediately**
4. **Use version control to track changes**

## Post-Implementation Tasks

### Performance Check
- Verify app startup time hasn't changed
- Check for memory leaks in dark theme assets
- Ensure smooth animations and transitions

### User Testing
- Gather feedback on readability
- Test in various lighting conditions
- Verify accessibility with screen readers
- Check user preference for dark theme

### Future Enhancements
- Add theme toggle (light/dark mode)
- Implement system theme detection
- Add theme persistence in user preferences
- Consider additional color variants
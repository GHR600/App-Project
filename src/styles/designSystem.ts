export const colors = {
  // Primary Colors (Metallic Amber/Gold Theme)
  primary: '#d97706',           // Main amber (buttons, links, accents) - amber-600
  primaryDark: '#b45309',       // Darker amber (hover states) - amber-700
  primaryLight: '#f59e0b',      // Lighter amber (highlights) - amber-500

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

  // Legacy/Fallback Colors
  secondary: '#d97706',         // Keep for compatibility
  white: '#ffffff',
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
  buttonPrimary: '#d97706',
  buttonSecondary: 'rgba(255,255,255,0.1)',
  inputBackground: 'rgba(255,255,255,0.1)',
  inputBorder: 'rgba(255,255,255,0.2)',
  placeholderText: '#9ca3af',

  // Floating Action Button
  floatingButton: '#d97706',
  floatingButtonShadow: 'rgba(180, 83, 9, 0.3)',

  // Additional colors for extended functionality
  green600: '#10b981',
  red600: '#ef4444',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  yellow800: '#a16207',
  blue600: '#3b82f6'
};

export const typography = {
  // Consistent typography across all screens
  h1: {
    fontSize: 28,
    fontWeight: 'bold' as 'bold',
    color: colors.textPrimary,
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as '600',
    color: colors.textPrimary,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as '600',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as '400',
    color: colors.textPrimary,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as '400',
    color: colors.textMuted,
    lineHeight: 16,
  },
  // Legacy support
  heading: {
    fontFamily: 'Inter',
    fontWeight: 'bold' as 'bold',
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 32,
  },
  subheading: {
    fontFamily: 'Inter',
    fontWeight: '600' as '600',
    fontSize: 20,
    color: colors.textPrimary,
    lineHeight: 28,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
};

export const shadows = {
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
};

export const components = {
  button: {
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  input: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.textPrimary,
  },
  card: {
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3, // Increased for dark theme visibility
    shadowRadius: 8,
    elevation: 8
  }
};

// Complete theme object for consistent application
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
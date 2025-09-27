export const colors = {
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

  // Legacy/Fallback Colors
  secondary: '#7c3aed',         // Keep for compatibility
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
  buttonPrimary: '#7C3AED',
  buttonSecondary: 'rgba(255,255,255,0.1)',
  inputBackground: 'rgba(255,255,255,0.1)',
  inputBorder: 'rgba(255,255,255,0.2)',
  placeholderText: '#9ca3af',

  // Additional colors for extended functionality
  green600: '#10b981',
  red600: '#ef4444',
  yellow600: '#f59e0b',
  blue600: '#3b82f6',
  purple600: '#7c3aed'
};

export const typography = {
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
  body: {
    fontFamily: 'Inter',
    fontWeight: 'normal' as 'normal',
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  caption: {
    fontFamily: 'Inter',
    fontWeight: 'normal' as 'normal',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  small: {
    fontFamily: 'Inter',
    fontWeight: 'normal' as 'normal',
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
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
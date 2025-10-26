import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface Typography {
  // Font Families
  fontFamily: {
    heading: string;
    body: string;
  };

  // Font Sizes
  fontSize: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
  };

  // Font Weights
  fontWeight: {
    regular: '400';
    semibold: '600';
    bold: '700';
  };
}

interface ThemeColors {
  // Primary Colors
  primary: string;
  primaryDark: string;
  primaryLight: string;

  // Background Colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceElevated: string;

  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Status Colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Component-specific colors
  cardBackground: string;
  cardBorder: string;
  buttonPrimary: string;
  buttonSecondary: string;
  inputBackground: string;
  inputBorder: string;
  placeholderText: string;
  floatingButton: string;
  floatingButtonShadow: string;

  // Legacy/Fallback Colors
  white: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
}

interface ThemeContextType {
  theme: ThemeColors;
  typography: Typography;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const lightTheme: ThemeColors = {
  // Primary Colors
  primary: '#ca8a04',       // yellow-600
  primaryDark: '#a16207',   // yellow-700
  primaryLight: '#eab308',  // yellow-500

  // Background Colors (Light Theme)
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  backgroundTertiary: '#f1f5f9',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  // Text Colors (Dark on Light)
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textInverse: '#ffffff',

  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Component-specific colors
  cardBackground: '#ffffff',
  cardBorder: '#e2e8f0',
  buttonPrimary: '#ca8a04',
  buttonSecondary: '#f1f5f9',
  inputBackground: '#ffffff',
  inputBorder: '#cbd5e1',
  placeholderText: '#94a3b8',
  floatingButton: '#ca8a04',
  floatingButtonShadow: 'rgba(161, 98, 7, 0.3)',

  // Legacy/Fallback Colors
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
};

const darkTheme: ThemeColors = {
  // Primary Colors
  primary: '#ca8a04',       // yellow-600
  primaryDark: '#a16207',   // yellow-700
  primaryLight: '#eab308',  // yellow-500

  // Background Colors - CHANGE THESE:
  background: '#0a0a0a',              // Change from '#0f172a' to pure black
  backgroundSecondary: '#0a0a0a',     // Change from '#1e293b' to pure black  
  backgroundTertiary: '#1a1a1a',      // Change from '#334155' to dark gray
  surface: 'rgba(255,255,255,0.05)',  // Keep as is (subtle overlay)
  surfaceElevated: 'rgba(255,255,255,0.1)', // Keep as is

  // Text Colors (Light on Dark)
  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textInverse: '#0f172a',

  // Status Colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Component-specific colors
  cardBackground: 'rgba(255,255,255,0.05)',
  cardBorder: 'rgba(255,255,255,0.1)',
  buttonPrimary: '#ca8a04',
  buttonSecondary: 'rgba(255,255,255,0.1)',
  inputBackground: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.15)',
  placeholderText: '#64748b',
  floatingButton: '#ca8a04',
  floatingButtonShadow: 'rgba(161, 98, 7, 0.3)',

  // Legacy/Fallback Colors
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
};

// Typography configuration
const typography: Typography = {
  fontFamily: {
    heading: 'Yellowtail_400Regular',
    body: 'Inter_400Regular',
  },
  fontSize: {
    h1: 48,
    h2: 36,
    h3: 24,
    body: 16,
    small: 14,
  },
  fontWeight: {
    regular: '400',
    semibold: '600',
    bold: '700',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });

    return () => subscription.remove();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Determine effective theme
  const effectiveTheme = themeMode === 'system' ? systemTheme : themeMode;
  const isDark = effectiveTheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, typography, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
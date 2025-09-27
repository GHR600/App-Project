export const colors = {
  primary: '#2563eb',
  secondary: '#7c3aed',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  // Additional colors for extended functionality
  green600: '#059669',
  red600: '#dc2626',
  yellow600: '#d97706',
  blue600: '#2563eb',
  purple600: '#7c3aed'
};

export const typography = {
  heading: {
    fontFamily: 'Inter',
    fontWeight: 'bold' as 'bold',
    fontSize: 24
  },
  body: {
    fontFamily: 'Inter',
    fontWeight: 'normal' as 'normal',
    fontSize: 16
  },
  caption: {
    fontFamily: 'Inter',
    fontWeight: 'normal' as 'normal',
    fontSize: 14
  }
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
    padding: 16
  },
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  }
};
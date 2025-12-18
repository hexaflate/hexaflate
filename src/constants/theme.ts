// Design token constants for consistent styling

export const SPACING = {
  0: '0', 1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem',
  5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem', 12: '3rem',
  16: '4rem', 20: '5rem', 24: '6rem'
} as const;

export const FONT_SIZE = {
  xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem',
  xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem'
} as const;

export const FONT_WEIGHT = {
  normal: '400', medium: '500', semibold: '600', bold: '700'
} as const;

export const BORDER_RADIUS = {
  none: '0', sm: '0.25rem', md: '0.375rem', lg: '0.5rem',
  xl: '0.75rem', full: '9999px'
} as const;

export const Z_INDEX = {
  dropdown: '1000', modal: '1050', tooltip: '1070'
} as const;

export const BREAKPOINTS = {
  sm: '640px', md: '768px', lg: '1024px', xl: '1280px'
} as const;

export const COLORS = {
  primary: { 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
  success: { 500: '#22c55e', 600: '#16a34a' },
  warning: { 500: '#f59e0b', 600: '#d97706' },
  danger: { 500: '#ef4444', 600: '#dc2626' },
  info: { 500: '#3b82f6', 600: '#2563eb' },
  neutral: { 100: '#f3f4f6', 500: '#6b7280', 900: '#111827' }
} as const;

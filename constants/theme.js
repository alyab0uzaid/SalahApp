/**
 * Theme Constants
 *
 * Centralized design system for the SalahApp.
 * Contains colors, typography, spacing, and other design tokens.
 */

// Color Palette
export const COLORS = {
  // Background colors - warm neutral tones (same shade, no blue tint)
  background: {
    primary: '#0D0C0E',      // Main app background
    secondary: '#151314',    // Card/container background
    tertiary: '#1F1E20',     // Highlighted containers
  },

  // Border colors - warm neutral tones
  border: {
    primary: '#232225',      // Default borders
    secondary: '#262528',    // Subtle borders
  },

  // Text colors - warm neutral tones
  text: {
    primary: '#FFFFFF',      // Main text
    secondary: '#B0B0B0',    // Dimmed text (neutral gray)
    tertiary: '#999',        // Placeholder/hint text
    disabled: '#666',        // Disabled/past items
    faded: '#5F5F5F',        // Very faded text (neutral gray, no blue tint)
  },

  // Accent colors
  accent: {
    white: '#FFFFFF',        // White accents/highlights
    gradient: '#232225',     // Gradient stops
  },
};

// Typography
export const FONTS = {
  // Font families
  families: {
    primary: 'SpaceGrotesk',
    mono: 'SpaceMono',
  },

  // Font weights with full names for React Native
  weights: {
    regular: {
      primary: 'SpaceGrotesk_400Regular',
      mono: 'SpaceMono_400Regular',
    },
    medium: {
      primary: 'SpaceGrotesk_500Medium',
    },
    bold: {
      primary: 'SpaceGrotesk_700Bold',
      mono: 'SpaceMono_700Bold',
    },
  },

  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 48,
  },
};

// Spacing scale (based on 4px base unit)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

// Border radius values
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
};

// Icon sizes
export const ICON_SIZES = {
  sm: 16,
  md: 24,
  lg: 26,
};

// Default export for convenience
export default {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  ICON_SIZES,
};

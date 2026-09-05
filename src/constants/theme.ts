/**
 * FarmConnect design system — "Greens & Earth Tones" (see DESIGN.md §1).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Text
    text: '#2E2A26', // deep charcoal-brown, softer than pure black
    textSecondary: '#7B8775', // moss gray — subtitles, distances
    // Surfaces
    background: '#F9F6F0', // oatmeal / warm sand app base
    backgroundElement: '#FFFFFF', // cards
    backgroundSelected: '#EFE8DA',
    surface: '#FFFFFF',
    border: '#E7DFCF',
    // Brand
    primary: '#2C5F2D', // pine green — primary action, active tabs
    onPrimary: '#F9F6F0',
    accent: '#E27D60', // terracotta clay — sale tags, alerts
    onAccent: '#FFFFFF',
    ochre: '#D4A373', // golden ochre — star ratings, warm accents
  },
  dark: {
    text: '#F3EEE2',
    textSecondary: '#A6AE9C',
    background: '#17150F',
    backgroundElement: '#221F17',
    backgroundSelected: '#2E2A20',
    surface: '#221F17',
    border: '#37322A',
    primary: '#5BA45A',
    onPrimary: '#12110C',
    accent: '#E9917A',
    onAccent: '#221F17',
    ochre: '#DDBB8D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Inter faces loaded in the root layout via @expo-google-fonts/inter. */
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: Font.regular,
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: Font.regular,
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Card corner radius — DESIGN.md §1.3 (8–12px). */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

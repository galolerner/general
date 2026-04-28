import { useColorScheme } from 'react-native';
import type { HabitColor } from '@/types';

export const palette = {
  violet: { base: '#7C5CFF', soft: '#7C5CFF22' },
  blue: { base: '#3B82F6', soft: '#3B82F622' },
  green: { base: '#22C55E', soft: '#22C55E22' },
  orange: { base: '#F97316', soft: '#F9731622' },
  pink: { base: '#EC4899', soft: '#EC489922' },
  red: { base: '#EF4444', soft: '#EF444422' },
  teal: { base: '#14B8A6', soft: '#14B8A622' },
  yellow: { base: '#EAB308', soft: '#EAB30822' },
} as const;

export const habitColor = (c: HabitColor) => palette[c];

const lightColors = {
  bg: '#F7F7FA',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#0B0B0F',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  divider: '#EEF0F4',
  primary: '#7C5CFF',
  success: '#22C55E',
  danger: '#EF4444',
  overlay: '#0B0B0F88',
};

const darkColors = {
  bg: '#0B0B0F',
  card: '#15151B',
  cardElevated: '#1C1C24',
  text: '#F5F5F7',
  textMuted: '#9CA3AF',
  border: '#23232C',
  divider: '#1A1A22',
  primary: '#9D85FF',
  success: '#34D399',
  danger: '#F87171',
  overlay: '#000000AA',
};

export type ThemeColors = typeof lightColors;

export const useTheme = () => {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    radius: { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 },
    typography: {
      title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
      heading: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
      subheading: { fontSize: 17, fontWeight: '600' as const },
      body: { fontSize: 15, fontWeight: '500' as const },
      caption: { fontSize: 13, fontWeight: '500' as const },
      tiny: { fontSize: 11, fontWeight: '600' as const },
    },
  };
};

export type Theme = ReturnType<typeof useTheme>;

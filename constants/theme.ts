import { Platform } from 'react-native';
const tintColorLight = '#2563EB';
const tintColorDark = '#60A5FA';
export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E2E8F0',
  },
  dark: {
    text: '#E5E7EB',
    background: '#020617',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    card: '#020617',
    border: '#1E293B',
  },
};
export const colors = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primarySoft: '#DBEAFE',
  secondary: '#6366F1',
  accent: '#10B981',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0EA5E9',
  background: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textLight: '#94A3B8',
  textInverse: '#FFFFFF',
  border: '#E2E8F0',
  divider: '#CBD5E1',
};
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 28,
  pill: 999,
};
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};
export const motion = {
  fast: 120,
  normal: 220,
  slow: 320,
  easing: 'ease-in-out',
};
export const skeleton = {
  base: '#E5E7EB',
  highlight: '#F1F5F9',
};
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:
      "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
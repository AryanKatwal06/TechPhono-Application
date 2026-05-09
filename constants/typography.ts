/**
 * Typography System
 * Defines responsive font sizes, line heights, and font weights
 * Adapts across mobile, tablet, and desktop platforms
 */

import { Platform } from 'react-native';

// ============================================================================
// FONT FAMILIES (Platform-aware)
// ============================================================================

export const fontFamilies = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif-black',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    web: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    default: 'monospace',
  }),
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: 'Georgia, "Times New Roman", serif',
    default: 'serif',
  }),
} as const;

// ============================================================================
// FONT WEIGHTS
// ============================================================================

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

// ============================================================================
// HEADING STYLES (H1 - H4)
// ============================================================================

/**
 * Heading 1 - Hero/Page titles
 * Mobile: 32px | Tablet: 36px | Desktop: 40px
 */
export const h1 = {
  mobile: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
  tablet: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
  desktop: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
} as const;

/**
 * Heading 2 - Section titles
 * Mobile: 28px | Tablet: 32px | Desktop: 36px
 */
export const h2 = {
  mobile: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
  tablet: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
  desktop: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
} as const;

/**
 * Heading 3 - Subsection titles
 * Mobile: 22px | Tablet: 26px | Desktop: 28px
 */
export const h3 = {
  mobile: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
  tablet: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
  desktop: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontWeights.bold as any,
    fontFamily: fontFamilies.bold,
  },
} as const;

/**
 * Heading 4 - Component titles
 * Mobile: 18px | Tablet: 20px | Desktop: 22px
 */
export const h4 = {
  mobile: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeights.semibold as any,
    fontFamily: fontFamilies.medium,
  },
  tablet: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeights.semibold as any,
    fontFamily: fontFamilies.medium,
  },
  desktop: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeights.semibold as any,
    fontFamily: fontFamilies.medium,
  },
} as const;

// ============================================================================
// BODY TEXT STYLES
// ============================================================================

/**
 * Body Large - Prominent body text
 * Mobile: 17px | Tablet: 18px | Desktop: 18px
 */
export const bodyLarge = {
  mobile: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  tablet: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  desktop: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
} as const;

/**
 * Body - Default body text
 * Mobile: 16px | Tablet: 16px | Desktop: 16px
 */
export const body = {
  mobile: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  tablet: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  desktop: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
} as const;

/**
 * Body Small - Secondary body text
 * Mobile: 14px | Tablet: 15px | Desktop: 15px
 */
export const bodySmall = {
  mobile: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  tablet: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  desktop: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
} as const;

// ============================================================================
// LABEL & CAPTION STYLES
// ============================================================================

/**
 * Label - Form labels, tags
 * Mobile: 14px | Tablet: 14px | Desktop: 14px
 */
export const label = {
  mobile: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium as any,
    fontFamily: fontFamilies.medium,
    letterSpacing: 0.5,
  },
  tablet: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium as any,
    fontFamily: fontFamilies.medium,
    letterSpacing: 0.5,
  },
  desktop: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontWeights.medium as any,
    fontFamily: fontFamilies.medium,
    letterSpacing: 0.5,
  },
} as const;

/**
 * Caption - Helper text, metadata
 * Mobile: 12px | Tablet: 13px | Desktop: 13px
 */
export const caption = {
  mobile: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  tablet: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  desktop: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
} as const;

/**
 * Tiny - Very small text (badges, hints)
 * Mobile: 10px | Tablet: 11px | Desktop: 11px
 */
export const tiny = {
  mobile: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  tablet: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  desktop: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
} as const;

// ============================================================================
// UTILITY STYLES
// ============================================================================

/**
 * Button Text - Text inside buttons
 * Mobile: 16px | Tablet: 16px | Desktop: 16px
 */
export const buttonText = {
  mobile: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeights.semibold as any,
    fontFamily: fontFamilies.medium,
  },
  tablet: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeights.semibold as any,
    fontFamily: fontFamilies.medium,
  },
  desktop: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeights.semibold as any,
    fontFamily: fontFamilies.medium,
  },
} as const;

/**
 * Input Text - Text inside input fields
 * Mobile: 16px | Tablet: 16px | Desktop: 16px
 */
export const inputText = {
  mobile: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  tablet: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  desktop: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
} as const;

/**
 * Placeholder Text - Input placeholders
 * Mobile: 16px | Tablet: 16px | Desktop: 16px
 */
export const placeholderText = {
  mobile: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  tablet: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
  desktop: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontWeights.regular as any,
    fontFamily: fontFamilies.regular,
  },
} as const;

// ============================================================================
// PRESET COMBINATIONS
// ============================================================================

/**
 * Get typography for a specific device type
 */
export const getTypographyForDevice = (device: 'mobile' | 'tablet' | 'desktop') => ({
  h1: h1[device],
  h2: h2[device],
  h3: h3[device],
  h4: h4[device],
  bodyLarge: bodyLarge[device],
  body: body[device],
  bodySmall: bodySmall[device],
  label: label[device],
  caption: caption[device],
  tiny: tiny[device],
  buttonText: buttonText[device],
  inputText: inputText[device],
  placeholderText: placeholderText[device],
});

// ============================================================================
// EXPORT
// ============================================================================

export default {
  fontFamilies,
  fontWeights,
  h1,
  h2,
  h3,
  h4,
  bodyLarge,
  body,
  bodySmall,
  label,
  caption,
  tiny,
  buttonText,
  inputText,
  placeholderText,
  getTypographyForDevice,
};

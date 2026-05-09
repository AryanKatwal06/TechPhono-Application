/**
 * Responsive Design Utilities
 * Provides breakpoints, hooks, and utilities for adaptive layouts across all devices
 */

import { Dimensions, Platform, useWindowDimensions } from 'react-native';

// ============================================================================
// BREAKPOINT SYSTEM
// ============================================================================

/** Device breakpoints in pixels */
export const BREAKPOINTS = {
  xs: 0,        // Extra small (portrait phones)
  sm: 425,      // Small phones (landscape phones)
  md: 768,      // Medium (tablets)
  lg: 1024,     // Large (large tablets)
  xl: 1280,     // Extra large (desktop/web)
} as const;

/** Device type detection */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'web';

/**
 * Get device type based on screen width
 */
export const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  if (width < BREAKPOINTS.xl) return 'tablet';
  return 'web';
};

/**
 * Get device category (useful for styling decisions)
 */
export const getDeviceCategory = (width: number): 'phone' | 'tablet' | 'desktop' => {
  if (width < 768) return 'phone';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// ============================================================================
// RESPONSIVE HOOK - Core hook for all responsive logic
// ============================================================================

export interface ResponsiveConfig {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallScreen: boolean;
  isMediumScreen: boolean;
  isLargeScreen: boolean;
  deviceType: DeviceType;
  deviceCategory: 'phone' | 'tablet' | 'desktop';
  isWeb: boolean;
  isNative: boolean;
  scale: number; // For scaling based on screen size
}

/**
 * Main responsive hook - use this in any component that needs responsive behavior
 * Provides screen dimensions, breakpoint info, and device type detection
 */
export const useResponsive = (): ResponsiveConfig => {
  const { width, height } = useWindowDimensions();
  
  const isPortrait = height >= width;
  const isLandscape = width > height;
  const deviceType = getDeviceType(width);
  const deviceCategory = getDeviceCategory(width);
  const isWeb = Platform.OS === 'web';
  const isNative = Platform.OS !== 'web';
  
  // Calculate scale based on screen width (1 = base 375px phone)
  const baseWidth = 375;
  const scale = width / baseWidth;

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isSmallScreen: width < 600,
    isMediumScreen: width >= 600 && width < 900,
    isLargeScreen: width >= 900,
    deviceType,
    deviceCategory,
    isWeb,
    isNative,
    scale,
  };
};

// ============================================================================
// RESPONSIVE VALUE HOOK - Get different values based on breakpoints
// ============================================================================

/**
 * Get different values based on screen size
 * Useful for responsive properties like font size, padding, etc.
 * 
 * Example:
 * const fontSize = useResponsiveValue({
 *   mobile: 14,
 *   tablet: 16,
 *   desktop: 18,
 * });
 */
export const useResponsiveValue = <T,>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => {
  const { deviceType } = useResponsive();
  
  if (deviceType === 'mobile' && values.mobile !== undefined) return values.mobile;
  if (deviceType === 'tablet' && values.tablet !== undefined) return values.tablet;
  if (deviceType === 'desktop' && values.desktop !== undefined) return values.desktop;
  
  return values.default;
};

// ============================================================================
// RESPONSIVE SPACING HOOK - Adaptive padding and margins
// ============================================================================

export interface ResponsiveSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  horizontalPadding: number;
  verticalPadding: number;
  cardPadding: number;
  inputHeight: number;
  buttonHeight: number;
}

/**
 * Get responsive spacing values based on screen size
 * Returns adapted spacing values for different device types
 */
export const useResponsiveSpacing = (): ResponsiveSpacing => {
  const { width, isTablet, isDesktop, deviceCategory } = useResponsive();
  
  // Base spacing multiplier
  let multiplier = 1;
  if (isTablet) multiplier = 1.2;
  if (isDesktop) multiplier = 1.5;
  
  const baseSpacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  };

  // Adaptive horizontal padding based on screen width
  let horizontalPadding = 16;
  if (width < 375) horizontalPadding = 12;
  if (isTablet) horizontalPadding = 24;
  if (isDesktop) horizontalPadding = 32;

  // Adaptive vertical padding
  let verticalPadding = 12;
  if (isTablet) verticalPadding = 16;
  if (isDesktop) verticalPadding = 20;

  return {
    xs: baseSpacing.xs * multiplier,
    sm: baseSpacing.sm * multiplier,
    md: baseSpacing.md * multiplier,
    lg: baseSpacing.lg * multiplier,
    xl: baseSpacing.xl * multiplier,
    xxl: baseSpacing.xxl * multiplier,
    horizontalPadding,
    verticalPadding,
    cardPadding: 16 * multiplier,
    inputHeight: width < 375 ? 44 : 48,
    buttonHeight: width < 375 ? 44 : 48,
  };
};

// ============================================================================
// RESPONSIVE TYPOGRAPHY HOOK - Adaptive font sizes
// ============================================================================

export interface ResponsiveTypography {
  h1: number;      // 32-40px
  h2: number;      // 28-32px
  h3: number;      // 22-26px
  h4: number;      // 20-24px
  body: number;    // 16px
  bodyLarge: number;
  bodySmall: number;
  caption: number; // 12px
  label: number;   // 14px
  tiny: number;    // 10px
  lineHeightTight: number;
  lineHeightNormal: number;
  lineHeightLoose: number;
}

/**
 * Get responsive font sizes based on screen size
 */
export const useResponsiveTypography = (): ResponsiveTypography => {
  const { width, isTablet, isDesktop } = useResponsive();
  
  // Base font size (rem units)
  let baseScale = 1;
  if (isTablet) baseScale = 1.1;
  if (isDesktop) baseScale = 1.15;

  return {
    h1: Math.round(32 * baseScale),
    h2: Math.round(28 * baseScale),
    h3: Math.round(22 * baseScale),
    h4: Math.round(20 * baseScale),
    body: Math.round(16 * baseScale),
    bodyLarge: Math.round(17 * baseScale),
    bodySmall: Math.round(14 * baseScale),
    caption: Math.round(12 * baseScale),
    label: Math.round(14 * baseScale),
    tiny: Math.round(10 * baseScale),
    lineHeightTight: 1.2,
    lineHeightNormal: 1.5,
    lineHeightLoose: 1.8,
  };
};

// ============================================================================
// RESPONSIVE COMPONENT SIZING
// ============================================================================

export interface ResponsiveComponentSizes {
  iconSm: number;
  iconMd: number;
  iconLg: number;
  iconXl: number;
  buttonIconSize: number;
  tabBarHeight: number;
  headerHeight: number;
  fabSize: number;
  fabMargin: number;
  cardBorderRadius: number;
  modalMaxWidth: number;
}

/**
 * Get responsive component sizes
 */
export const useResponsiveComponentSizes = (): ResponsiveComponentSizes => {
  const { width, height, isMobile, isTablet, isDesktop } = useResponsive();
  
  let tabBarHeight = Platform.OS === 'ios' ? 84 : 70;
  let headerHeight = 56;
  let fabSize = 60;
  let fabMargin = 20;

  if (isTablet) {
    tabBarHeight = Platform.OS === 'ios' ? 92 : 80;
    headerHeight = 64;
    fabSize = 70;
    fabMargin = 24;
  }

  if (isDesktop) {
    tabBarHeight = 88;
    headerHeight = 72;
    fabSize = 80;
    fabMargin = 32;
  }

  return {
    iconSm: 20,
    iconMd: 24,
    iconLg: 32,
    iconXl: 48,
    buttonIconSize: Math.round(24 * (width / 375)),
    tabBarHeight,
    headerHeight,
    fabSize,
    fabMargin,
    cardBorderRadius: Math.max(12, Math.min(16, width / 30)),
    modalMaxWidth: Math.min(width * 0.9, 600),
  };
};

// ============================================================================
// RESPONSIVE GRID UTILITIES
// ============================================================================

/**
 * Calculate responsive number of columns for grid
 */
export const useResponsiveColumns = (): number => {
  const { width, isTablet, isDesktop } = useResponsive();
  
  if (width < 375) return 2;
  if (width < 768) return 2;
  if (isTablet && width < 900) return 3;
  if (isTablet) return 4;
  if (isDesktop && width < 1200) return 4;
  return 5;
};

/**
 * Calculate responsive item width for grid
 */
export const useResponsiveItemWidth = (columns: number, spacing: number): number => {
  const { width } = useResponsive();
  const totalSpacing = spacing * (columns - 1);
  return (width - totalSpacing) / columns;
};

// ============================================================================
// RESPONSIVE UTILITIES (Non-hook versions for static use)
// ============================================================================

/**
 * Get responsive value without a hook (static calculation)
 * Useful in static style definitions
 */
export const getResponsiveValue = <T,>(
  width: number,
  values: { mobile?: T; tablet?: T; desktop?: T; default: T }
): T => {
  const deviceType = getDeviceType(width);
  if (deviceType === 'mobile' && values.mobile !== undefined) return values.mobile;
  if (deviceType === 'tablet' && values.tablet !== undefined) return values.tablet;
  if (deviceType === 'desktop' && values.desktop !== undefined) return values.desktop;
  return values.default;
};

/**
 * Calculate responsive scale based on screen width
 */
export const getResponsiveScale = (width: number): number => {
  const baseWidth = 375; // Base iPhone width
  return width / baseWidth;
};

/**
 * Get number of columns for grid (static)
 */
export const getResponsiveColumns = (width: number): number => {
  if (width < 425) return 2;
  if (width < 768) return 2;
  if (width < 1024) return 3;
  if (width < 1280) return 4;
  return 5;
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Scale a value based on screen width
 */
export const scaleSize = (size: number, scale: number, min: number = 0): number => {
  return clamp(size * scale, Math.max(min, size * 0.8), size * 1.5);
};

// ============================================================================
// SAFE AREA UTILITIES
// ============================================================================

export const getSafeAreaPadding = (): { top: number; bottom: number; left: number; right: number } => {
  // Note: In a real implementation, use react-native-safe-area-context
  // This is a fallback implementation
  const { width, height } = Dimensions.get('window');
  
  return {
    top: Platform.OS === 'ios' ? (height > 800 ? 47 : 20) : 0,
    bottom: Platform.OS === 'ios' ? (height > 800 ? 34 : 0) : 0,
    left: 0,
    right: 0,
  };
};

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export default {
  BREAKPOINTS,
  getDeviceType,
  getDeviceCategory,
  useResponsive,
  useResponsiveValue,
  useResponsiveSpacing,
  useResponsiveTypography,
  useResponsiveComponentSizes,
  useResponsiveColumns,
  useResponsiveItemWidth,
  getResponsiveValue,
  getResponsiveScale,
  getResponsiveColumns,
  clamp,
  scaleSize,
  getSafeAreaPadding,
};

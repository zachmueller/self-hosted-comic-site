/**
 * Responsive Design Breakpoints
 * 
 * Constitutional Compliance:
 * - Artist-First: iPad (768px) is primary artist device
 * - Reader mobile experience adequate but not prioritized
 */

export const BREAKPOINTS = {
  // Mobile phones (portrait)
  MOBILE: 320,
  
  // Tablets and large phones (iPad, landscape phones)
  TABLET: 768,
  
  // Desktop and laptop screens
  DESKTOP: 1024,
  
  // Large desktop screens
  LARGE_DESKTOP: 1440,
} as const;

/**
 * Media query helpers for consistent breakpoint usage
 */
export const MEDIA_QUERIES = {
  // Mobile-first approach: min-width queries
  tablet: `@media (min-width: ${BREAKPOINTS.TABLET}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.DESKTOP}px)`,
  largeDesktop: `@media (min-width: ${BREAKPOINTS.LARGE_DESKTOP}px)`,
  
  // Max-width queries for mobile-specific styles
  mobileOnly: `@media (max-width: ${BREAKPOINTS.TABLET - 1}px)`,
  tabletOnly: `@media (min-width: ${BREAKPOINTS.TABLET}px) and (max-width: ${BREAKPOINTS.DESKTOP - 1}px)`,
  
  // Touch device detection
  touch: '@media (hover: none) and (pointer: coarse)',
  
  // Hover capability detection
  hover: '@media (hover: hover) and (pointer: fine)',
} as const;

/**
 * Touch target minimum sizes for accessibility
 */
export const TOUCH_TARGETS = {
  // Minimum touch target size (WCAG 2.1 Level AAA: 44x44px)
  MIN_SIZE: 44,
  
  // Recommended comfortable touch target
  COMFORTABLE_SIZE: 48,
  
  // Minimum spacing between touch targets
  MIN_SPACING: 8,
} as const;

/**
 * Container max-widths for content readability
 */
export const CONTAINER_WIDTHS = {
  // Narrow content (text-heavy pages)
  NARROW: 720,
  
  // Standard content width
  STANDARD: 900,
  
  // Wide content (grids, galleries)
  WIDE: 1200,
  
  // Full-width content
  FULL: '100%',
} as const;

/**
 * Grid system for responsive layouts
 */
export const GRID = {
  // Grid gaps
  GAP_MOBILE: 16,
  GAP_TABLET: 24,
  GAP_DESKTOP: 32,
  
  // Grid columns
  COLUMNS_MOBILE: 1,
  COLUMNS_TABLET: 2,
  COLUMNS_DESKTOP: 3,
  COLUMNS_LARGE_DESKTOP: 4,
} as const;

/**
 * Typography scale for responsive text
 */
export const TYPOGRAPHY = {
  // Base font size
  BASE_SIZE: 16,
  
  // Mobile heading sizes
  MOBILE_H1: '1.75rem', // 28px
  MOBILE_H2: '1.5rem',  // 24px
  MOBILE_H3: '1.25rem', // 20px
  MOBILE_BODY: '1rem',  // 16px
  MOBILE_SMALL: '0.875rem', // 14px
  
  // Desktop heading sizes
  DESKTOP_H1: '2.5rem', // 40px
  DESKTOP_H2: '2rem',   // 32px
  DESKTOP_H3: '1.5rem', // 24px
  DESKTOP_BODY: '1.125rem', // 18px
  DESKTOP_SMALL: '0.9375rem', // 15px
  
  // Line heights
  LINE_HEIGHT_TIGHT: 1.2,
  LINE_HEIGHT_NORMAL: 1.5,
  LINE_HEIGHT_RELAXED: 1.75,
} as const;

/**
 * Spacing scale for consistent margins and padding
 */
export const SPACING = {
  XS: '0.25rem',  // 4px
  SM: '0.5rem',   // 8px
  MD: '1rem',     // 16px
  LG: '1.5rem',   // 24px
  XL: '2rem',     // 32px
  XXL: '3rem',    // 48px
  XXXL: '4rem',   // 64px
} as const;

/**
 * Z-index layering system
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 100,
  STICKY: 200,
  MODAL_BACKDROP: 300,
  MODAL: 400,
  TOAST: 500,
  TOOLTIP: 600,
} as const;

/**
 * Animation durations for consistent timing
 */
export const TRANSITIONS = {
  FAST: '150ms',
  NORMAL: '250ms',
  SLOW: '350ms',
  SLOWER: '500ms',
} as const;

/**
 * Helper function to check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.TABLET;
}

/**
 * Helper function to check if device is tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.TABLET && window.innerWidth < BREAKPOINTS.DESKTOP;
}

/**
 * Helper function to check if device is desktop
 */
export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.DESKTOP;
}

/**
 * Helper function to check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

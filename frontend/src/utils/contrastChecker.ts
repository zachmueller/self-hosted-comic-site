/**
 * Contrast ratio calculation utilities for WCAG compliance
 * Based on WCAG 2.1 guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 * Formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  // Convert RGB to sRGB
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  // Apply gamma correction
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the relative luminance of the lighter color
 * and L2 is the relative luminance of the darker color
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.1 Contrast ratio thresholds
 */
export const WCAG_THRESHOLDS = {
  AA_NORMAL: 4.5, // Normal text (Level AA)
  AA_LARGE: 3.0,  // Large text (Level AA)
  AAA_NORMAL: 7.0, // Normal text (Level AAA)
  AAA_LARGE: 4.5,  // Large text (Level AAA)
} as const;

/**
 * Check if contrast ratio meets WCAG Level AA for normal text
 */
export function meetsWCAG_AA(ratio: number): boolean {
  return ratio >= WCAG_THRESHOLDS.AA_NORMAL;
}

/**
 * Check if contrast ratio meets WCAG Level AAA for normal text
 */
export function meetsWCAG_AAA(ratio: number): boolean {
  return ratio >= WCAG_THRESHOLDS.AAA_NORMAL;
}

/**
 * Get contrast level description
 */
export function getContrastLevel(ratio: number): 'fail' | 'aa' | 'aaa' {
  if (ratio >= WCAG_THRESHOLDS.AAA_NORMAL) {
    return 'aaa';
  } else if (ratio >= WCAG_THRESHOLDS.AA_NORMAL) {
    return 'aa';
  } else {
    return 'fail';
  }
}

/**
 * Generate suggestions for improving contrast
 */
export function getContrastSuggestion(
  foreground: string,
  background: string,
  ratio: number
): string {
  if (ratio >= WCAG_THRESHOLDS.AA_NORMAL) {
    return 'Contrast is good!';
  }

  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  if (fgLuminance > bgLuminance) {
    // Foreground is lighter
    return 'Try darkening the text color or lightening the background';
  } else {
    // Foreground is darker
    return 'Try lightening the text color or darkening the background';
  }
}

/**
 * Theme management system for color palette configuration
 * Loads configuration from API and applies CSS variables to :root element
 */

import type { SiteConfig } from '../types/config';

/**
 * Default color palette
 * Used as fallback if configuration cannot be loaded
 */
export const defaultColors: SiteConfig['colorPalette'] = {
  primary: '#007bff',
  secondary: '#6c757d',
  highlight: '#ffc107',
  text: '#212529',
  textSecondary: '#6c757d',
};

/**
 * Apply color palette to CSS custom properties
 * @param colors - Color palette to apply
 */
export function applyColorPalette(colors: SiteConfig['colorPalette']): void {
  const root = document.documentElement;
  
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-highlight', colors.highlight);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
}

/**
 * Load site configuration from API
 * @returns Promise resolving to site configuration or default values
 */
export async function loadSiteConfig(): Promise<SiteConfig> {
  try {
    const response = await fetch('/api/config');
    
    if (!response.ok) {
      console.warn('Failed to load site configuration, using defaults');
      return {
        id: 'site-config',
        colorPalette: defaultColors,
        updatedAt: new Date().toISOString(),
      };
    }
    
    const config: SiteConfig = await response.json();
    return config;
  } catch (error) {
    console.error('Error loading site configuration:', error);
    return {
      id: 'site-config',
      colorPalette: defaultColors,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Initialize theme system
 * Loads configuration and applies color palette
 * @returns Promise resolving to loaded configuration
 */
export async function initializeTheme(): Promise<SiteConfig> {
  const config = await loadSiteConfig();
  applyColorPalette(config.colorPalette);
  return config;
}

/**
 * Update color palette and persist to API
 * Requires authentication
 * @param colors - New color palette
 * @param idToken - Cognito ID token for authentication
 * @returns Promise resolving to updated configuration
 */
export async function updateColorPalette(
  colors: SiteConfig['colorPalette'],
  idToken: string
): Promise<SiteConfig> {
  const response = await fetch('/api/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ colorPalette: colors }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update configuration');
  }
  
  const config: SiteConfig = await response.json();
  
  // Apply updated colors immediately
  applyColorPalette(config.colorPalette);
  
  return config;
}

/**
 * Reset color palette to default values
 * @param idToken - Cognito ID token for authentication
 * @returns Promise resolving to updated configuration
 */
export async function resetColorPalette(idToken: string): Promise<SiteConfig> {
  return updateColorPalette(defaultColors, idToken);
}

/**
 * Token Manager - Handles JWT token lifecycle and persistence
 */

import { CognitoTokens, CognitoConfig, refreshAccessToken, isTokenExpired } from './cognito';

const TOKENS_KEY = 'cognito_tokens';
const TOKEN_REFRESH_INTERVAL = 4 * 60 * 1000; // 4 minutes

export class TokenManager {
  private tokens: CognitoTokens | null = null;
  private config: CognitoConfig;
  private refreshTimer: NodeJS.Timeout | null = null;
  private onTokensUpdated?: (tokens: CognitoTokens) => void;
  private onTokensExpired?: () => void;

  constructor(
    config: CognitoConfig,
    onTokensUpdated?: (tokens: CognitoTokens) => void,
    onTokensExpired?: () => void
  ) {
    this.config = config;
    this.onTokensUpdated = onTokensUpdated;
    this.onTokensExpired = onTokensExpired;
  }

  /**
   * Initialize token manager with stored tokens
   */
  public async initialize(): Promise<boolean> {
    try {
      const stored = sessionStorage.getItem(TOKENS_KEY);
      if (!stored) {
        return false;
      }

      const tokens: CognitoTokens = JSON.parse(stored);
      
      // Check if tokens need refresh
      if (isTokenExpired(tokens.expiresAt)) {
        return await this.refreshTokens(tokens.refreshToken);
      }

      this.tokens = tokens;
      this.startRefreshTimer();
      return true;
    } catch (error) {
      console.error('Failed to initialize token manager:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Set new tokens
   */
  public setTokens(tokens: CognitoTokens): void {
    this.tokens = tokens;
    this.saveTokens(tokens);
    this.startRefreshTimer();
    
    if (this.onTokensUpdated) {
      this.onTokensUpdated(tokens);
    }
  }

  /**
   * Get current tokens, refreshing if necessary
   */
  public async getTokens(): Promise<CognitoTokens | null> {
    if (!this.tokens) {
      return null;
    }

    // Check if tokens need refresh
    if (isTokenExpired(this.tokens.expiresAt)) {
      const refreshed = await this.refreshTokens(this.tokens.refreshToken);
      if (!refreshed) {
        return null;
      }
    }

    return this.tokens;
  }

  /**
   * Get ID token (for authentication)
   */
  public async getIdToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.idToken || null;
  }

  /**
   * Get access token (for API calls)
   */
  public async getAccessToken(): Promise<string | null> {
    const tokens = await this.getTokens();
    return tokens?.accessToken || null;
  }

  /**
   * Refresh tokens using refresh token
   */
  private async refreshTokens(refreshToken: string): Promise<boolean> {
    try {
      const newTokens = await refreshAccessToken(refreshToken, this.config);
      this.setTokens(newTokens);
      return true;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      this.handleTokenExpiration();
      return false;
    }
  }

  /**
   * Start automatic token refresh timer
   */
  private startRefreshTimer(): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Set up new timer to refresh tokens periodically
    this.refreshTimer = setInterval(async () => {
      if (this.tokens && isTokenExpired(this.tokens.expiresAt)) {
        await this.refreshTokens(this.tokens.refreshToken);
      }
    }, TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Save tokens to sessionStorage
   */
  private saveTokens(tokens: CognitoTokens): void {
    try {
      sessionStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  /**
   * Clear all tokens
   */
  public clearTokens(): void {
    this.tokens = null;
    sessionStorage.removeItem(TOKENS_KEY);
    
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    this.clearTokens();
    
    if (this.onTokensExpired) {
      this.onTokensExpired();
    }
  }

  /**
   * Check if tokens are currently valid
   */
  public hasValidTokens(): boolean {
    if (!this.tokens) {
      return false;
    }
    
    return !isTokenExpired(this.tokens.expiresAt);
  }

  /**
   * Cleanup when component unmounts
   */
  public cleanup(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

/**
 * Singleton token manager instance
 */
let tokenManagerInstance: TokenManager | null = null;

/**
 * Get or create token manager instance
 */
export function getTokenManager(
  config: CognitoConfig,
  onTokensUpdated?: (tokens: CognitoTokens) => void,
  onTokensExpired?: () => void
): TokenManager {
  if (!tokenManagerInstance) {
    tokenManagerInstance = new TokenManager(config, onTokensUpdated, onTokensExpired);
  }
  return tokenManagerInstance;
}

/**
 * Clear token manager instance
 */
export function clearTokenManager(): void {
  if (tokenManagerInstance) {
    tokenManagerInstance.cleanup();
    tokenManagerInstance = null;
  }
}

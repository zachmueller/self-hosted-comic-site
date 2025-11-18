/**
 * AuthContext - Global authentication state management
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  CognitoConfig,
  CognitoTokens,
  CognitoUser,
  buildLoginUrl,
  buildLogoutUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserFromToken,
  isTokenExpired,
  getAwsCredentials,
} from './cognito';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CognitoUser | null;
  tokens: CognitoTokens | null;
  awsCredentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: Date;
  } | null;
  login: () => void;
  logout: () => void;
  handleCallback: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const TOKENS_KEY = 'cognito_tokens';
const AWS_CREDENTIALS_KEY = 'aws_credentials';

// Get Cognito config from environment variables
const getCognitoConfig = (): CognitoConfig => {
  return {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
    domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
    redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || window.location.origin,
    identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || '',
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [tokens, setTokens] = useState<CognitoTokens | null>(null);
  const [awsCredentials, setAwsCredentials] = useState<{
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: Date;
  } | null>(null);

  const config = getCognitoConfig();

  /**
   * Save tokens to sessionStorage
   */
  const saveTokens = useCallback((newTokens: CognitoTokens) => {
    sessionStorage.setItem(TOKENS_KEY, JSON.stringify(newTokens));
    setTokens(newTokens);
  }, []);

  /**
   * Save AWS credentials to sessionStorage
   */
  const saveAwsCredentials = useCallback((credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration: Date;
  }) => {
    sessionStorage.setItem(AWS_CREDENTIALS_KEY, JSON.stringify({
      ...credentials,
      expiration: credentials.expiration.toISOString(),
    }));
    setAwsCredentials(credentials);
  }, []);

  /**
   * Clear all authentication data
   */
  const clearAuth = useCallback(() => {
    sessionStorage.removeItem(TOKENS_KEY);
    sessionStorage.removeItem(AWS_CREDENTIALS_KEY);
    setIsAuthenticated(false);
    setUser(null);
    setTokens(null);
    setAwsCredentials(null);
  }, []);

  /**
   * Refresh tokens if they're expired
   */
  const ensureValidTokens = useCallback(async () => {
    if (!tokens) return null;

    if (isTokenExpired(tokens.expiresAt)) {
      try {
        const newTokens = await refreshAccessToken(tokens.refreshToken, config);
        saveTokens(newTokens);
        return newTokens;
      } catch (error) {
        console.error('Failed to refresh tokens:', error);
        clearAuth();
        return null;
      }
    }

    return tokens;
  }, [tokens, config, saveTokens, clearAuth]);

  /**
   * Get or refresh AWS credentials
   */
  const ensureValidAwsCredentials = useCallback(async () => {
    const validTokens = await ensureValidTokens();
    if (!validTokens) return null;

    // Check if AWS credentials exist and are still valid
    if (awsCredentials && new Date() < awsCredentials.expiration) {
      return awsCredentials;
    }

    // Get new AWS credentials
    try {
      const credentials = await getAwsCredentials(validTokens.idToken, config);
      saveAwsCredentials(credentials);
      return credentials;
    } catch (error) {
      console.error('Failed to get AWS credentials:', error);
      return null;
    }
  }, [awsCredentials, config, ensureValidTokens, saveAwsCredentials]);

  /**
   * Initialize authentication state from storage
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedTokens = sessionStorage.getItem(TOKENS_KEY);
        if (storedTokens) {
          const parsedTokens: CognitoTokens = JSON.parse(storedTokens);
          
          // Check if tokens are still valid
          if (!isTokenExpired(parsedTokens.expiresAt)) {
            setTokens(parsedTokens);
            const userInfo = getUserFromToken(parsedTokens.idToken);
            setUser(userInfo);
            setIsAuthenticated(true);

            // Load AWS credentials if available
            const storedCredentials = sessionStorage.getItem(AWS_CREDENTIALS_KEY);
            if (storedCredentials) {
              const parsedCreds = JSON.parse(storedCredentials);
              setAwsCredentials({
                ...parsedCreds,
                expiration: new Date(parsedCreds.expiration),
              });
            }
          } else {
            // Try to refresh tokens
            try {
              const newTokens = await refreshAccessToken(parsedTokens.refreshToken, config);
              saveTokens(newTokens);
              const userInfo = getUserFromToken(newTokens.idToken);
              setUser(userInfo);
              setIsAuthenticated(true);
            } catch (error) {
              console.error('Failed to refresh tokens on init:', error);
              clearAuth();
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [config, saveTokens, clearAuth]);

  /**
   * Redirect to Cognito Hosted UI for login
   */
  const login = useCallback(() => {
    const loginUrl = buildLoginUrl(config);
    window.location.href = loginUrl;
  }, [config]);

  /**
   * Handle OAuth callback after successful login
   */
  const handleCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      throw new Error('No authorization code found');
    }

    try {
      // Exchange code for tokens
      const newTokens = await exchangeCodeForTokens(code, config);
      saveTokens(newTokens);

      // Get user info from token
      const userInfo = getUserFromToken(newTokens.idToken);
      setUser(userInfo);
      setIsAuthenticated(true);

      // Get AWS credentials
      const credentials = await getAwsCredentials(newTokens.idToken, config);
      saveAwsCredentials(credentials);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Failed to handle callback:', error);
      throw error;
    }
  }, [config, saveTokens, saveAwsCredentials]);

  /**
   * Logout and clear session
   */
  const logout = useCallback(() => {
    clearAuth();
    const logoutUrl = buildLogoutUrl(config);
    window.location.href = logoutUrl;
  }, [config, clearAuth]);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    tokens,
    awsCredentials,
    login,
    logout,
    handleCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

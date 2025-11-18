/**
 * useRequireAuth - Hook to require authentication for components
 * Use this in components that need authentication but aren't full routes
 */

import { useEffect } from 'react';
import { useAuth } from './useAuth';

interface UseRequireAuthOptions {
  redirectToLogin?: boolean;
  onUnauthenticated?: () => void;
}

/**
 * Hook that ensures the user is authenticated
 * Returns the authentication state and user info
 */
export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { isAuthenticated, isLoading, user, login } = useAuth();
  const { redirectToLogin = true, onUnauthenticated } = options;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (onUnauthenticated) {
        onUnauthenticated();
      } else if (redirectToLogin) {
        login();
      }
    }
  }, [isAuthenticated, isLoading, login, redirectToLogin, onUnauthenticated]);

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
  };
}

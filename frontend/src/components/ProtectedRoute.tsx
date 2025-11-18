/**
 * ProtectedRoute - Wrapper component for routes that require authentication
 * Redirects to login if user is not authenticated
 */

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If not authenticated and not loading, redirect to login
    if (!isLoading && !isAuthenticated) {
      // Save the current location so we can redirect back after login
      sessionStorage.setItem('redirect_after_login', location.pathname + location.search);
      login();
    }
  }, [isAuthenticated, isLoading, login, location]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

/**
 * Get the intended destination after login
 */
export function getRedirectAfterLogin(): string {
  const saved = sessionStorage.getItem('redirect_after_login');
  sessionStorage.removeItem('redirect_after_login');
  return saved || '/';
}

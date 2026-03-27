import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from './common/LoadingSkeleton';

/**
 * PublicRoute Component
 * Wraps routes that should only be accessible to unauthenticated users
 * - If loading: Shows loading skeleton
 * - If authenticated: Redirects to dashboard
 * - If not authenticated: Renders the component
 * 
 * Usage:
 * <Route path="/" element={<PublicRoute component={LandingPage} />} />
 */
export function PublicRoute({ component: Component, ...props }) {
  const { currentUser, loading } = useAuth();

  // Show loading skeleton while checking auth state
  if (loading) {
    return <LoadingSkeleton type="full-page" />;
  }

  // Redirect to dashboard if already authenticated
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render the public component
  return <Component {...props} />;
}

export default PublicRoute;

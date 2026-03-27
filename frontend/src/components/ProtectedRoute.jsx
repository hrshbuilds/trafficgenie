import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from './common/LoadingSkeleton';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * - If loading: Shows loading skeleton
 * - If not authenticated: Redirects to sign-in page
 * - If authenticated: Renders the component
 * 
 * Usage:
 * <Route path="/dashboard" element={<ProtectedRoute component={AdminDashboard} />} />
 */
export function ProtectedRoute({ component: Component, ...props }) {
  const { currentUser, loading } = useAuth();

  // Show loading skeleton while checking auth state
  if (loading) {
    return <LoadingSkeleton type="full-page" />;
  }

  // Redirect to sign-in if not authenticated
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Render the protected component
  return <Component {...props} />;
}

export default ProtectedRoute;

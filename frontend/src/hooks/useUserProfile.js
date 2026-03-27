import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPreferences,
} from '../services/firebaseUserService';

/**
 * Custom hook for managing user profile
 * Fetches and manages user data from Firestore
 */
export function useUserProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile on mount or when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getUserProfile(currentUser.uid);

        if (result.success) {
          setProfile(result.data);
        } else {
          // Profile doesn't exist yet, create default
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'Officer',
            photoURL: currentUser.photoURL || null,
            role: 'officer',
            department: '',
            badge: '',
            phone: '',
            bio: '',
            notifyNewViolations: true,
            notifyHighRiskAreas: true,
            theme: 'dark',
          });
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser]);

  /**
   * Update user profile (name, department, badge, etc.)
   */
  const updateProfile = useCallback(
    async (updates) => {
      if (!currentUser) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        setError(null);

        const result = await updateUserProfile(currentUser.uid, updates);

        if (result.success) {
          setProfile((prev) => ({
            ...prev,
            ...updates,
          }));
          return { success: true };
        } else {
          setError(result.error);
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [currentUser]
  );

  /**
   * Update user preferences (notifications, theme, etc.)
   */
  const updatePreferences = useCallback(
    async (preferences) => {
      if (!currentUser) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        setError(null);

        const result = await updateUserPreferences(currentUser.uid, preferences);

        if (result.success) {
          setProfile((prev) => ({
            ...prev,
            ...preferences,
          }));
          return { success: true };
        } else {
          setError(result.error);
          return { success: false, error: result.error };
        }
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      }
    },
    [currentUser]
  );

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePreferences,
    clearError: () => setError(null),
  };
}

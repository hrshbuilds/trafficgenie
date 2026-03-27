import { useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { useSessionPersistence } from './useSessionPersistence';
import { createUserProfile } from '../services/firebaseUserService';

/**
 * Custom hook for Firebase Authentication
 * Handles real Firebase Auth operations with proper error handling and state management
 * 
 * Return value: {
 *   currentUser: { uid, email, displayName, photoURL },
 *   loading: boolean,
 *   error: string | null,
 *   signIn: (email, password) => Promise<{ success, error? }>,
 *   signUp: (email, password, name) => Promise<{ success, error? }>,
 *   signOut: () => Promise<void>,
 *   updateUserProfile: (name, photoURL) => Promise<void>
 * }
 */
export function useFirebaseAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  
  const { saveSession, restoreSession, clearSession, extendSession } = useSessionPersistence();

  // Listen for auth state changes - persists session across page reloads
  useEffect(() => {
    // Step 1: Try to restore from localStorage first (instant)
    const savedSession = restoreSession();
    if (savedSession) {
      setCurrentUser(savedSession);
      setLoading(false);
    }

    // Safety timeout: If Firebase takes too long, resolve anyway after 5 seconds
    const timeoutId = setTimeout(() => {
      console.warn('Firebase auth timeout - resolving with current state');
      setLoading(false);
      setInitialized(true);
    }, 5000);

    // Step 2: Set up Firebase listener (confirms session is still valid)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      try {
        clearTimeout(timeoutId); // Cancel the timeout since Firebase responded
        if (user) {
          // User is signed in - update from Firebase
          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Officer',
            photoURL: user.photoURL,
          };
          setCurrentUser(userData);
          saveSession(userData); // Update saved session
        } else {
          // User is signed out
          setCurrentUser(null);
          clearSession();
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const signIn = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Officer',
        photoURL: user.photoURL,
      };

      setCurrentUser(userData);
      saveSession(userData); // Persist to localStorage

      return { success: true };
    } catch (err) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      console.error('Sign in error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  /**
   * Sign up with email, password, and name
   * @param {string} email
   * @param {string} password
   * @param {string} name
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const signUp = useCallback(async (email, password, name) => {
    try {
      setError(null);
      setLoading(true);

      // Validate inputs
      if (!email || !password || !name) {
        throw new Error('Email, password, and name are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, {
        displayName: name,
      });

      // Create user profile in Firestore
      await createUserProfile(user, name);

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: user.photoURL,
      };

      setCurrentUser(userData);
      saveSession(userData); // Persist to localStorage

      return { success: true };
    } catch (err) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      console.error('Sign up error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  const signOut = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignOut(auth);
      setCurrentUser(null);
      clearSession(); // Clear persisted session
    } catch (err) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  /**
   * Update user profile (name and/or photo)
   * @param {string} name
   * @param {string} photoURL
   * @returns {Promise<void>}
   */
  const updateUserProfile = useCallback(async (name, photoURL) => {
    try {
      setError(null);

      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }

      const updateData = {};
      if (name) updateData.displayName = name;
      if (photoURL) updateData.photoURL = photoURL;

      await updateProfile(auth.currentUser, updateData);

      setCurrentUser((prev) => ({
        ...prev,
        ...updateData,
      }));
    } catch (err) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      console.error('Update profile error:', err);
      throw err;
    }
  }, []);

  return {
    currentUser,
    loading,
    error,
    initialized,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    clearError: () => setError(null),
    extendSession, // Extend session on user activity
  };
}

/**
 * Map Firebase error codes to user-friendly messages
 * @param {string} code - Firebase error code
 * @returns {string} - User-friendly error message
 */
function mapFirebaseError(code) {
  const errors = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
    'auth/invalid-email': 'Invalid email address. Please check and try again.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/user-not-found': 'No account found with this email. Please sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/user-disabled': 'Your account has been disabled. Please contact support.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
  };

  return errors[code] || 'An error occurred. Please try again.';
}

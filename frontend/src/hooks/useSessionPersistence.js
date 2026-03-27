import { useEffect, useState } from 'react';

/**
 * Custom hook for managing session persistence
 * Stores and restores user session from localStorage
 * 
 * Benefits:
 * - User stays logged in after page reload
 * - Fast session restore without Firebase round-trip
 * - Handles session expiry
 * - Fallback to Firebase if localStorage is corrupted
 */
export function useSessionPersistence() {
  const SESSION_KEY = 'tw_user_session';
  const SESSION_EXPIRY_KEY = 'tw_session_expiry';
  const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Save user session to localStorage
   */
  const saveSession = (user) => {
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      return;
    }

    try {
      const sessionData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_TIMEOUT).toString());
    } catch (err) {
      console.error('Failed to save session:', err);
      // Failed to save to localStorage - not critical, Firebase will restore
    }
  };

  /**
   * Restore user session from localStorage
   * Returns null if session doesn't exist or has expired
   */
  const restoreSession = () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      const expiryTime = localStorage.getItem(SESSION_EXPIRY_KEY);

      if (!sessionData || !expiryTime) {
        return null;
      }

      // Check if session has expired
      if (Date.now() > parseInt(expiryTime)) {
        clearSession();
        return null;
      }

      return JSON.parse(sessionData);
    } catch (err) {
      console.error('Failed to restore session:', err);
      clearSession();
      return null;
    }
  };

  /**
   * Clear user session from localStorage
   */
  const clearSession = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  };

  /**
   * Extend session expiry (called on user activity)
   */
  const extendSession = () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_TIMEOUT).toString());
      }
    } catch (err) {
      console.error('Failed to extend session:', err);
    }
  };

  return {
    saveSession,
    restoreSession,
    clearSession,
    extendSession,
  };
}

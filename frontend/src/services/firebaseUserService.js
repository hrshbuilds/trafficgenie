import { db } from '../firebase/config';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Firestore User Service
 * Manages user profiles and metadata
 */

/**
 * Create or update user profile in Firestore
 * Called after successful sign-up
 */
export async function createUserProfile(user, displayName) {
  try {
    const userRef = doc(db, 'users', user.uid);
    
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName || 'Officer',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // User metadata
      role: 'officer', // Default role
      department: '',
      badge: '',
      phone: '',
      bio: '',
      // Preferences
      notifyNewViolations: true,
      notifyHighRiskAreas: true,
      theme: 'dark',
    }, { merge: true }); // Use merge to avoid overwriting if exists

    return { success: true };
  } catch (err) {
    console.error('Error creating user profile:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(uid, updates) {
  try {
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    console.error('Error updating user profile:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(uid, preferences) {
  try {
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      notifyNewViolations: preferences.notifyNewViolations ?? true,
      notifyHighRiskAreas: preferences.notifyHighRiskAreas ?? true,
      theme: preferences.theme ?? 'dark',
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    console.error('Error updating preferences:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete user profile (admin only)
 */
export async function deleteUserProfile(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    
    // Note: Firestore doesn't have a delete document method from SDK
    // Instead, we mark as deleted
    await updateDoc(userRef, {
      deletedAt: serverTimestamp(),
      status: 'deleted',
    });

    return { success: true };
  } catch (err) {
    console.error('Error deleting user profile:', err);
    return { success: false, error: err.message };
  }
}

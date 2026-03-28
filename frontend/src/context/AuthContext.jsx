import { createContext, useContext, useState, useCallback } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Real Firebase auth
  const firebaseAuth = useFirebaseAuth();
  
  // Toast state
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  }, []);

  // Wrapper for signIn that shows toast
  const signIn = useCallback(async (email, password) => {
    const result = await firebaseAuth.signIn(email, password);
    if (result.success) {
      showToast(`Welcome! You're now signed in. ✓`);
    } else {
      showToast(`Sign in failed: ${result.error}`);
    }
    return result;
  }, [firebaseAuth, showToast]);

  // Wrapper for signUp that shows toast
  const signUp = useCallback(async (email, password, name) => {
    const result = await firebaseAuth.signUp(email, password, name);
    if (result.success) {
      showToast(`Welcome, ${name.split(' ')[0]}! Account created. ✓`);
    } else {
      showToast(`Sign up failed: ${result.error}`);
    }
    return result;
  }, [firebaseAuth, showToast]);

  // Wrapper for signOut that shows toast
  const signOut = useCallback(async () => {
    try {
      await firebaseAuth.signOut();
      showToast('Signed out successfully.');
    } catch (err) {
      showToast(`Sign out failed: ${err.message}`);
    }
  }, [firebaseAuth, showToast]);

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser: import.meta.env.VITE_MOCK_AUTH === 'true' ? { uid: 'local-dev', email: 'admin@trafficgenie.local', displayName: 'Local Admin' } : firebaseAuth.currentUser,
        loading: import.meta.env.VITE_MOCK_AUTH === 'true' ? false : firebaseAuth.loading,
        error: firebaseAuth.error,
        signIn,
        signUp,
        signOut,
        showToast,
        toastMsg,
        toastVisible,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

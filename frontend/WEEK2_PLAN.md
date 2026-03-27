# 🚀 WEEK 2 IMPLEMENTATION PLAN - Authentication & Protection

**Dates**: March 28-April 3, 2026  
**Phase**: Real Firebase Integration + Protected Routes  
**Status**: Ready to Start

---

## 📋 WEEK 2 OBJECTIVES

### Primary Goal
Replace dummy authentication with **real Firebase Auth** and implement **protected routes**.

### Success Criteria
- ✅ Real Firebase sign-in/sign-up working
- ✅ Sessions persist across page reloads
- ✅ Protected routes only accessible when authenticated
- ✅ Unauthorized users redirected to login
- ✅ Real-time user status updates
- ✅ Secure token handling

---

## 📅 DAILY BREAKDOWN

### **Day 1 (March 28): Firebase Auth Setup**
- [ ] Create `useFirebaseAuth()` hook to replace dummy auth
- [ ] Implement real `signInWithEmailAndPassword()`
- [ ] Implement real `createUserWithEmailAndPassword()`
- [ ] Implement `signOut()`
- [ ] Handle Firebase errors properly
- [ ] Create `.env.local` template

**Deliverable**: `useFirebaseAuth` hook ready for integration

---

### **Day 2 (March 29): Session Persistence**
- [ ] Implement `onAuthStateChanged()` listener
- [ ] Store user session in localStorage
- [ ] Auto-detect logged-in users on page reload
- [ ] Add loading state for auth check
- [ ] Handle session expiry

**Deliverable**: Sessions persist across browser reloads

---

### **Day 3 (March 30): Protected Routes**
- [ ] Create `ProtectedRoute` component
- [ ] Create `PublicRoute` component (redirects if logged in)
- [ ] Implement route guards
- [ ] Add 404 page for invalid routes
- [ ] Test all route scenarios

**Deliverable**: Route protection working end-to-end

---

### **Day 4 (March 31): User Management**
- [ ] Display real user profile info
- [ ] Create user profile avatar/badge
- [ ] Implement settings/profile page
- [ ] Add role-based access control (RBAC) foundation
- [ ] Store user metadata in Firestore

**Deliverable**: Full user profile system

---

### **Day 5 (April 2-3): Testing & Polish**
- [ ] Test all auth flows
- [ ] Test protected routes
- [ ] Test session persistence
- [ ] Test error scenarios
- [ ] Clean up console logs
- [ ] Update documentation

**Deliverable**: Everything tested and production-ready

---

## 🏗️ ARCHITECTURE

### Current State
```
AuthContext (dummy auth)
├─ signIn() → checks DUMMY credentials
├─ signUp() → ignores credentials
└─ signOut() → clears local state
```

### Target State
```
useFirebaseAuth() hook
├─ Real signInWithEmailAndPassword()
├─ Real createUserWithEmailAndPassword()
├─ onAuthStateChanged() listener
├─ Session persistence
└─ Error handling

↓ ↓ ↓

Protected Routes
├─ ProtectedRoute (logged-in only)
├─ PublicRoute (anonymous only)
└─ Route guards
```

---

## 📦 NEW FILES TO CREATE

### 1. `useFirebaseAuth` Hook
**File**: `/src/hooks/useFirebaseAuth.js`
```javascript
export function useFirebaseAuth() {
  return {
    currentUser,
    loading,
    error,
    signIn(email, password),      // Real Firebase
    signUp(email, password, name), // Real Firebase
    signOut(),                     // Real Firebase
    updateProfile(name, photo)
  }
}
```

### 2. Protected Route Component
**File**: `/src/components/ProtectedRoute.jsx`
```javascript
export function ProtectedRoute({ component: Component, ...rest }) {
  const { currentUser, loading } = useFirebaseAuth();
  
  if (loading) return <LoadingScreen />;
  if (!currentUser) return <Navigate to="/signin" />;
  
  return <Component {...rest} />;
}
```

### 3. Public Route Component
**File**: `/src/components/PublicRoute.jsx`
```javascript
export function PublicRoute({ component: Component, ...rest }) {
  const { currentUser, loading } = useFirebaseAuth();
  
  if (loading) return <LoadingScreen />;
  if (currentUser) return <Navigate to="/dashboard" />;
  
  return <Component {...rest} />;
}
```

### 4. Updated Auth Context
**File**: `/src/context/AuthContext.jsx` (MODIFIED)
```javascript
export function AuthProvider({ children }) {
  const { currentUser, loading, signIn, signUp, signOut } = useFirebaseAuth();
  
  return (
    <AuthContext.Provider value={{ currentUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 5. Sign In Modal (Updated)
**File**: `/src/components/modals/SignInModal.jsx` (MODIFIED)
- Replace dummy validation with real Firebase
- Handle real error responses
- Show loading states

### 6. Sign Up Modal (Updated)
**File**: `/src/components/modals/SignUpModal.jsx` (MODIFIED)
- Create real Firebase accounts
- Validate input
- Handle errors

### 7. Environment Template
**File**: `/.env.local.example`
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender_id
VITE_FIREBASE_APP_ID=app_id
VITE_FIREBASE_MEASUREMENT_ID=measurement_id
```

---

## 🔑 KEY CHANGES

### AuthContext.jsx
```javascript
// BEFORE (Week 1)
const DUMMY = { email: 'officer@trafficwatch.in', password: 'TW@2026' };
const signIn = (email, password) => {
  if (email === DUMMY.email && password === DUMMY.password) {
    // Set local state
  }
};

// AFTER (Week 2)
const { currentUser, signIn, loading } = useFirebaseAuth();
// Real Firebase Auth - auto-persists, real validation, etc.
```

### App.jsx (Protected Routes)
```javascript
// BEFORE
<Route path="/dashboard" element={<AdminDashboard />} />

// AFTER
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute 
      component={AdminDashboard}
    />
  } 
/>
```

---

## 🔄 IMPLEMENTATION STRATEGY

### Phase 1: Hook Creation (Day 1)
1. Create `useFirebaseAuth()` hook
2. Implement all Firebase auth methods
3. Test with actual Firebase project
4. Handle errors gracefully

### Phase 2: Context Integration (Day 2)
1. Update `AuthContext` to use hook
2. Add session persistence check
3. Update sign-in/sign-up modals
4. Test persistence across page reloads

### Phase 3: Route Protection (Day 3)
1. Create `ProtectedRoute` component
2. Create `PublicRoute` component
3. Update routing in `App.jsx`
4. Test all route scenarios

### Phase 4: User Management (Day 4)
1. Fetch user profile data
2. Display user info in navbar
3. Add user settings page
4. Store user metadata

### Phase 5: Testing & Cleanup (Day 5)
1. Test all flows end-to-end
2. Test error scenarios
3. Remove old dummy code
4. Document setup process

---

## 🧪 TEST SCENARIOS

### Auth Flow Tests
- [ ] Sign up with new email → Account created ✓
- [ ] Sign up with existing email → Error shown
- [ ] Sign in with correct credentials → Logged in ✓
- [ ] Sign in with wrong password → Error shown
- [ ] Sign out → Logged out, redirected
- [ ] Page reload with valid session → Still logged in ✓
- [ ] Page reload without session → Logged out ✓

### Route Protection Tests
- [ ] Anonymous user accesses `/dashboard` → Redirected to `/signin`
- [ ] Logged-in user accesses `/signin` → Redirected to `/dashboard`
- [ ] Logged-in user accesses `/dashboard` → Loaded ✓
- [ ] Invalid route → 404 page shown
- [ ] Navigate between protected routes → Works smoothly ✓

### Error Handling Tests
- [ ] Firebase down → Graceful error message
- [ ] Network error → Retry mechanism
- [ ] Invalid credentials → User-friendly error
- [ ] Session expired → Prompt to re-login

---

## 📊 SETUP REQUIREMENTS

### Firebase Project
- ✅ Project exists: `trafficvision-9eb7f`
- Need to configure:
  - [ ] Enable Email/Password Authentication
  - [ ] Add Firestore database
  - [ ] Create Firestore rules
  - [ ] Generate API key (in `.env.local`)

### Environment Variables
```bash
# Copy template
cp .env.local.example .env.local

# Add your Firebase credentials to .env.local
VITE_FIREBASE_API_KEY=... (from Firebase Console)
```

### Dependencies
- ✅ `firebase` - Already installed
- ✅ `react-router-dom` - Already installed

---

## 🚨 KNOWN ISSUES TO HANDLE

### Issue 1: Session Loss on Reload
**Current**: User logged out on page refresh  
**Solution**: Use `onAuthStateChanged()` + localStorage  
**Implementation**: Day 2

### Issue 2: Security (Hardcoded Credentials)
**Current**: Dummy credentials in source code  
**Solution**: Remove entirely, use Firebase only  
**Implementation**: Day 1

### Issue 3: Route Protection
**Current**: No protection, anyone can access dashboard  
**Solution**: ProtectedRoute wrapper  
**Implementation**: Day 3

### Issue 4: No User Data
**Current**: Only email/name stored, no roles  
**Solution**: Store in Firestore with roles  
**Implementation**: Day 4

---

## ✅ SUCCESS METRICS

By end of Week 2:
- [ ] 0 hardcoded credentials in code
- [ ] 100% of routes protected/guarded
- [ ] Sessions persist through page reloads
- [ ] All auth flows tested
- [ ] Firebase integration complete
- [ ] 0 console errors in auth flow
- [ ] Documentation updated

---

## 📚 RESOURCES

### Firebase Documentation
- [Email/Password Auth](https://firebase.google.com/docs/auth/web/password-auth)
- [Session Persistence](https://firebase.google.com/docs/auth/web/manage-users)
- [Error Handling](https://firebase.google.com/docs/auth/web/handle-errors)

### React Router v7
- [Protected Routes Pattern](https://reactrouter.com/en/main/start/overview)
- [Route Guards](https://reactrouter.com/en/main/guides/auth-patterns)

---

## 🎯 READY TO START?

**Prerequisites Check:**
- ✅ Week 1 refactoring complete (services, hooks, components)
- ✅ Firebase project created
- ✅ Environment variables configured
- ✅ Dev server running
- ✅ All dependencies installed

**Next Action**: Implement `useFirebaseAuth()` hook (Day 1)

---

## 📝 NOTES

- Keep old AuthContext as fallback until new one is fully tested
- Never commit `.env.local` (add to .gitignore)
- Test in development before pushing to staging
- Brief team on new authentication flow

---

**Team**: Ready for Week 2! 🚀


# 🧪 Local Testing & Quality Assurance Checklist

## Build Status ✅

```
✅ Dependencies: Installed
✅ Dev Server: Running on http://localhost:5173
✅ Build: Successful (814KB uncompressed, 248KB gzipped)
✅ Linting: 9 warnings (non-critical JSX-in-try-catch)
✅ Bundle: Within acceptable limits
```

---

## 🚀 How to Test Locally

### 1. Start Dev Server (Already Running)
```bash
cd frontend
npm run dev
# Opens http://localhost:5173
```

### 2. View in Browser
```bash
# Incodespace, port 5173 should be accessible
# Or forward port manually:
gh codespace ports visibility 5173:public
```

### 3. Open DevTools for Testing
- **Chrome/EdgeDevTools**: Press `F12`
- **Mobile Testing**: Press `Ctrl+Shift+M`
- **Network Throttling**: DevTools → Network → Slow 3G

---

## ✅ Testing Checklist

### **SECTION 1: Authentication** 🔐

#### Test 1.1: Firebase Auth Connection
- [ ] Open app in browser
- [ ] Check console for Firebase initialization
- [ ] Should see: "Firebase initialized"
- [ ] No red errors in console

#### Test 1.2: Sign In Page Loads
- [ ] Navigate to signin page
- [ ] Email & password inputs present
- [ ] "Sign In" button visible
- [ ] No console errors

#### Test 1.3: Sign In Works
- [ ] Enter test email: `test@example.com`
- [ ] Enter password: `password123`
- [ ] Click "Sign In"
- [ ] Should redirect to dashboard (or show error if user doesn't exist in Firebase)
- [ ] Check console for auth response

#### Test 1.4: Sign Out Works
- [ ] Click "Sign Out" button
- [ ] Should redirect to home page
- [ ] Auth context clears

---

### **SECTION 2: Real-Time Data Streaming** 📡

#### Test 2.1: Firestore Listeners Active
- [ ] Open AdminDashboard
- [ ] Check browser console
- [ ] Should see: "Subscribing to violations..."
- [ ] Should see: "Subscribing to agent logs..."
- [ ] No console errors

#### Test 2.2: Live Indicator Shows
- [ ] Look at top right of dashboard
- [ ] Green pulsing "LIVE" indicator visible
- [ ] Should pulse continuously

#### Test 2.3: Mock Real-Time Update
- [ ] Open Firebase Console in another tab
- [ ] Add test violation to `violations` collection:
  ```json
  {
    "type": "Test Violation",
    "loc": "Test Location",
    "conf": 95,
    "risk": 80,
    "status": "urgent",
    "icon": "🚦",
    "plate": "TEST-001",
    "timestamp": "2026-03-27T20:30:00Z"
  }
  ```
- [ ] **Dashboard should update instantly** (no refresh needed)
- [ ] New violation appears in list

#### Test 2.4: New Violation Toast
- [ ] Add another violation to Firestore
- [ ] **Green toast should pop up** at bottom-right
- [ ] Shows violation type and location
- [ ] Auto-dismisses after 5 seconds
- [ ] Can click X to close manually

#### Test 2.5: Stats Update Live
- [ ] Watch dashboard stats section
- [ ] When new violations added, numbers update instantly
- [ ] No page refresh required

---

### **SECTION 3: AI Insights** 🤖

#### Test 3.1: AI Component Loads
- [ ] Scroll down on dashboard
- [ ] Look for "🤖 AI Traffic Analysis" section
- [ ] See "✨ Get Insights" button

#### Test 3.2: Request Insights
- [ ] Click "✨ Get Insights" button
- [ ] Button changes to "🔄 Analyzing..."
- [ ] Wait 2-3 seconds for backend response

#### Test 3.3: Insights Display
- [ ] Analysis should appear in green box below button
- [ ] Shows formatted text with patterns and recommendations
- [ ] Can click "Clear" to dismiss

#### Test 3.4: Error Handling
- [ ] If backend not running, should show error message
- [ ] Error state has red background
- [ ] Can click X to dismiss error

---

### **SECTION 4: Risk Visualization** 📊

#### Test 4.1: Risk Badges Display
- [ ] Look at violation cards in list
- [ ] Each card shows risk badge (🔴🟠🟡🟢)
- [ ] Color matches risk level:
  - 🔴 = Red for 75%+ (Critical)
  - 🟠 = Orange for 50-75% (High)
  - 🟡 = Yellow for 25-50% (Medium)
  - 🟢 = Green for <25% (Low)

#### Test 4.2: Risk Badge Hovering
- [ ] Hover over risk badge
- [ ] Should show subtle highlight/shadow
- [ ] No breaking visual issues

#### Test 4.3: Risk Colors Correct
- [ ] Check multiple violations with different risks
- [ ] Confirm colors match risk levels
- [ ] Should see variety of badge colors

---

### **SECTION 5: Mobile Responsiveness** 📱

#### Test 5.1: Responsive Breakpoints
Open DevTools (F12) → Responsive Design Mode

**Test at these sizes:**
- [ ] 1920x1080 (Desktop)
- [ ] 1024x768 (Tablet)
- [ ] 768x1024 (Tablet Portrait)
- [ ] 480x854 (Mobile)
- [ ] 390x844 (iPhone 12)

#### Test 5.2: Top Bar Responsive
- [ ] Desktop: All stats visible horizontally
- [ ] Tablet: Stats wrap if needed
- [ ] Mobile: Stats stack or hide overflow
- [ ] Logo still visible
- [ ] Time visible
- [ ] No overlapping text

#### Test 5.3: Filter Bar Responsive
- [ ] Desktop: All filters in row
- [ ] Tablet: Some wrap
- [ ] Mobile: Single column or wrap
- [ ] All filters still accessible

#### Test 5.4: Sidebar Responsive
- [ ] Desktop: Sidebar on left
- [ ] Tablet: Sidebar might collapse
- [ ] Mobile: Sidebar converts to menu
- [ ] Navigation items still accessible

#### Test 5.5: Video Player Responsive
- [ ] Desktop: Full width
- [ ] Tablet: Constrained width
- [ ] Mobile: Full width, shorter height
- [ ] Maintains aspect ratio

#### Test 5.6: Touch Friendly
- [ ] Buttons should be at least 44x44px
- [ ] Tap buttons - should respond immediately
- [ ] No accidental double-clicks

#### Test 5.7: Orientation Change
- [ ] Rotate device/window
- [ ] Layout adapts smoothly
- [ ] No content cut off

---

### **SECTION 6: Performance** ⚡

#### Test 6.1: Page Load Speed
- [ ] Open DevTools → Network tab
- [ ] Reload page
- [ ] Check load times:
  - [ ] DOMContentLoaded < 1.5s ✅
  - [ ] Load complete < 3s ✅

#### Test 6.2: Runtime Performance
- [ ] DevTools → Performance tab
- [ ] Scroll through violations list
- [ ] No frame drops (should see green bars)
- [ ] Smooth 60 FPS

#### Test 6.3: Slow Network Simulation
- [ ] DevTools → Network → Throttle to "Slow 3G"
- [ ] Reload page
- [ ] App should load (slower but working)
- [ ] Loading states should show
- [ ] No timeout errors

#### Test 6.4: Bundle Size
- [ ] Should see build output:
  ```
  dist/assets/index-*.js   ~800KB (uncompressed)
                          ~250KB (gzipped) ✅
  dist/assets/index-*.css  ~51KB (uncompressed)
                          ~11KB (gzipped) ✅
  ```

#### Test 6.5: Memory Usage
- [ ] Open DevTools → Memory tab
- [ ] Scroll for 30 seconds
- [ ] Memory should stay relatively stable
- [ ] No continuous growth (memory leak indicator)

---

### **SECTION 7: Error Handling** ⚠️

#### Test 7.1: Backend Offline
- [ ] Stop backend server (if running)
- [ ] Reload frontend
- [ ] Should handle gracefully (no crash)
- [ ] Show error message or fallback

#### Test 7.2: Firestore Offline
- [ ] DevTools → Network → Offline
- [ ] Try to interact
- [ ] Should show "Offline" or error
- [ ] App doesn't crash

#### Test 7.3: Invalid Route
- [ ] Go to: http://localhost:5173/invalid-page
- [ ] Should show 404 or error page
- [ ] Not a blank screen or console error

#### Test 7.4: Console Errors
- [ ] DevTools → Console tab
- [ ] Should be mostly clean
- [ ] No red errors (warnings are OK)
- [ ] Check for memory leaks (continuous errors)

---

### **SECTION 8: Browser Compatibility** 🌐

Test in each browser:

#### Chrome/Chromium
- [ ] All features work
- [ ] Performance good
- [ ] Styling correct

#### Firefox
- [ ] All features work
- [ ] Performance acceptable
- [ ] Styling correct

#### Safari
- [ ] All features work (if testing on Mac)
- [ ] Check for any webkit-specific issues

#### Mobile Browsers
- [ ] Chrome Mobile: ✅
- [ ] Safari Mobile: (if Mac available)
- [ ] Firefox Mobile: ✅

---

### **SECTION 9: Features Comprehensive Test** 🎯

#### Test 9.1: Violation List
- [ ] Can scroll list smoothly
- [ ] Each violation shows: icon, type, location, plate, status
- [ ] Risk badge displays correctly
- [ ] Confidence score visible

#### Test 9.2: Click on Violation
- [ ] Click a violation card
- [ ] Should select it (highlight or modal)
- [ ] Details display

#### Test 9.3: Filter Violations
- [ ] Use Ward filter
- [ ] List updates (only matching violations)
- [ ] Switch filter on/off
- [ ] Shows "Filtered" badge

#### Test 9.4: Clear Filters
- [ ] Apply multiple filters
- [ ] Click "Clear Filters"
- [ ] All filters reset
- [ ] Full list shows again

#### Test 9.5: Real-Time Simulation
- [ ] Add violation in Firestore
- [ ] Dashboard updates live
- [ ] Toast shows
- [ ] Stats update
- [ ] No manual refresh needed

---

## 🔍 What to Check in Console

Open DevTools (F12) and check the Console tab:

### ✅ Good Signs
```
✅ Firebase initialized
✅ Subscribing to violations...
✅ Violations listener active
✅ Auth state changed: user logged in
✅ Real-time stats calculated
```

### ⚠️ Warning Signs (Check These)
```
⚠️ Deprecated API used (non-blocking)
⚠️ Unused CSS (doesn't affect functionality)
⚠️ JSX in try/catch (code quality, works fine)
```

### 🚨 Error Signs (STOP - Fix These)
```
🚨 Cannot read property of undefined
🚨 fetch failed (backend issue)
🚨 Firebase auth error (config issue)
🚨 Maximum call stack exceeded (infinite loop)
```

---

## 📊 Lighthouse Audit

### Run Audit
1. DevTools → Lighthouse tab
2. Click "Analyze page load"
3. Wait 30 seconds

### Target Scores
- Performance: **90+** ✅
- Accessibility: **90+** ✅
- Best Practices: **90+** ✅
- SEO: **90+** ✅

### What to Fix if Below Target
- [ ] Defer non-critical JavaScript
- [ ] Lazy load images
- [ ] Optimize CSS
- [ ] Reduce main thread work

---

## 📝 Test Results Template

Copy this template and fill out when testing:

```
DATE: 2026-03-27
TESTER: [Name]
BROWSER: Chrome 120
SCREEN SIZE: 1920x1080
BACKEND: Running

AUTHENTICATION: ✅ Pass / ❌ Fail
- Sign in works
- Sign out works
- Sessions persist

REAL-TIME: ✅ Pass / ❌ Fail
- Firestore listeners active
- Live updates appear
- Toast alerts show
- Stats update live

AI INSIGHTS: ✅ Pass / ❌ Fail
- Component loads
- Analysis generates
- Results display
- Errors handled

RISK VISUALIZATION: ✅ Pass / ❌ Fail
- Badges show
- Colors correct
- Hover effects work

MOBILE: ✅ Pass / ❌ Fail
- Responsive at 480px
- Touch-friendly
- All features accessible

PERFORMANCE: ✅ Pass / ❌ Fail
- Page load < 1.5s
- No frame drops
- Smooth scrolling
- Bundle size OK

COMPATIBILITY: ✅ Pass / ❌ Fail
- Chrome: Works
- Firefox: Works
- Mobile: Works

BUGS FOUND:
1. [Description]
2. [Description]

RECOMMENDATIONS:
1. [Suggestion]
2. [Suggestion]
```

---

## 🚨 Critical Issues to Report

If you find these, report immediately:

1. **Blank Screen** - App won't load
2. **Auth Broken** - Can't sign in/out
3. **Real-Time Not Working** - Dashboard doesn't update
4. **Console Errors** - Red errors that break functionality
5. **Performance** - Extremely slow or unresponsive
6. **Major Layout Break** - At any screen size

---

## ✅ Sign-Off Checklist

Before moving to deployment, verify:

- [ ] Dev server runs without errors
- [ ] Build completes successfully
- [ ] No critical console errors
- [ ] Mobile responsive at all breakpoints
- [ ] Real-time features working
- [ ] AI insights functional
- [ ] Performance acceptable (< 1.5s load)
- [ ] All 4 weeks of features working
- [ ] No crashes or infinite loops
- [ ] Error handling graceful

---

## Next Steps

Once all tests pass:

1. ✅ **Complete**: Local testing done
2. ➡️ **Next**: Deploy to staging/production
3. ➡️ **Then**: Monitor in production
4. ➡️ **Finally**: Gather user feedback

---

**Status**: 🟢 Ready for Testing

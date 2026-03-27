# TrafficVision - Quick Start Local Testing

## 🎯 Current Status

✅ **All systems ready for local testing!**

- Dev environment: Configured and verified
- Dependencies: Installed (React 19, Firebase 12, Vite 8)
- Backend: Running on http://localhost:8000
- Frontend: Ready to start on http://localhost:5173

---

## 🚀 Start Local Development

### Step 1: Start the Frontend Dev Server

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v8.0.3 ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 2: Access the Application

**Option A: Direct Access (in Codespace)**
- Visual Studio Code will show port forwarding notification
- Click "Open in Browser" or manually open: http://localhost:5173

**Option B: From Terminal**
```bash
# Open in default browser
echo "Opening http://localhost:5173..."
```

### Step 3: Verify Firebase Connection

Check browser console (F12) for:
- ✅ Firebase initialization message
- ✅ Real-time listener connected
- ✅ No red error messages

---

## 📋 Testing Checklist

Follow [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md) for comprehensive testing.

### Quick Smoke Tests (5 minutes)

1. **Authentication** (30 seconds)
   - Sign in with test account
   - Verify dashboard loads

2. **Real-Time Data** (1 minute)
   - Check if violations load
   - Verify live indicator shows green/pulsing

3. **AI Insights** (1 minute)
   - Click "✨ Get Insights" button
   - Verify text response appears

4. **Mobile Responsive** (1.5 minutes)
   - Press F12 to open DevTools
   - Click device toolbar icon
   - Test at 480px, 768px, 1024px breakpoints

5. **Build & Performance** (1 minute)
   - Run: `npm run build`
   - Verify: Output < 1MB JS (currently 248KB gzipped)
   - Run: `npm run lint` (acceptable: 9 non-critical warnings)

---

## 🔧 Common Issues & Solutions

### Issue: Port 5173 already in use
```bash
# Kill existing process
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Then restart
npm run dev
```

### Issue: Firebase credentials not loading
```bash
# Verify .env.local exists and has VITE_FIREBASE_API_KEY
cat frontend/.env.local | grep "VITE_FIREBASE"

# Should show something like:
# VITE_FIREBASE_API_KEY=AIzaSyD...
```

### Issue: Backend API errors
```bash
# Verify backend is running on port 8000
curl http://localhost:8000/api/health

# Expected response: 200 OK with health status
```

### Issue: Real-time updates not showing
1. Check browser console for errors (F12)
2. Verify Firebase project ID matches: `trafficvision-9eb7f`
3. Check Firestore permissions/authentication
4. Try refreshing the page

### Issue: Build fails with memory error
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build
```

---

## 📊 Performance Baselines

### Build Output
- **JavaScript**: 814.90 KB → 248.35 KB (gzipped)
- **CSS**: 51.39 KB → 10.69 KB (gzipped)
- **Build Time**: ~412ms
- **Dev Server Start**: ~220ms

### Expected Performance Scores (Lighthouse)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

### Runtime Performance
- First Contentful Paint (FCP): < 800ms
- Largest Contentful Paint (LCP): < 1.5s
- Cumulative Layout Shift (CLS): < 0.1
- Frame Rate: 60 FPS for scrolling/animations

---

## 🔍 Debugging Tools

### Check App Status
```bash
# Verify npm scripts available
npm run

# Output should show:
# dev          - Start dev server
# build        - Build for production
# lint         - Run ESLint
# preview      - Preview production build
```

### Browser DevTools (F12)

**Console Tab:**
- Check for Firebase connection messages
- Look for any red errors
- Verify API calls in Network tab

**Network Tab:**
- Monitor API requests to /api/analyze
- Check real-time Firestore listener connections
- Verify Firebase authentication tokens

**Application Tab:**
- Check Local Storage for auth tokens
- Verify IndexedDB Firestore cache

**Performance Tab:**
- Record performance trace
- Check for long tasks or jank
- Verify smooth animations (60 FPS)

---

## 📱 Testing Across Devices

### Mobile Simulation (DevTools)
```
F12 → Device Toolbar → Select device
```

**Test at breakpoints:**
- 480px (Mobile)
- 768px (Tablet)
- 1024px (Laptop)
- 1920px (Desktop)

### Responsive Design Features Verified ✅
- Navigation responsive menu
- Dashboard grid adapts to screen size
- Violation cards stack on mobile
- Charts resize correctly
- Buttons minimumTouch size: 44px

---

## 🎬 Next Steps After Testing

### 1. Complete All Test Sections
Follow [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md):
- [ ] Section 1: Authentication
- [ ] Section 2: Real-Time Violations
- [ ] Section 3: AI Insights Integration
- [ ] Section 4: Risk Visualization
- [ ] Section 5: Mobile Responsiveness
- [ ] Section 6: Performance Metrics
- [ ] Section 7: Error Handling
- [ ] Section 8: Browser Compatibility
- [ ] Section 9: Complete Feature Test

### 2. Document Any Issues
Create a file: `LOCAL_TEST_RESULTS.md` with:
- Issues found and how to reproduce them
- Fixes applied
- Any blockers for production

### 3. Deploy to Production
Once all tests pass:
```bash
# Build for production
npm run build

# Deploy (choose your platform)
npm install -g vercel        # For Vercel
vercel deploy --prod        # Deploy to Vercel

# OR
npm install -g netlify-cli   # For Netlify
netlify deploy --prod       # Deploy to Netlify
```

---

## 📚 Documentation

- **[LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md)** - Comprehensive testing checklist
- **[WEEK3_REALTIME_COMPLETE.md](./WEEK3_REALTIME_COMPLETE.md)** - Real-time architecture
- **[WEEK4_HACKATHON_COMPLETE.md](./WEEK4_HACKATHON_COMPLETE.md)** - Hackathon features
- **[4WEEK_TRANSFORMATION_COMPLETE.md](./4WEEK_TRANSFORMATION_COMPLETE.md)** - Full overview

---

## ✅ Ready to Test?

Run this to verify everything is configured:

```bash
cd frontend && npm run dev
```

Then visit: **http://localhost:5173**

The application should load with:
- ✅ Your dashboard visible
- ✅ Real-time data loading
- ✅ Live indicator pulsing green
- ✅ Ready for testing!

**Questions?** See [LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md) for detailed test scenarios.

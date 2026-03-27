# 🔧 DATA LAYER REFACTORING GUIDE

**Step-by-step instructions to replace hardcoded data with real API calls**

---

## STEP 1: Create Service Layer

### Step 1.1: Create violation service

**File**: `src/services/api/violationApi.js`

```javascript
import { apiFetch } from '../api.js';

/**
 * Fetch all violations with optional filters
 * @param {Object} options - Filter options
 * @param {string} options.ward - Filter by ward name
 * @param {string} options.type - Filter by violation type
 * @param {string} options.status - Filter by status (active, resolved, etc)
 * @param {number} options.limit - Max records to fetch (default 50)
 * @returns {Promise<Array>} Normalized violations
 */
export async function fetchViolations(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.ward) params.append('ward', options.ward);
    if (options.type) params.append('type', options.type);
    if (options.status) params.append('status', options.status);
    if (options.limit) params.append('limit', options.limit);
    
    const queryString = params.toString();
    const url = queryString ? `/violations?${queryString}` : '/violations';
    
    const data = await apiFetch(url);
    return normalizeViolations(data.results || data);
  } catch (error) {
    console.error('Failed to fetch violations:', error);
    throw error;
  }
}

/**
 * Fetch a single violation by ID
 */
export async function fetchViolationById(id) {
  const data = await apiFetch(`/violations/${id}`);
  return normalizeViolation(data);
}

/**
 * Fetch recent violations (for live feed)
 */
export async function fetchRecentViolations(limit = 10) {
  return fetchViolations({ limit, status: 'active' });
}

/**
 * Create a challan for a violation
 */
export async function createChallan(violationId, details = {}) {
  const data = await apiFetch(`/violations/${violationId}/challan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details)
  });
  return data;
}

/**
 * Normalize API response to match UI expectations
 */
function normalizeViolation(raw) {
  return {
    id: raw.id || raw._id,
    type: raw.violation_type || raw.type,
    type_hi: getHindiName(raw.type),
    icon: getViolationIcon(raw.type),
    status: raw.status || 'active',
    conf: Math.round(raw.confidence || raw.conf * 100),
    loc: raw.location || raw.loc,
    ward: raw.ward_name || raw.ward,
    cam: raw.camera_id || raw.cam,
    plate: raw.plate_number || raw.plate,
    risk: raw.risk_score || calculateRisk(raw),
    narration: raw.description || raw.narration,
    time: formatTime(raw.timestamp || raw.time),
    timestamp: new Date(raw.timestamp || raw.time),
    image: raw.image_url || raw.image,
    confidence: raw.confidence || raw.conf,
  };
}

function normalizeViolations(data) {
  return Array.isArray(data) ? data.map(normalizeViolation) : [];
}

// Helper function: Map violation type to icon
function getViolationIcon(type) {
  const typeStr = (type || '').toLowerCase();
  const icons = {
    'no_helmet': '🪖',
    'helmet': '🪖',
    'red_light': '🚦',
    'signal_jump': '🚦',
    'red': '🚦',
    'triple_riding': '🏍️',
    'triple': '🏍️',
    'wrong_side': '⛔',
    'wrong_direction': '⛔',
    'wrong_lane': '⛔',
    'speed_breach': '⚡',
    'speed': '⚡',
    'zebra_cross': '🦺',
    'zebra': '🦺',
  };
  return icons[typeStr] || '📷';
}

// Helper: Get Hindi name
function getHindiName(type) {
  const namesHi = {
    no_helmet: 'बिना हेलमेट',
    signal_jump: 'लाल बत्ती',
    triple_riding: 'तीन सवारी',
    wrong_side: 'गलत दिशा',
    speed: 'गति उल्लंघन',
    zebra_cross: 'ज़ेब्रा क्रॉसिंग',
  };
  return namesHi[(type || '').toLowerCase()] || type;
}

// Helper: Format time
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour12: false });
}

// Helper: Calculate risk score
function calculateRisk(violation) {
  const { confidence = 0, severity = 'medium' } = violation;
  const baseScore = Math.round(confidence);
  const severityMultiplier = severity === 'high' ? 1.2 : severity === 'low' ? 0.7 : 1;
  return Math.min(Math.round(baseScore * severityMultiplier), 100);
}

export default {
  fetchViolations,
  fetchViolationById,
  fetchRecentViolations,
  createChallan,
};
```

### Step 1.2: Create analytics service

**File**: `src/services/api/analyticsApi.js`

```javascript
import { apiFetch } from '../api.js';

/**
 * Fetch analytics dashboard data
 */
export async function fetchAnalytics(timeframe = 'week') {
  try {
    const data = await apiFetch(`/analytics?timeframe=${timeframe}`);
    return normalizeAnalytics(data);
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    throw error;
  }
}

/**
 * Fetch ward-level statistics
 */
export async function fetchWardStats() {
  const data = await apiFetch('/analytics/wards');
  return (data.wards || []).map(w => ({
    rank: w.rank,
    name: w.name,
    total: w.total_violations,
    helmet: w.helmet_violations,
    signal: w.signal_violations,
    triple: w.triple_violations,
    lane: w.lane_violations,
    severity: w.average_severity || Math.round(Math.random() * 100),
  }));
}

/**
 * Fetch camera status
 */
export async function fetchCameraStatus() {
  const data = await apiFetch('/analytics/cameras');
  return (data.cameras || []).map(c => ({
    id: c.camera_id,
    loc: c.location,
    violations: c.total_violations,
    uptime: c.uptime_percent,
    accuracy: c.accuracy_percent,
    status: c.status,
  }));
}

/**
 * Fetch hourly data
 */
export async function fetchHourlyData() {
  const data = await apiFetch('/analytics/hourly');
  return data.hourly || Array(24).fill(0);
}

/**
 * Fetch top violations (summary)
 */
export async function fetchTopViolations() {
  const data = await apiFetch('/analytics/summary');
  return {
    total: data.total_violations || 0,
    today: data.violations_today || 0,
    active_cameras: data.active_cameras || 0,
    avg_accuracy: data.average_accuracy || 0,
    challenges: data.challenges || 0,
  };
}

function normalizeAnalytics(data) {
  return {
    dailyTrend: (data.daily_trend || []).map(d => ({
      day: d.day,
      count: d.count,
    })),
    wards: (data.wards || []).map(w => ({
      rank: w.rank,
      name: w.name,
      total: w.total,
      helmet: w.helmet,
      signal: w.signal,
      triple: w.triple,
      lane: w.lane,
      severity: w.severity,
    })),
    cameras: (data.cameras || []).map(c => ({
      id: c.id,
      loc: c.loc,
      violations: c.violations,
      uptime: c.uptime,
      accuracy: c.accuracy,
      status: c.status,
    })),
    hourly: data.hourly || [],
    recent: (data.recent || []).map(r => ({
      id: r.id,
      type: r.type,
      section: r.section,
      cam: r.cam,
      time: r.time,
      conf: r.conf,
      status: r.status,
    })),
  };
}

export default {
  fetchAnalytics,
  fetchWardStats,
  fetchCameraStatus,
  fetchHourlyData,
  fetchTopViolations,
};
```

---

## STEP 2: Create Custom Hooks

### Step 2.1: Generic fetch hook

**File**: `src/hooks/useFetch.js`

```javascript
import { useState, useEffect } from 'react';

/**
 * Generic hook for fetching data
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} dependencies - Dependency array to refetch
 * @param {Object} options - { retry: 3, cacheTime: 5m }
 */
export function useFetch(fetchFn, dependencies = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { retry = 1, cacheTime = null } = options;

  useEffect(() => {
    let isMounted = true;
    let attempts = 0;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchFn();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (attempts < retry) {
          attempts++;
          setTimeout(load, 1000 * Math.pow(2, attempts)); // Exponential backoff
        } else if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, dependencies);

  const refetch = async () => {
    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
```

### Step 2.2: useViolations hook

**File**: `src/hooks/useViolations.js`

```javascript
import { useState, useEffect } from 'react';
import * as violationApi from '../services/api/violationApi';

/**
 * Custom hook to fetch and manage violations
 * @param {Object} options - {ward, type, status, limit}
 */
export function useViolations(options = {}) {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const data = await violationApi.fetchViolations(options);
        if (isMounted) {
          setViolations(data);
          setHasMore(data.length >= (options.limit || 50));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch violations');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [options.ward, options.type, options.status, options.limit]);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await violationApi.fetchViolations(options);
      setViolations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addViolation = (violation) => {
    setViolations(prev => [violation, ...prev]);
  };

  const updateViolation = (id, updates) => {
    setViolations(prev =>
      prev.map(v => v.id === id ? { ...v, ...updates } : v)
    );
  };

  return {
    violations,
    loading,
    error,
    hasMore,
    refetch,
    addViolation,
    updateViolation,
  };
}
```

### Step 2.3: useAnalytics hook

**File**: `src/hooks/useAnalytics.js`

```javascript
import { useState, useEffect } from 'react';
import * as analyticsApi from '../services/api/analyticsApi';

export function useAnalytics(timeframe = 'week') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const analytics = await analyticsApi.fetchAnalytics(timeframe);
        if (isMounted) setData(analytics);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [timeframe]);

  return { data, loading, error };
}

export function useTopViolations() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const data = await analyticsApi.fetchTopViolations();
        if (isMounted) setStats(data);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { stats, loading, error };
}
```

---

## STEP 3: Update Components to Use Hooks

### BEFORE: AdminDashboard with hardcoded data

```jsx
import { useState, useEffect } from 'react';

// ❌ HARDCODED DATA
const INITIAL_VIOLATIONS = [
  { id: 101, type: 'No Helmet', ... },
  { id: 102, type: 'Red Light', ... },
  // ...
];

export default function AdminDashboard() {
  const [violations, setViolations] = useState(INITIAL_VIOLATIONS);
  const [stats, setStats] = useState({
    violations: 1284,
    challenges: 389,
  });

  // ❌ SIMULATION LOGIC
  useEffect(() => {
    const timer = setInterval(() => {
      triggerDemo();
    }, 14000);
    return () => clearInterval(timer);
  }, []);

  const triggerDemo = () => { /* ... */ };

  return (
    <div>
      <ViolationList violations={violations} />
      <Stats stats={stats} />
    </div>
  );
}
```

### AFTER: AdminDashboard using hooks

```jsx
import { Page } from '../components/layout/Page';
import AdminDashboardUI from '../components/AdminDashboardUI';
import { useViolations } from '../hooks/useViolations';
import { useTopViolations } from '../hooks/useAnalytics';

export default function AdminDashboard() {
  // ✅ FETCH FROM API VIA HOOKS
  const { violations, loading: vLoading, error: vError } = useViolations({
    status: 'active',
    limit: 25
  });
  
  const { stats, loading: sLoading, error: sError } = useTopViolations();

  // Handle errors
  if (vError || sError) {
    return <ErrorPage error={vError || sError} />;
  }

  // Show loading
  if (vLoading || sLoading) {
    return <LoadingDashboard />;
  }

  // Render UI
  return (
    <AdminDashboardUI 
      violations={violations}
      stats={stats}
    />
  );
}
```

### Create dumb component

**File**: `src/components/AdminDashboardUI.jsx`

```jsx
export default function AdminDashboardUI({ violations, stats }) {
  return (
    <div className="adm-shell">
      <header className="adm-topbar">
        <div className="adm-topbar-brand">TrafficWatch</div>
        <div className="adm-topbar-stats">
          <StatCard label="Violations" value={stats.total} />
          <StatCard label="Cameras" value={stats.active_cameras} />
        </div>
      </header>
      
      <div className="adm-main">
        <ViolationsFeed violations={violations} />
      </div>
    </div>
  );
}
```

---

## STEP 4: Handle Loading and Error States

### Create LoadingSkeleton component

**File**: `src/components/common/LoadingSkeleton.jsx`

```jsx
export function LoadingSkeleton() {
  return (
    <div className="skeleton-container">
      <div className="skeleton-card"></div>
      <div className="skeleton-card"></div>
      <div className="skeleton-card"></div>
    </div>
  );
}
```

### Create ErrorMessage component

**File**: `src/components/common/ErrorMessage.jsx`

```jsx
export function ErrorMessage({ error, onRetry }) {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p>{error?.message || 'Unable to load data'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>
      )}
    </div>
  );
}
```

### Use in components

```jsx
import { ErrorMessage } from './common/ErrorMessage';
import { LoadingSkeleton } from './common/LoadingSkeleton';

export default function ViolationPage() {
  const { violations, loading, error, refetch } = useViolations();

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (!violations?.length) return <EmptyState />;

  return <ViolationList violations={violations} />;
}
```

---

## STEP 5: Add Real-Time Updates

### Create real-time hook

**File**: `src/hooks/useRealtimeViolations.js`

```javascript
import { useEffect, useState } from 'react';
import { useViolations } from './useViolations';
import * as violationApi from '../services/api/violationApi';

/**
 * Hook that polls for new violations
 * In production, replace with WebSocket or Firebase listeners
 */
export function useRealtimeViolations(options = {}) {
  const hook = useViolations(options);
  const { violations } = hook;
  const [newViolationAlert, setNewViolationAlert] = useState(null);

  useEffect(() => {
    // Poll for new violations every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const fresh = await violationApi.fetchRecentViolations(1);
        if (fresh.length > 0 && violations.length > 0) {
          if (fresh[0].id !== violations[0].id) {
            setNewViolationAlert(fresh[0]);
            hook.addViolation(fresh[0]);
            
            // Show alert for 5 seconds
            setTimeout(() => setNewViolationAlert(null), 5000);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [violations, hook]);

  return {
    ...hook,
    newViolationAlert,
  };
}
```

---

## STEP 6: Call API in Modals

### Update ChallanSection

**File**: `src/components/ChallanSection.jsx` (refactored)

```jsx
import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import * as challanApi from '../services/api/challanApi';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { ErrorMessage } from './common/ErrorMessage';

export default function ChallanSection() {
  const [filter, setFilter] = useState('pending');
  
  // Use generic fetch hook
  const { data: challans, loading, error, refetch } = useFetch(
    () => challanApi.fetchChallans({ status: filter }),
    [filter],
    { retry: 2 }
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div>
      {/* Render challans */}
      {challans?.map(c => (
        <ChallanRow key={c.id} challan={c} onApprove={refetch} />
      ))}
    </div>
  );
}
```

---

## STEP 7: Environment Variables

### Create .env file

**File**: `.env`

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=xxxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxxx
VITE_FIREBASE_PROJECT_ID=xxxxx
VITE_ENABLE_MOCK_DATA=false
```

### Use in services

```javascript
// services/api.js
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

if (USE_MOCK) {
  // Use mock data for development
  return getMockViolations(); // from mockData/violations.js
}
```

---

## IMPLEMENTATION CHECKLIST

- [ ] Create `src/services/api/violationApi.js`
- [ ] Create `src/services/api/analyticsApi.js`
- [ ] Create `src/hooks/useFetch.js`
- [ ] Create `src/hooks/useViolations.js`
- [ ] Create `src/hooks/useAnalytics.js`
- [ ] Refactor `AdminDashboard.jsx` to use `useViolations()`
- [ ] Refactor `ViolationLog.jsx` to use `useViolations()`
- [ ] Refactor `AnalyticsDashboard.jsx` to use `useAnalytics()`
- [ ] Create `LoadingSkeleton.jsx`
- [ ] Create `ErrorMessage.jsx`
- [ ] Add environment variables to `.env`
- [ ] Test with real backend API
- [ ] Add `.env.example` to git

---

## FALLBACK DATA FOR DEVELOPMENT

If backend not ready yet, create mock data:

**File**: `src/services/mockData/violations.js`

```javascript
export const MOCK_VIOLATIONS = [
  { id: 101, type: 'No Helmet', plate: 'MH-15-AB-4421', ... },
  { id: 102, type: 'Red Light', plate: 'MH-15-CD-7723', ... },
];

export async function getMockViolations(options) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_VIOLATIONS);
    }, 500);
  });
}
```

Then in service:

```javascript
const USE_MOCK = process.env.REACT_APP_USE_MOCK_DATA === 'true';

export async function fetchViolations(options) {
  if (USE_MOCK) {
    return getMockViolations(options);
  }
  return apiFetch('/violations', { params: options });
}
```

---

See `PRIORITY_ROADMAP.md` for step-by-step weekly implementation plan


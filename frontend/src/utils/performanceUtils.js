/**
 * Performance Utilities
 * Collection of optimization helpers for the frontend
 */

/**
 * Debounce hook to prevent excessive function calls
 * Useful for search, resize, scroll events
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = require('react').useState(value);

  require('react').useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook to limit function calls
 * Useful for smooth scroll or resize handlers
 */
export function useThrottle(value, interval = 500) {
  const [throttledValue, setThrottledValue] = require('react').useState(value);
  const lastUpdated = require('react').useRef(null);

  require('react').useEffect(() => {
    const now = Date.now();

    if (lastUpdated.current && now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else if (!lastUpdated.current) {
      lastUpdated.current = now;
      setThrottledValue(value);
    }
  }, [value, interval]);

  return throttledValue;
}

/**
 * Lazy load images
 * Waits until image is in viewport before loading
 */
export function LazyImage({ src, alt, ...props }) {
  const imgRef = require('react').useRef(null);
  const [imageSrc, setImageSrc] = require('react').useState(null);

  require('react').useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      });
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return <img ref={imgRef} src={imageSrc} alt={alt} loading="lazy" {...props} />;
}

/**
 * Virtual list renderer for long lists
 * Only renders items in viewport
 */
export function useVirtualList(items, itemHeight = 100, containerHeight = 600) {
  const [scrollTop, setScrollTop] = require('react').useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
  const visibleItems = items.slice(startIndex, endIndex + 1);

  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    onScroll: (e) => setScrollTop(e.target.scrollTop),
  };
}

/**
 * Performance monitoring hook
 * Tracks component render times
 */
export function usePerformanceMonitor(componentName) {
  const renderTime = require('react').useRef(Date.now());

  require('react').useEffect(() => {
    const endTime = Date.now();
    const duration = endTime - renderTime.current;

    if (duration > 16) {
      // Log if render takes more than 16ms (60 FPS frame)
      console.warn(`⚠️ ${componentName} render time: ${duration}ms`);
    }

    return () => {
      renderTime.current = Date.now();
    };
  });
}

/**
 * Optimize re-renders with deep comparison
 */
export function isEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1 || {});
  const keys2 = Object.keys(obj2 || {});

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => obj1[key] === obj2[key]);
}

/**
 * Batch state updates to reduce re-renders
 */
export function useBatchState(initialState) {
  const [state, setState] = require('react').useState(initialState);
  const batchedUpdates = require('react').useRef({});

  const updateBatch = require('react').useCallback((updates) => {
    batchedUpdates.current = { ...batchedUpdates.current, ...updates };
  }, []);

  const flushBatch = require('react').useCallback(() => {
    if (Object.keys(batchedUpdates.current).length > 0) {
      setState((prev) => ({ ...prev, ...batchedUpdates.current }));
      batchedUpdates.current = {};
    }
  }, []);

  return [state, updateBatch, flushBatch];
}

/**
 * Request idle callback polyfill
 * Schedule non-urgent work
 */
export function useIdleCallback(callback, dependencies = []) {
  require('react').useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(callback);
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 1);
      return () => clearTimeout(id);
    }
  }, dependencies);
}

/**
 * Cache API responses
 */
class ResponseCache {
  constructor(ttl = 5 * 60 * 1000) {
    // 5 minute TTL by default
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }
}

export const apiCache = new ResponseCache();

/**
 * Fetch with caching
 */
export async function cachedFetch(url, options = {}) {
  const cacheKey = `${options.method || 'GET'}:${url}`;

  // Try cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache hit: ${url}`);
    return cached;
  }

  // Fetch and cache
  const response = await fetch(url, options);
  const data = await response.json();

  if (response.ok) {
    apiCache.set(cacheKey, data);
  }

  return data;
}

export default {
  useDebounce,
  useThrottle,
  LazyImage,
  useVirtualList,
  usePerformanceMonitor,
  isEqual,
  useBatchState,
  useIdleCallback,
  apiCache,
  cachedFetch,
};

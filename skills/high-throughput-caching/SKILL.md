---
name: high-throughput-caching
description: Patterns for high-throughput in-memory caching, cache stampede prevention, distributed mutexes, and single-flight token refresh queues. Use when designing caching layers, mitigating thundering herds, optimizing Redis performance, or fixing concurrent 401 token refresh logouts.
---

# High-Throughput In-Memory Caching & Stampede Prevention

This skill provides patterns and code implementations for high-concurrency caching architectures, eliminating cache stampedes, thundering herds, and auth token rotation race conditions.

---

## 1. The Core Failure Mode: Cache Stampede (Thundering Herd)

When a hot cache key expires (e.g., home feed, product details, auth token) under 10,000 requests/second:
1. All 10,000 requests miss the cache simultaneously ($T=0$).
2. All 10,000 requests simultaneously query the primary SQL database or Auth Provider.
3. Database CPU spikes to 100%, query timeouts cascade, and the application crashes.

---

## 2. Server-Side Cache Stampede Mitigation

### Pattern A: Probabilistic Early Expiration (XFetch Algorithm)

Instead of waiting for a key to strictly expire, background threads probabilistically recompute the key before expiration based on computation latency $\delta$:

```typescript
// xfetch.ts
export async function getWithXFetch<T>(
  redis: any,
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>,
  beta: number = 1.0
): Promise<T> {
  const cached = await redis.get(key);
  
  if (cached) {
    const { value, delta, expiry } = JSON.parse(cached);
    const timeUntilExpiry = (expiry - Date.now()) / 1000;

    // Probabilistic early refresh trigger
    // -delta * beta * ln(random()) > timeUntilExpiry
    if (timeUntilExpiry > 0 && -(delta * beta * Math.log(Math.random())) <= timeUntilExpiry) {
      return value; // Cache is still fresh enough for this caller
    }
    // Background recalculate
    recomputeAndCache(redis, key, ttlSeconds, computeFn).catch(console.error);
    return value;
  }

  return await recomputeAndCache(redis, key, ttlSeconds, computeFn);
}

async function recomputeAndCache<T>(
  redis: any,
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const value = await computeFn();
  const delta = (Date.now() - startTime) / 1000;
  const expiry = Date.now() + ttlSeconds * 1000;

  await redis.set(
    key,
    JSON.stringify({ value, delta, expiry }),
    'EX',
    ttlSeconds + 60 // Buffer TTL
  );
  return value;
}
```

### Pattern B: Distributed Redis Mutex Lock (Single-Flight Server Cache)

Only one thread acquires the right to recompute the cache; other callers wait or receive stale data:

```typescript
export async function getWithDistributedMutex<T>(
  redis: any,
  key: string,
  ttlSeconds: number,
  computeFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, 'locked', 'NX', 'PX', 5000); // 5s lock TTL

  if (acquired) {
    try {
      const freshData = await computeFn();
      await redis.set(key, JSON.stringify(freshData), 'EX', ttlSeconds);
      return freshData;
    } finally {
      await redis.del(lockKey);
    }
  } else {
    // Wait 50ms and retry reading cache
    await new Promise((resolve) => setTimeout(resolve, 50));
    return getWithDistributedMutex(redis, key, ttlSeconds, computeFn);
  }
}
```

---

## 3. Client-Side Single-Flight: Token Refresh Mutex Queue

When an access token expires, multiple parallel network calls (e.g., profile, notifications, feed) fail with `401 Unauthorized` at the same instant. If all 5 requests naively fire `POST /auth/refresh`, **Refresh Token Rotation (RTR)** revokes the first token, rejects the others, and forces a logout.

### The Interceptor Mutex & Serialized Queue Pattern

```typescript
// apiClient.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

export const apiClient = axios.create({ baseURL: '/api' });

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Enqueue subsequent parallel 401 requests while refresh is in flight
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Single flight: Only 1 request actually refreshes the token
        const { data } = await axios.post('/auth/refresh');
        const newToken = data.accessToken;
        
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Force logout on genuine refresh failure
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 4. Key Takeaways for High-Throughput Systems

- **Jitter All TTLs:** Never set a static TTL (e.g. `EX 3600`). Always add jitter: `ttl = baseTtl + Math.floor(Math.random() * 300)` so thousands of keys don't expire simultaneously.
- **Two-Tier (L1/L2) Cache:** Use in-memory LRU cache (e.g. Node-cache / Caffeine) as L1 (1-5s TTL) to prevent network trips to Redis for extreme hot-keys.
- **Single-Flight Interceptors:** Always serialize concurrent authentication refreshes in frontend and mobile clients.

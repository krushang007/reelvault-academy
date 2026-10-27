---
name: production-readiness-audit
description: Comprehensive 46-point production readiness and pre-launch audit framework for web applications, APIs, and AI-generated codebases. Use when reviewing code before deployment, verifying architecture resilience, checking security hardening, auditing database concurrency, running pre-launch SEO audits, or evaluating vibe-coded prototypes for production suitability.
---

# Production Readiness & Pre-Launch Master Audit Framework

This skill guides AI agents and engineers through an exhaustive 46-point pre-launch audit across 6 foundational pillars before deploying any web application, API, or AI-generated codebase to staging or production.

---

## 1. The Audit Mindset: Beyond the "Happy Path"

AI code generators excel at rapid prototyping but consistently omit critical distributed systems infrastructure:
- Missing idempotency keys on payment/mutation endpoints.
- Unbounded database connection creation under traffic spikes.
- Exposed client-side JavaScript source maps in production builds.
- Static canonical URLs defined in root layouts that de-index internal pages.
- Unconstrained LLM token streaming causing runaway cloud bills.

---

## 2. The 46-Point Pre-Launch Master Checklist

### Pillar 1: Zero-Trust Security & Data Hardening (10 Checks)
- [ ] **1. Secret Hygiene & Zero Hardcoded Keys:** No API keys (`sk-`, `AIza`, `ghp_`), database passwords, or JWT secrets in source code or git history. All environment variables validated with typed schemas (Zod/Pydantic) at startup.
- [ ] **2. Disable Source Maps in Production:** In `next.config.js` or bundler settings, ensure `productionBrowserSourceMaps: false` so original source code and comments are not exposed to the public.
- [ ] **3. BOLA / IDOR Authorization Protection:** Every database mutation (`/api/projects/:id`) verifies tenant ownership server-side (`WHERE id = :id AND org_id = :session.orgId`). Never rely on client-supplied user IDs.
- [ ] **4. Parameterized SQL & ORM Sanitization:** Zero string interpolation inside SQL statements. All queries bound via parameterized statements (Prisma, Drizzle, SQLAlchemy) to eliminate SQL injection.
- [ ] **5. File Upload Magic-Byte Validation & Quarantine:** Never trust client file extensions (e.g. `payload.php.jpg`). Verify file binary magic bytes, re-encode images via Sharp, and upload to S3/R2 with non-executable MIME types.
- [ ] **6. Strict CORS Domain Allowlist:** Explicit domain whitelists in `Access-Control-Allow-Origin`. Never use wildcard `*` alongside `credentials: true`.
- [ ] **7. HttpOnly, Secure, SameSite Cookie Flags:** Auth session tokens in cookies must enforce `HttpOnly; Secure; SameSite=Lax (or Strict)` to prevent token theft via XSS.
- [ ] **8. Security Headers & CSP:** Include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, and Content Security Policy.
- [ ] **9. Reverse Proxy & Rate Limiting:** Leaky-bucket rate limiting (Nginx `limit_req_zone` or Upstash Redis) enforcing strict limits on auth/login routes (5 req/min) and general APIs (100 req/min).
- [ ] **10. Payload Size Limits:** Body parsers strictly limit incoming JSON/file uploads (`body-parser limit: '1mb'`) to prevent memory buffer exhaustion denial-of-service.

### Pillar 2: Technical SEO & Metadata Integrity (8 Checks)
- [ ] **11. The Canonical URL Rule (Never in Root Layout):** Never define a static canonical URL in the root `layout.tsx`, or Google will de-index all subpages as duplicates. Set `metadataBase` in root and dynamic relative alternates per page.
- [ ] **12. Unique Titles & Meta Descriptions:** Titles formatted with templates (`%s | Brand`), 50–60 characters max. Meta descriptions between 120–160 characters without truncation.
- [ ] **13. OpenGraph & Twitter Social Cards:** 1200x630px dynamic `og:image`, `og:title`, and `og:description` preview tags configured for all public URLs.
- [ ] **14. Semantic Heading Hierarchy:** Exactly one `<h1>` per page. Logical, non-skipping hierarchy (`<h2>` $\rightarrow$ `<h3>`). Visual styling handled via CSS classes, not improper heading tags.
- [ ] **15. Image Alt Text Enforcement:** All `<img>` and `<Image>` tags include descriptive, contextual `alt` attributes (empty `alt=""` only for purely decorative icons).
- [ ] **16. AI Crawler Whitelisting in `robots.txt`:** Whitelist `GPTBot`, `ClaudeBot`, and `PerplexityBot` without aggressive Cloudflare challenge blocks to maximize Generative Engine Optimization (GEO) citations.
- [ ] **17. Dynamic XML Sitemap (`/sitemap.xml`):** Programmatic sitemap listing all published public routes, last modified timestamps (`dateModified`), and change frequencies.
- [ ] **18. Remove Staging `noindex` Directives:** Audit production HTTP response headers and `<head>` tags to ensure no leftover `X-Robots-Tag: noindex` from preview environments.

### Pillar 3: Performance & Core Web Vitals (7 Checks)
- [ ] **19. Largest Contentful Paint (LCP < 2.5s):** Hero image preloaded with `<link rel="preload">` or Next.js `priority={true}`. Compressed in WebP or AVIF formats.
- [ ] **20. Cumulative Layout Shift (CLS < 0.1):** Explicit `width` and `height` (or aspect-ratio containers) declared on all images, banners, and video players to prevent layout reflows during loading.
- [ ] **21. Interaction to Next Paint (INP < 200ms):** Eliminate heavy synchronous computations on the main thread during button taps and interactions.
- [ ] **22. Font Optimization:** Use self-hosted Google Fonts via `next/font` with `font-display: swap` to prevent FOIT (Flash of Invisible Text).
- [ ] **23. Static Asset Caching & Immutable Headers:** Static JS bundles, CSS, and hashed images served with `Cache-Control: public, max-age=31536000, immutable`.
- [ ] **24. Text Compression (Brotli / Gzip):** Brotli compression enabled at CDN/reverse proxy layer for all HTML, CSS, JS, and JSON assets.
- [ ] **25. Bundle Splitting & Lazy Loading:** Heavy non-critical components (modals, complex charts, maps) loaded via dynamic imports (`dynamic(() => import(...))`).

### Pillar 4: Backend, Database & Concurrency Resilience (8 Checks)
- [ ] **26. Connection Pooling & Max Limits:** Database connections gated behind a pooler (PgBouncer, Prisma Accelerate) with hard connection limits to prevent Postgres/MySQL OOM crashes during spikes.
- [ ] **27. Database Query Indexing:** Every column used in `WHERE`, `JOIN ... ON`, `ORDER BY`, or `GROUP BY` clauses backed by a B-Tree index.
- [ ] **28. N+1 Query Elimination:** ORM fetch loops audited for N+1 queries; batched using eager joins (`JOIN FETCH`, Prisma `include`, or DataLoader).
- [ ] **29. Idempotency Keys on Payment & Mutation Endpoints:** `POST /charges` and `POST /orders` require an `Idempotency-Key` header cached in Redis with a 24h TTL to eliminate double billing.
- [ ] **30. Atomic Inventory Decrements:** Zero read-then-write stock updates. Use atomic SQL (`UPDATE inventory SET stock = stock - 1 WHERE id = ? AND stock > 0`) or Redis Lua scripts to eliminate overselling race conditions.
- [ ] **31. Outbound HTTP Timeouts & AbortSignals:** Every `fetch()` call to external APIs (OpenAI, Stripe, SendGrid) configured with a strict timeout (3–5s) and `AbortSignal` to prevent hanging server worker threads.
- [ ] **32. Database Migrations Verified in Staging:** All SQL migrations tested against realistic data volumes in staging to ensure no exclusive table locks stall production.
- [ ] **33. Streaming Cancellation:** All LLM and SSE streaming endpoints listen for client disconnects (`req.on('close')`) and abort upstream LLM inference immediately.

### Pillar 5: Frontend UX, Forms & Client Reliability (7 Checks)
- [ ] **34. Zero Hydration Mismatches:** Server-rendered markup matches client DOM byte-for-byte (no client-side `Date.now()`, `window`, or random math during initial SSR).
- [ ] **35. Global Error Boundaries:** React Error Boundaries wrapped around page templates and critical widgets with clear fallback states and retry buttons.
- [ ] **36. Custom 404 & 500 Pages:** Branded, helpful 404 Not Found and 500 Server Error pages providing search bars and navigation links back home.
- [ ] **37. Form Double-Submit Prevention:** Submit buttons disable immediately upon submission, with visual loading spinners and accessible error states.
- [ ] **38. Favicons & Web App Manifest:** Complete favicon set provided: `favicon.ico`, 16x16, 32x32, 180x180 `apple-touch-icon.png`, and `manifest.webmanifest`.
- [ ] **39. Responsive Viewport Stress Test:** Layout tested across 320px (iPhone SE), 375px, 768px (iPad), 1024px, and 1440px desktop screens with zero horizontal overflow scrollbars.
- [ ] **40. Token Refresh Queue (Stampede Prevention):** Frontend HTTP interceptors serialize concurrent `401 Unauthorized` responses into a single promise queue to prevent refresh token rotation race logouts.

### Pillar 6: SRE Observability & Post-Launch Verification (6 Checks)
- [ ] **41. Structured JSON Logging with Correlation IDs:** All logs emit machine-readable JSON containing timestamp, severity level, route path, latency, and a unique `X-Request-ID` UUID.
- [ ] **42. Unhandled Exception & Process Handlers:** Explicit listeners on `process.on('uncaughtException')` and `process.on('unhandledRejection')` logging error context before graceful shutdown.
- [ ] **43. Health Check Endpoints (`/healthz` & `/ready`):** Fast `/healthz` liveness probe for load balancers and a `/ready` probe that verifies active database and Redis connectivity.
- [ ] **44. Google Search Console & Sitemap Submission:** Domain property verified in GSC immediately upon DNS propagation; `/sitemap.xml` submitted to initiate indexation.
- [ ] **45. Microsoft Clarity / Session Heatmaps:** Privacy-compliant session replay installed to track rage clicks, dead clicks, and mobile scroll drop-offs.
- [ ] **46. Screaming Frog Crawl Verification:** Full crawler pass on the live domain to verify 0 broken links (404s), 0 redirect chains (301 loops), and 0 orphan pages.

---

## 3. Automated Code Audit Execution Script

Run this verification script to quickly detect common high-risk vulnerabilities in any Node/TypeScript/Python repository:

```bash
#!/usr/bin/env bash
# audit-repo.sh - Rapid pre-launch security & hygiene check
echo "=== Running Pre-Launch Code Hygiene Audit ==="

# 1. Search for hardcoded secrets or sensitive keys
echo "[1/5] Checking for accidental hardcoded secrets..."
grep -rnE '(AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{32,}|ghp_[0-9a-zA-Z]{36}|postgres:\/\/.*:.*@)' . \
  --exclude-dir={node_modules,.git,dist,.next,build} || echo "No obvious hardcoded secrets found."

# 2. Check for missing timeouts in fetch calls
echo "[2/5] Checking for unbounded fetch() calls missing AbortSignal/timeout..."
grep -rn "fetch(" . --exclude-dir={node_modules,.git,dist,.next,build} | grep -v "signal" | head -n 5 || true

# 3. Check for raw console.log statements instead of structured logger
echo "[3/5] Counting raw console.log statements in production code..."
console_count=$(grep -rn "console.log(" src/ 2>/dev/null | wc -l || echo 0)
echo "Found $console_count console.log occurrences."

# 4. Check for wildcard CORS
echo "[4/5] Checking for wildcard CORS headers..."
grep -rn "Access-Control-Allow-Origin.*[*]" . --exclude-dir={node_modules,.git} || echo "No wildcard CORS detected."

# 5. Check for dangerous dangerouslySetInnerHTML
echo "[5/5] Checking for dangerouslySetInnerHTML..."
grep -rn "dangerouslySetInnerHTML" src/ 2>/dev/null || echo "No raw innerHTML injection detected."

echo "=== Audit Completed ==="
```

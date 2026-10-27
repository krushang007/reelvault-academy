---
name: geo-seo-optimizer
description: Generative Engine Optimization (GEO) and modern Technical SEO audit framework. Use when optimizing web pages for citation in AI search engines (Perplexity, SearchGPT, Claude, Gemini), running Next.js SEO pre-launch audits, or mining Google Search Console for high-impression low-CTR keyword opportunities.
---

# Generative Engine Optimization (GEO) & Technical SEO Framework

This skill guides engineers and marketers in optimizing websites to earn citations in AI search engines (SearchGPT, Perplexity, Google AI Overviews) while maximizing organic Google Search Console CTR.

---

## 1. The 8-Tactic GEO Tier List

AI search engines (RAG-based search agents) do NOT rank pages the same way traditional PageRank does:

| Tier | Tactic | Impact & Implementation |
| :--- | :--- | :--- |
| **S-Tier** | **1. Unrestricted AI Crawler Access** | Whitelist `GPTBot`, `ClaudeBot`, and `PerplexityBot` in `robots.txt`. Do NOT block them behind Cloudflare managed bot challenges. |
| **S-Tier** | **2. Comparison & Alternative Tables** | LLMs heavily cite structured comparison matrices (e.g. `Tool A vs Tool B`). Include objective feature matrices with Markdown/HTML tables. |
| **S-Tier** | **3. Unlinked Web Brand Mentions** | LLM RAG pipelines weight consensus co-occurrence across forums, Reddit, and industry blogs far higher than exact-match anchor backlinks. |
| **A-Tier** | **4. Content Freshness Velocity** | Strong recency bias: Updating pages with recent schema `dateModified` timestamps increases citation probability ~3x. |
| **A-Tier** | **5. 3rd-Party Review Profiles** | Established presence on Trustpilot, G2, Product Hunt, and Reddit where models verify social proof. |
| **C-Tier** | **6. JSON-LD Schema Markup** | Useful for Google rich snippets; modern LLMs parse semantic HTML/tables with equal accuracy. |
| **D-Tier** | **7. Domain Authority (DA / DR)** | Low correlation. AI engines routinely cite niche indie blogs and forum answers over high-DA generic content. |
| **F-Tier** | **8. `llms.txt`** | **Myth:** Over 97% of commercial AI search engines currently ignore `/llms.txt`. Do not waste engineering hours maintaining separate text mirrors. |

---

## 2. Google Search Console (GSC) CTR Opportunity Mining

The fastest organic traffic win is finding keywords already ranking on Page 1 or top of Page 2 (Positions 4–15) that suffer from below-average Click-Through Rates (CTR).

### The GSC Mining Formula:
1. Export GSC Performance data (last 28 or 90 days).
2. Filter for:
   - **Impressions:** $> 500$
   - **Position:** Between $4.0$ and $15.0$
   - **CTR:** $< 2.5\%$
3. Rewrite the target page's `<title>` and `<meta name="description">` to match search intent:
   - Include the exact high-impression keyword in the first 40 characters of the `<title>`.
   - Add clear numerical brackets: e.g. `[2026 Guide]`, `(Step-by-Step)`, `[With Examples]`.
   - Add a high-converting emotional hook or benefit to the meta description.

---

## 3. Production Next.js SEO Pre-Launch Checklist

Ensure these technical SEO elements are implemented in `app/layout.tsx` and dynamic routes:

```typescript
// app/robots.ts - Allow AI search engines
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'],
        allow: '/',
      },
    ],
    sitemap: 'https://yourdomain.com/sitemap.xml',
  };
}
```

### Route Metadata Contract:

- [ ] **Canonical URL:** Every route declares `<link rel="canonical" href="https://yourdomain.com/exact-slug" />` to prevent duplicate indexing across query parameters or trailing slashes.
- [ ] **OpenGraph Image:** Dynamic `og:image` (1200x630px) configured in Next.js `opengraph-image.tsx` or static meta.
- [ ] **Semantic Heading Tree:** Exactly one `<h1>` per page. Sub-sections strictly use `<h2>`, and details use `<h3>`. Never skip heading levels for aesthetic sizing (use CSS classes for size instead).
- [ ] **Structured HTML Tables:** Comparisons, pricing tiers, and specifications structured in semantic `<table>` elements with clear `<th>` headers.
- [ ] **Clean Indexing Status:** Check response headers for accidental `X-Robots-Tag: noindex` left behind from staging environments.

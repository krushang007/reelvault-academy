---
name: url-to-design-tokens
description: Extract computed CSS styles, colors, typography scales, spacing, and elevation tokens from any reference URL into a standardized DESIGN.md specification file. Use when the user wants an interface to match an existing benchmark website (e.g. Stripe, Linear, Scale AI), when creating design systems, or when avoiding generic AI frontend aesthetics.
---

# URL-to-Design-Tokens Grounding Pattern

This skill prevents "AI design slop" (generic Tailwind defaults, purple gradients, uncalibrated border radiuses) by extracting computed design tokens from benchmark sites into a clean, portable `DESIGN.md` contract.

---

## 1. Why Direct URL Prompting Fails

When an AI coding agent is prompted:
> *"Build me a dashboard that looks like `https://scale.com`"*

The agent fails because:
1. It cannot execute JavaScript or inspect computed styles from a raw URL.
2. It defaults to baseline Tailwind tropes (e.g., `bg-gray-900`, `text-blue-500`, `font-sans`).
3. It misses high-end visual subtleties: multi-layered dark surfaces (e.g., `#191A29`, `#161723`), geometric grotesques (Aeonik, FK Grotesk), bespoke inner borders (`rgba(255, 255, 255, 0.08)`), and subtle noise textures.

---

## 2. The 3-Step Token Extraction Workflow

```
[Target Website URL]
        │
        ▼
[Headless Browser Extraction (Puppeteer/Playwright)]
        │ ── Computed CSS Styles
        │ ── Dominant Colors & Surfaces
        │ ── Typography Hierarchies & Line Heights
        │ ── Spacing Scales & Border Radiuses
        ▼
[Synthesize DESIGN.md Token Contract]
        │
        ▼
[Provide DESIGN.md to Coding Agent as Ground Truth]
```

---

## 3. Automated Token Extraction Script (Playwright / Node.js)

Run this extraction script or execute in browser console to collect computed design tokens:

```javascript
// extract-tokens.js - Execute in page context or via Playwright
(() => {
  const elements = Array.from(document.querySelectorAll('body, header, nav, h1, h2, h3, p, button, a, card, section'));
  
  const colors = new Set();
  const backgroundColors = new Set();
  const fonts = new Set();
  const fontSizes = new Set();
  const borderRadiuses = new Set();

  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.color && style.color !== 'rgba(0, 0, 0, 0)') colors.add(style.color);
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') backgroundColors.add(style.backgroundColor);
    if (style.fontFamily) fonts.add(style.fontFamily.split(',')[0].replace(/['"]/g, '').trim());
    if (style.fontSize) fontSizes.add(style.fontSize);
    if (style.borderRadius && style.borderRadius !== '0px') borderRadiuses.add(style.borderRadius);
  });

  return {
    fonts: Array.from(fonts),
    fontSizes: Array.from(fontSizes).sort((a, b) => parseFloat(a) - parseFloat(b)),
    surfaces: Array.from(backgroundColors),
    textColors: Array.from(colors),
    borderRadiuses: Array.from(borderRadiuses)
  };
})();
```

---

## 4. Standard `DESIGN.md` Output Specification

Format the extracted tokens into a project root `DESIGN.md`:

```markdown
# Design System Specification (Generated from Benchmark)

## 1. Color Palette & Surfaces
- **Canvas / Background:** `#0B0C10` (Deep obsidian black)
- **Surface Elevation 1 (Cards, Nav):** `#161723` (Subtle blue-grey dark tint)
- **Surface Elevation 2 (Modals, Popovers):** `#1E2030`
- **Border Default:** `rgba(255, 255, 255, 0.08)`
- **Border Active / Hover:** `rgba(255, 255, 255, 0.18)`
- **Accent Primary:** `#6366F1` (Vibrant Indigo)
- **Accent Hover:** `#4F46E5`
- **Text Primary:** `#F8FAFC`
- **Text Secondary:** `#94A3B8`
- **Text Muted:** `#64748B`

## 2. Typography
- **Primary Font Family:** "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Heading Font Family:** "Cabinet Grotesk", "Inter", sans-serif
- **Monospace Family:** "JetBrains Mono", monospace
- **Scale:**
  - `Display`: 48px / line-height: 1.1 / letter-spacing: -0.03em / weight: 700
  - `H1`: 36px / line-height: 1.15 / letter-spacing: -0.025em / weight: 600
  - `H2`: 24px / line-height: 1.25 / letter-spacing: -0.02em / weight: 600
  - `H3`: 18px / line-height: 1.35 / letter-spacing: -0.01em / weight: 600
  - `Body`: 14px / line-height: 1.5 / weight: 400
  - `Caption`: 12px / line-height: 1.4 / weight: 500

## 3. Spacing & Shape Tokens
- **Border Radius:**
  - `sm`: 6px (Badges, tags)
  - `md`: 10px (Buttons, inputs)
  - `lg`: 16px (Cards, dialogs)
  - `full`: 9999px (Pills)
- **Elevation Shadows:**
  - `card`: 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)
  - `dropdown`: 0 10px 25px -5px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)

## 4. Components & Motion Rules
- **Interactive Hover:** 150ms `cubic-bezier(0.16, 1, 0.3, 1)` transitions.
- **Card Hover:** Subtle scale (`scale(1.01)`) and border brighten, NO heavy colored dropshadows.
```

---

## 5. Coding Agent Integration Rule

Whenever building or redesigning UI components:
1. Always check for the presence of `DESIGN.md` in the workspace root.
2. If `DESIGN.md` exists, **all generated CSS classes, hex codes, border radiuses, and font declarations must strictly derive from it**.
3. Never introduce rogue hex codes (e.g. `#ffffff`, `#000000`) or default Tailwind colors (`bg-blue-600`) unless explicitly defined in `DESIGN.md`.

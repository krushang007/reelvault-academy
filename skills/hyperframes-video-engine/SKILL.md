---
name: hyperframes-video-engine
description: Compile deterministic MP4 videos from standard HTML, CSS, GSAP, and SVG markup using HeyGen's HyperFrames engine. Use when creating product launch videos, animated web charts, declarative social clips, or replacing expensive per-render SaaS APIs with local Headless Chrome + FFmpeg rendering.
---

# HyperFrames HTML/CSS Video Engine

This skill guides agents in building and rendering deterministic, code-driven video animations using **HyperFrames** (by HeyGen) — compiling standard web DOM elements, CSS animations, and GSAP timelines into frame-accurate MP4 files.

---

## 1. Why HyperFrames over Generative Video Models

| Feature | Generative Video (Runway / Sora) | HyperFrames (HeyGen) |
| :--- | :--- | :--- |
| **Reproducibility** | Hallucinates new variations each run | 100% Deterministic (Code in = exact MP4 out) |
| **Typography** | Warped, illegible text | Pixel-crisp Google WebFonts & system fonts |
| **Cost** | Expensive cloud diffusion compute | Free local Headless Chrome & FFmpeg |
| **Timing Precision** | Approximate | Frame-accurate (30fps / 60fps) |

---

## 2. Rendering Pipeline Mechanics

```
[HTML + CSS + GSAP Animation Files]
                │
                ▼
[Headless Chrome (Puppeteer)] ── Seeks frame-by-frame (T = 0.00s, 0.033s, 0.066s...)
                │
                ▼
[Lossless Canvas Snapshots] ── Streams raw frames to stdin pipe
                │
                ▼
[FFmpeg Audio/Video Multiplexer] ── Encodes H.264 / AAC
                │
                ▼
[Output: video.mp4]
```

---

## 3. Project Structure & Declarative Markup

```
my-video/
├── index.html          # Main timeline & scene markup
├── styles.css          # CSS styles and keyframes
├── script.js           # Optional GSAP / JavaScript timeline controls
├── assets/             # Audio tracks, images, SVGs
└── package.json
```

### Declarative Timeline Syntax (`index.html`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="styles.css">
</head>
<body style="width: 1080px; height: 1920px; background: #0b0c10; overflow: hidden;">

  <!-- Audio Track -->
  <audio src="assets/voiceover.mp3" data-timeline></audio>

  <!-- Scene 1: Hook (Frames 0 to 90 -> 0s to 3s @ 30fps) -->
  <section class="scene" data-in="0" data-out="90">
    <div class="card pop-in">
      <h1 class="headline">Stop Paying $1,000 For Video Explainers</h1>
      <p class="subhead">Compile videos directly from HTML & CSS.</p>
    </div>
  </section>

  <!-- Scene 2: Feature Matrix (Frames 90 to 240 -> 3s to 8s) -->
  <section class="scene" data-in="90" data-out="240">
    <div class="feature-grid slide-up">
      <div class="pill">Zero Render Fees</div>
      <div class="pill">Headless Chrome</div>
      <div class="pill">FFmpeg Encoding</div>
    </div>
  </section>

</body>
</html>
```

---

## 4. CLI Workflow & Agent Automation

```bash
# 1. Initialize new HyperFrames project
npx hyperframes init product-launch --width 1080 --height 1920 --fps 60

# 2. Update agent skill definitions
npx hyperframes skills update

# 3. Launch live hot-reload browser preview (dev server)
npx hyperframes preview

# 4. Render production MP4 file
npx hyperframes render --output out/product-launch.mp4 --quality high
```

---

## 5. Agent Animation Rules

- **Use Viewport Units (vw / vh):** Always size elements relative to container dimensions (`1080x1920` for vertical, `1920x1080` for horizontal).
- **CSS Transitions over RequestAnimationFrame:** Headless Chrome locks into deterministic frame steps when animations use standard CSS `@keyframes` or GSAP timelines.
- **Preload Fonts & Assets:** Always include `<link rel="preload">` for web fonts and hero images to prevent flash-of-unstyled-text (FOUT) on frame 0.

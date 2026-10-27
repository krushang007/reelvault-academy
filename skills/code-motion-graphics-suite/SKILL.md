---
name: code-motion-graphics-suite
description: The 5 code-driven motion graphics skills suite (HyperFrames, OneTake, Collage B-Roll, Sprite Rigging, and Lemo Opuscar). Use when creating procedural motion graphics, continuous camera scrollscapes, mixed-media collage videos, or multi-style procedural films without diffusion artifacts.
---

# 5 Code-Driven Motion Graphics Skills Suite

This skill equips agents with five distinct code-driven motion graphics methodologies that render complex narrative videos directly through code and procedural canvas engines.

---

## The 5 Specialized Motion Paradigms

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. HyperFrames        Declarative HTML/CSS/SVG semantic scene markup   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. OneTake            Continuous unbroken camera flow & scrollscapes   │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Collage B-Roll     Mixed-media layered textures & parallax planes   │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Sprite Rigging     Procedural 8-bit / 2D character avatar physics   │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Lemo Opuscar       43 historical & cinematic procedural film styles │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Skill 1: HyperFrames (Semantic Scene Markup)

Transforms declarative tags into procedural SVG path animations and canvas transitions:

```html
<scene mood="dawn" duration="4s">
  <mountain peaks="3" color="#1E293B" />
  <mist drift="slow" opacity="0.4" />
  <sun rise duration="2.5s" color="#F59E0B" />
  <camera pan="right" speed="smooth" />
</scene>
```

---

## 2. Skill 2: OneTake (Unbroken Camera Flow)

Eliminates abrupt cutaways by maintaining an **unbroken, continuous camera trajectory**:
- **Trajectory Anchors:** A single visual focal element (e.g. falling leaf, paper airplane, digital data packet) descends through multiple vertical environments.
- **Continuous Coordinate Transformation:**
  ```javascript
  // Camera scroll position as a function of frame timeline
  const cameraY = interpolate(frame, [0, 150, 300, 450], [0, 1920, 3840, 5760], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1)
  });
  ```
- **Z-Index Layering:** Background parallax shifts at $0.3\times$, midground at $1.0\times$, and foreground debris at $1.6\times$ velocity.

---

## 3. Skill 3: Collage B-Roll (Mixed-Media Textures)

Combines multi-modal image generation with procedural CSS layering:
1. **Asset Generation:** Generates textured assets (torn-paper edges, halftone dot patterns, newsprint typography, vintage film grain).
2. **Layer Stacking & Stop-Motion Jitter:**
   - Elements animate at **12fps / 15fps** (stepped time) within a 60fps video container to emulate handcrafted physical paper stop-motion.
   - Rotations randomly oscillate within $[-2^\circ, +2^\circ]$ every 3 frames for authentic editorial print energy.

---

## 4. Skill 4: Character Sprite Rigging

Procedural bone and viseme manipulation for 2D character sprites:
- **Idle Breathing:** Sinusoidal chest scaling (`1.0 + Math.sin(frame * 0.1) * 0.03`).
- **Blinking Cycle:** Procedural eyelid trigger every $90 + \text{rand}(60)$ frames for 4 frames duration.
- **Audio-Reactive Mouth:** Viseme paths update based on input audio volume envelopes.

---

## 5. Skill 5: Lemo Opuscar (43 Cinematic Procedural Styles)

Renders historical film aesthetics programmatically without diffusion hallucinations:
- **Style Presets:** 1920s Silent Film (sepia, flicker, grain, vignette), 1960s Technicolor, 1980s VHS Synthwave, Blueprint Schematics, Cyberpunk HUD.
- **Deterministic Identity:** Character models remain 100% consistent across every frame because colors and vector geometries are mathematically pinned.

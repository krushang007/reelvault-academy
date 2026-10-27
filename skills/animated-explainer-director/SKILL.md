---
name: animated-explainer-director
description: Generates the 6 core 2D/3D animated motion explainer patterns (process flows, panning timelines, before/after wipes, detail zooms, hub-and-spoke maps, and 3D myth-flip cards). Use when creating commercial-grade explainer animations, video sales letters (VSLs), or interactive HTML/SVG animation artifacts.
---

# 6 Core Animated Explainer Video Patterns

This skill guides agents in generating commercial-grade ($1,000+ studio quality) animated explainer scenes as standalone HTML/CSS/SVG components or video storyboards.

---

## The 6 Explainer Patterns

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Process Flow        Sequential steps with rhythmic drawn arrows     │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Panning Timeline    Milestone dates revealed along a tracking line  │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Before/After Wipe   Horizontal split slider contrasting two states  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Detail Zoom Ring    3x camera punch into a single focal KPI card    │
├────────────────────────────────────────────────────────────────────────┤
│ 5. Hub & Spoke         Central engine connecting radiating services    │
├────────────────────────────────────────────────────────────────────────┤
│ 6. 3D Myth Flip        Spring-physics card alternating myth vs reality │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Pattern 1: Process Flow (Sequential Arrow Beats)

Best for workflows, deployment pipelines, and business algorithms:
- **Prompt Formula:** `Animate these [N] steps as a flow. Draw each arrow on its own beat.`
- **Animation Mechanics:**
  - Box 1 pops in via spring scale (`scale(0) -> scale(1)`).
  - SVG arrow draws using `stroke-dashoffset` path interpolation.
  - Box 2 pops in only after the arrow reaches its target anchor.

```css
/* Animated SVG Connector Line */
.connector-line {
  stroke-dasharray: 400;
  stroke-dashoffset: 400;
  animation: drawLine 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}
```

---

## Pattern 2: Panning Milestone Timeline

Best for company origin stories, product roadmaps, and historical progressions:
- **Prompt Formula:** `Animate these [N] dates on a timeline. Pan along as each one lands.`
- **Animation Mechanics:**
  - The viewport camera translates horizontally (`transform: translateX(-Xpx)`).
  - Milestone marker pin drops with bouncy elastic spring, followed by card fade-in.

---

## Pattern 3: Before / After Horizontal Wipe

Best for UI redesigns, performance improvements, and conversion comparisons:
- **Prompt Formula:** `Wipe from the old homepage to the new one, left to right, 2s.`
- **Animation Mechanics:**
  - Two overlapping full-bleed layers.
  - Top layer masked via CSS `clip-path: inset(0 0 0 [wipePercentage]%)`.
  - Contrasting labels (e.g. `BEFORE: 4.2s Load Time` vs `AFTER: 280ms Instant`).

---

## Pattern 4: Detail Zoom & Focus Highlight Ring

Best for dashboards, financial statements, and dense charts:
- **Prompt Formula:** `Start on the full dashboard, then zoom 3x into the [target] card.`
- **Animation Mechanics:**
  - Entire container transforms: `scale(3.0) translate(-targetX, -targetY)` over 1.2s.
  - Background elements blur slightly (`backdrop-filter: blur(2px)`).
  - A glowing highlight ring (`box-shadow: 0 0 0 4px #6366F1`) pulses around the target card.

---

## Pattern 5: Hub & Spoke Integration Diagram

Best for APIs, agent architectures, and third-party integrations:
- **Prompt Formula:** `Put [Core Engine] in the center. Connect [Service A, B, C, D] outwards.`
- **Animation Mechanics:**
  - Central node lands first with an outward pulse wave.
  - Spoke connector lines radiate outward in a circular clock sequence (0°, 90°, 180°, 270°).
  - Integration badge icons pop into position at spoke ends.

---

## Pattern 6: 3D Spring Myth-vs-Fact Card Flip

Best for scroll-stopping hooks and addressing customer objections:
- **Prompt Formula:** `Card flip: myth on the front, fact on the back, 1s spring.`
- **Animation Mechanics:**
  - CSS 3D perspective wrapper (`perspective: 1000px`).
  - Card face rotates 180° along Y-axis (`transform: rotateY(180deg)`).
  - Back face features vibrant green checkmark with bold factual statement.

```css
.flip-card {
  transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-style: preserve-3d;
}
.flip-card.flipped {
  transform: rotateY(180deg);
}
.flip-card-front, .flip-card-back {
  backface-visibility: hidden;
}
.flip-card-back {
  transform: rotateY(180deg);
}
```

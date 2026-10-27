---
name: programmatic-reels-engine
description: Autonomous script-to-video pipeline for batch generating short-form Instagram Reels, YouTube Shorts, and TikTok videos. Use when automating video creation, enforcing viral pacing rules (1.5s hook, 0.6s event frequency), or computing timeline motion-pulse scores.
---

# Programmatic Short-Form Reels Engine

This skill guides agents in orchestrating autonomous, high-retention vertical video creation using code-driven scene generators and algorithmic pacing rules.

---

## 1. Algorithmic Pacing Rules (Decoded Retention Formula)

To achieve high retention and avoid swipe-aways on Instagram Reels and TikTok:

1. **1.5-Second Hook Payoff:**
   - The core visual payoff, primary question, or surprising claim must land on screen within **$\le 1.5$ seconds**.
   - No introductory channel logos or lengthy greetings.
2. **0.6-Second Event Frequency:**
   - A visual event (camera snap, zoom punch, icon pop, card slide, or text highlight) must occur **every 0.6 seconds**.
   - Eliminates dead zones where nothing moves on screen.
3. **Kinetic Caption Sync:**
   - Subtitles display 1–3 words at a time, highlighted synchronously with speech audio.

---

## 2. The 4-Stage Autonomous Build Pipeline

```
[User Prompt: "Why does IKEA make you walk through the whole store?"]
                            │
                            ▼
[Stage 1: Script Generation]
  ── 45-60s conversational script with 1.5s hook and twist conclusion
                            │
                            ▼
[Stage 2: Voiceover Synthesis]
  ── High-fidelity neural TTS (ElevenLabs API / OpenAI TTS)
  ── Extracts word-level audio alignment timestamps
                            │
                            ▼
[Stage 3: Scene Assembly (Scene Library)]
  ── Style selection: Classic, 3D Explainer, or Illustrated
  ── Assembles layout cards, SVG diagrams, and zoom cues
                            │
                            ▼
[Stage 4: Automated Motion Heartbeat Evaluation & Render]
  ── Evaluates timeline motion score (Target: ≥ 7.2 / 10)
  ── Auto-inserts camera punches on flat spots
  ── Renders 1080x1920 MP4 via Headless Chromium / FFmpeg
```

---

## 3. Timeline Motion Heartbeat Scoring

Before rendering the final video, evaluate screen kinetic energy across the timeline:

```typescript
// evaluateMotionScore.ts
interface TimelineEvent {
  timeMs: number;
  type: 'zoom' | 'cut' | 'text_pop' | 'card_slide';
}

export function evaluateMotionScore(durationMs: number, events: TimelineEvent[]): {
  score: number;
  weakMoments: Array<{ startMs: number; endMs: number }>;
} {
  const maxAllowedDeadZoneMs = 1200; // Max 1.2s without visual changes
  const weakMoments = [];
  
  // Sort events chronologically
  const sorted = [...events].sort((a, b) => a.timeMs - b.timeMs);

  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1].timeMs - sorted[i].timeMs;
    if (gap > maxAllowedDeadZoneMs) {
      weakMoments.push({
        startMs: sorted[i].timeMs,
        endMs: sorted[i + 1].timeMs
      });
    }
  }

  // Score calculation (1.0 to 10.0 scale)
  const deadTimeTotal = weakMoments.reduce((acc, m) => acc + (m.endMs - m.startMs), 0);
  const deadTimeRatio = deadTimeTotal / durationMs;
  const score = Math.max(1.0, Math.min(10.0, Number((10 - deadTimeRatio * 15).toFixed(1))));

  return { score, weakMoments };
}
```

If `weakMoments` are detected, the agent automatically injects a `zoom_punch` ($1.15\times$ scale) or kinetic subtitle accent at the midpoint of the gap.

---

## 4. Scene DSL Definition (`reel.js`)

```javascript
import { scene, card, presenter, spring, audio } from '@reels/engine';

export default async function createReel() {
  const vo = await audio.load('voiceover.mp3');

  return [
    // Scene 1: Hook (0s - 2s)
    scene('hook', { duration: 2.0 })
      .background('#0B0C10')
      .add(card.title('The IKEA Gruen Effect').pop(spring.bouncy))
      .add(presenter.point('up', { delay: 0.4 })),

    // Scene 2: The Maze Mechanism (2s - 6s)
    scene('mechanism', { duration: 4.0 })
      .add(card.diagram('floor_plan.svg').draw({ duration: 1.2 }))
      .add(card.metric('+28% Impulse Buys').punch({ at: 2.5 }))
  ];
}
```

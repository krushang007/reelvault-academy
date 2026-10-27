---
name: remotion-automated-reels
description: Full-stack programmatic video pipeline using Claude Code, OpenAI TTS voiceover, Whisper word-level timestamps, and Remotion (React-to-video). Use when generating automated faceless reels, educational shorts, audio-reactive avatar animations, or deterministic MP4 exports.
---

# Remotion Programmatic Reels Engine

This skill guides agents in building and maintaining autonomous, code-driven video generation pipelines that compile React components (`TSX/SVG`), neural voiceovers, and Whisper timestamps into production-ready 9:16 vertical reels in ~15 minutes.

---

## 1. Architecture: Code-to-Video vs Diffusion

Generative diffusion models (Runway, Sora, Luma) suffer from hallucinated text, shifting typography, and non-reproducible motion. 

Remotion compiles **deterministic React code into video frames**:
- Exact font rendering and layout constraints.
- Frame-perfect audio synchronization.
- Identical code yields identical byte-for-byte MP4 exports.

---

## 2. The 5-Stage Agent Pipeline

```
[Topic Prompt: "How does Redis single-threading work?"]
        │
        ▼
[Stage 1: Research & Script Validation (Claude)]
        │ ── Cross-verified against official docs
        │ ── Generates episodes/ep01/script.txt
        ▼
[Stage 2: Voiceover Synthesis + Multi-Take Verification]
        │ ── OpenAI gpt-audio-1.5 (Cedar voice preset)
        │ ── Generates candidate takes (t1..t5)
        │ ── Validates via gpt-4o-transcribe to select clean audio
        ▼
[Stage 3: Whisper Word-Level Alignment]
        │ ── Extracts microsecond word offsets (words.json)
        ▼
[Stage 4: Audio-Reactive Lipsync Avatar (Avatar.tsx)]
        │ ── Computes audio amplitude envelope: env[frame]
        │ ── SVG mouth visemes scale dynamically with voice volume
        ▼
[Stage 5: Remotion Programmatic Composition (scenes.tsx)]
        │ ── Renders UI cards, stickers, and animated captions
        ▼
[Final 1080x1920 60fps MP4 Export]
```

---

## 3. Audio-Reactive Avatar Implementation (`Avatar.tsx`)

Mouth movement is generated procedurally from the audio waveform's amplitude envelope:

```tsx
// src/kit/Avatar.tsx
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface AvatarProps {
  audioEnvelope: number[]; // Array of volume levels per frame [0.0 - 1.0]
  characterColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ audioEnvelope, characterColor = '#4F46E5' }) => {
  const frame = useCurrentFrame();
  const volume = audioEnvelope[frame] || 0;

  // Calculate mouth height based on vocal intensity
  // Volume = 0 -> Mouth closed line
  // Volume > 0 -> Interpolated open oval viseme
  const mouthHeight = interpolate(volume, [0, 0.4, 0.8], [2, 18, 32], {
    extrapolateRight: 'clamp',
  });

  return (
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
      {/* Head */}
      <circle cx="120" cy="120" r="80" fill={characterColor} stroke="#0F172A" strokeWidth="6" />
      
      {/* Eyes */}
      <ellipse cx="95" cy="105" rx="7" ry="10" fill="#0F172A" />
      <ellipse cx="145" cy="105" rx="7" ry="10" fill="#0F172A" />

      {/* Reactive Mouth Viseme */}
      <path
        d={`M 90 145 C 90 ${145 + mouthHeight}, 150 ${145 + mouthHeight}, 150 145 Z`}
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="5"
      />
    </svg>
  );
};
```

---

## 4. Remotion Scene Composition (`scenes.tsx`)

```tsx
// src/scenes.tsx
import { Composition, Sequence, Audio, staticFile } from 'remotion';
import { Avatar } from './kit/Avatar';
import { KineticCaptions } from './kit/KineticCaptions';
import wordsData from '../public/words.json';
import envelopeData from '../public/envelope.json';

export const ReelComposition = () => {
  return (
    <div style={{ flex: 1, backgroundColor: '#0B0C10', position: 'relative' }}>
      {/* Background Audio */}
      <Audio src={staticFile('vo.wav')} />

      {/* Character Avatar */}
      <div style={{ position: 'absolute', bottom: 180, left: '50%', transform: 'translateX(-50%)' }}>
        <Avatar audioEnvelope={envelopeData} />
      </div>

      {/* Kinetic Animated Captions synchronized to Whisper timestamps */}
      <KineticCaptions words={wordsData} />
    </div>
  );
};
```

---

## 5. Automated Build Commands

```bash
# 1. Generate Voiceover and Timestamps
uv run python scripts/generate_vo.py --input episodes/ep01/script.txt

# 2. Extract Audio Amplitude Envelope
uv run python scripts/compute_envelope.py --audio public/vo.wav --output public/envelope.json

# 3. Preview Composition in Studio
npx remotion preview

# 4. Headless Render MP4
npx remotion render src/index.ts ReelComposition out/reel.mp4 --gl=angle
```

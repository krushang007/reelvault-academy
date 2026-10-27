---
name: stickman-video-director
description: Generate OverSimplified-style stick-figure historical, battle, and educational explainer animations using Google DeepMind's Veo 3 or generative video engines. Use when creating animated history shorts, science explainers, battle maps, comedic narrative scripts, or stickman storyboards.
---

# AI Stickman Video Director (Veo 3 & Explainer Animations)

This skill equips agents with domain knowledge, composition rules, character physics, and storyboarding techniques to generate viral, OverSimplified-style stick-figure educational videos.

---

## 1. Visual Composition & Character Physics Rules

Stick-figure explainers succeed on high contrast, immediate readability, and comedic kinetic timing:

1. **Ink & Outlines:**
   - Pure black (`#000000`) bold vector strokes (4px–8px relative weight).
   - Solid bone-white (`#FFFFFF`) or pale flesh fill for circular heads.
   - Minimalist dot eyes (`● ●`) with expressive, animated eyebrow slants (45° inward for aggression, inverted arc for panic).
2. **Body & Limbs:**
   - Clean linear limbs with visible joint elbows and knees during running/marching animations.
   - Never use realistic shading or gradients on characters; keep fills flat and graphic.
3. **Faction & Troop Markers:**
   - Factions identified via colored tricorn hats, shakos, helmets, or large colored division flags (e.g., Royal Blue for France, Scarlet Red for Britain, Forest Green for Russia).
4. **Environment & Background:**
   - Parchment paper or declassified blueprint textured canvas (`#F4EEDD` or `#1E293B`).
   - Tactical battle maps: Dotted arrows, encirclement arcs, and territory shading overlays.

---

## 2. Pacing & Narrative Structure

- **The 1.5s Hook:** Open directly in media res with high stakes or historical absurdity:
  > *"In 1804, one very short French general decided he was going to conquer all of Europe... and nobody could stop him."*
- **Comedic Beat Drops:** Punctuate historical blunders with deadpan pauses, exaggerated stick-figure collapses, or slapstick SFX cues.
- **Narrative Pacing:** Maintain rapid cutaways every 2.5–4.0 seconds per scene.

---

## 3. Dynamic Storyboard & Scene Schema

When instructed to create a stickman video on a topic, output the storyboard in structured format:

```json
{
  "project_title": "The War of the Third Coalition in 60 Seconds",
  "style_preset": "oversimplified_stickman_historical",
  "scenes": [
    {
      "scene_number": 1,
      "timestamp": "00:00 - 00:03",
      "visual_description": "Overhead tactical map of central Europe. Two stick-figure armies (Blue vs White) marching along dirt roads. Napoleon stickman standing on a hill with a giant telescope.",
      "camera_motion": "Slow zoom into Napoleon's face",
      "narration": "Austria and Russia thought they had the French Emperor surrounded.",
      "sfx_cue": "Military snare drum roll fading into a comical squeak",
      "veo_prompt": "2D animated flat minimalist stick figure general in a blue Napoleonic uniform looking through a brass telescope on a grassy hill, bold black ink outlines, clean vector style, parchment map background, cinematic lighting, high-definition 2D animation."
    },
    {
      "scene_number": 2,
      "timestamp": "00:03 - 00:07",
      "visual_description": "Napoleon smirks with exaggerated tilted eyebrows. Snaps fingers. 50 stick-figure soldiers with blue flags sprint across the river in double-time.",
      "camera_motion": "Fast pan right following marching infantry",
      "narration": "Little did they know, Napoleon was already behind them.",
      "sfx_cue": "Whoosh sound followed by hundreds of tiny galloping footsteps",
      "veo_prompt": "Fast-paced 2D animated stick figure soldiers marching in double time across a wooden bridge carrying blue flags, bold black ink line art, clean vector animation, OverSimplified art style, bright expressive character movement."
    }
  ]
}
```

---

## 4. Google DeepMind Veo 3 Synthesis Protocol

When triggering generative video generation:
1. **Aspect Ratio:**
   - Mobile Short / Reel: `9:16` (`1080x1920`).
   - Horizontal Documentary: `16:9` (`1920x1080`).
2. **Style Consistency Keywords:**
   Always append the negative and positive style anchors:
   - **Positive:** `OverSimplified cartoon aesthetic, 2D vector animation, solid black line art, minimalist facial expressions, vibrant primary uniform colors, fluid humorous movement, 60fps`.
   - **Negative:** `photorealistic, 3D CGI, complex shading, gritty realism, distorted faces, live action footage, blurry edges`.

---

## 5. Production Workflow Checklist

- [ ] Script vetted against historical/scientific source documents.
- [ ] Visual jokes timed to land synchronously with sound effects.
- [ ] Faction hats/colors strictly differentiated across all frames.
- [ ] Sub-scene durations kept under 5 seconds to maximize mobile audience retention.

---
name: meta-ads-architect
description: Meta Ads campaign architecture, creative testing matrix, and CAPI offline lead attribution. Use when building or optimizing paid advertising campaigns on Facebook/Instagram, setting up creative testing pipelines, configuring broad targeting, or automating pause/scale decision rules.
---

# Meta Ads Architecture & Creative Testing Playbook

This skill provides the structure, budget allocation models, and algorithmic decision rules required to test, validate, and scale paid acquisition on Meta (Facebook & Instagram) with predictable ROAS.

---

## 1. The Core Paradigm: Creative IS the Targeting

In modern Meta advertising (Advantage+ and broad algorithms), granular interest targeting (e.g. "people interested in web design and luxury watches") restricts machine learning efficiency and inflates CPMs:
- **Broad Advantage+ Setup:** Set targeting to broad (open age/location) with zero interest restrictions.
- **The Ad Creative Filters the Audience:** Visual hooks, on-screen text, and pain point callouts determine who clicks and converts.

---

## 2. The 5-Format Creative Testing Matrix

Within a single Ad Set, always test 5 distinct psychological buying triggers simultaneously:

1. **Ad 1 — High-Impact Static Image:** Clean visual showcasing the core product in use or a bold, high-contrast offer headline.
2. **Ad 2 — Multi-Card Carousel:** Showcases multiple SKUs, feature breakdowns, or step-by-step product walkthroughs.
3. **Ad 3 — Problem / Solution UGC Video:** User-generated style clip opening with the direct customer frustration in the first 3 seconds ($T \le 3\text{s}$).
4. **Ad 4 — Before / After Transformation:** Dramatic visual contrast demonstrating tangible, measurable customer transformation.
5. **Ad 5 — Social Proof / Testimonial:** Screenshot of an authentic customer review or video testimonial systematically dismantling top buying objections.

---

## 3. The Testing & Scaling Workflow

```
[Testing Campaign (ABO / Dedicated Budget)]
       │
       ▼
[Broad Ad Set (Advantage+ / Zero Interests)]
       │ ── 5 Creative Formats (Static, Carousel, UGC, Before/After, Testimonial)
       │
       ▼
[72-Hour Algorithmic Stabilization] ── Hands off! Do NOT pause early.
       │
       ▼
[Day 3–4 Performance Review]
       │
       ├─ Spent 2x–3x Target CPA with 0 Purchases? ──▶ [PAUSE IMMEDIATELY]
       │
       └─ Generated Purchases at or below Target CPA? ──▶ [GRADUATE TO SCALING]
                                                                │
                                                                ▼
                                   [Dedicated Scaling Campaign (CBO)]
                                   Scale budget +20% every 48–72 hours
```

---

## 4. Unemotional Decision Rules (Kill vs Scale)

- **The 72-Hour Rule:** Never touch, tweak, or prematurely kill an ad during its first 72 hours. Meta's delivery system experiences initial variance while testing impression clusters.
- **The Kill Rule:** If an individual ad spends **$2\times$ to $3\times$ target CPA** (e.g., target CPA is $25 and spend reaches $50–$75) with **0 conversions**, pause it immediately. Never "wait and hope".
- **The Scale Rule:** If an ad achieves conversions at or below target CPA:
  - Do NOT double or 5x the budget inside the testing campaign (this resets the learning phase).
  - Increase budget by **maximum 20% every 2 to 3 days**, OR graduate the winning Post ID into a dedicated scaling campaign.

---

## 5. Conversions API (CAPI) Offline Feedback Loop

For lead generation or multi-stage sales funnels, optimizing only for the initial form submit trains Meta to find low-quality "junk" form fillers.

```
[User Submits Lead Form on Web]
       │ ── Captures fbclid, client_user_agent, email
       ▼
[CRM / Sales Pipeline (HubSpot / Salesforce / PostgreSQL)]
       │
       ▼ [Sales Rep verifies lead: Qualified / Contract Signed ($5,000)]
       │
[Server-Side CAPI Offline Event] ── Dispatches event back to Meta Graph API
       │
[Meta Pixel Algorithm retrains on actual High-Value Qualified Customers]
```

### CAPI Offline Event Dispatch Example (Node.js):

```typescript
import axios from 'axios';
import crypto from 'crypto';

export async function sendOfflineConversion(lead: {
  email: string;
  phone?: string;
  value: number;
  currency: string;
  fbclid?: string;
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  // Hash PII with SHA256 per Meta requirements
  const hash = (val: string) => crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');

  const payload = {
    data: [
      {
        event_name: 'LeadQualified',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'system_generated',
        user_data: {
          em: [hash(lead.email)],
          ph: lead.phone ? [hash(lead.phone)] : undefined,
          fbc: lead.fbclid ? `fb.1.${Date.now()}.${lead.fbclid}` : undefined
        },
        custom_data: {
          currency: lead.currency,
          value: lead.value
        }
      }
    ]
  };

  await axios.post(
    `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
    payload
  );
}
```

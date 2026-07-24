# Portfolio Redesign — "Engineering Dossier" (LinkedIn-shaped, monochrome)

**Date:** 2026-07-24
**Owner:** Mohammed Safwanul Islam
**File:** `poerfoli0/index.html` (single, self-contained, no build step)

## Goal

Replace the current dark-neon "AI-generated-looking" portfolio with a distinctive,
human-designed page that reads like a beautifully art-directed version of a LinkedIn
profile, and spotlights the PreCognise engineering work.

## Decisions (approved)

- **Palette:** true white `#FFFFFF` background, near-black ink `#0A0A0A`, ONE electric-blue
  accent (`#1F35FF`) used sparingly (links, contact button, pipeline diagram, small markers).
  Literal "black & white + one color"; a nod to Precognise's indigo without copying it.
- **Type:** single grotesque superfamily **Archivo** (weight + width contrast). No serif,
  no monospace-as-costume. Deliberately avoids the "editorial-typographic" AI slop lane
  (Fraunces/Inter/numbered eyebrows/cream) that the first proposal fell into.
- **Structure:** LinkedIn profile information architecture rendered as a Swiss engineering
  dossier — header (banner + B&W portrait + headline + top-right vCard button), About,
  Featured (PreCognise spotlight + two repo cards), Experience timeline, Skills, Education
  & Certifications, Scouting, Contact.
- **Title:** blended — "AI & Product Engineer @ PreCognise · building AI job-matching at scale"
  (matches LinkedIn; the old "Co-Founder & CSO" claim is dropped as it contradicts LinkedIn).
- **Contact:** sticky **top-right** `＋ Add to contacts` button on every screen → downloads a
  `.vcf` with photo, name, title, phone, email, LinkedIn, precognise.co. Pure client-side
  (Blob + object URL); works offline. Mobile-first (the reason it's top-right).
- Drop the LinkedIn "Open to work in KL" banner (per user).
- **Content:** all sections kept, enriched with real content pulled from
  linkedin.com/in/safwandotcom (headline, PreCognise eng bullets + stack, full experience
  timeline, Showaround guide, Scouting progression).

## Featured spotlight (the highlight)

- **PreCognise** flagship block with a custom monochrome **SVG schematic** of the semantic
  matching pipeline: candidate/job → OpenAI embedding → pgvector cosine similarity +
  multi-signal keyword scorer → hybrid ranking (early-career aware).
- **Precognize** repo card — the matching engine (Next.js 15 · TS · Prisma · Postgres ·
  pgvector · OpenAI · Inngest · NextAuth · Supabase). "View on GitHub" link — user to supply
  URL; placeholder left if not provided.
- **Precognise-Assess-Inc** repo card — assessment infrastructure at scale. Same treatment.

## Non-goals / bans (self-imposed)

No neon, glass, orbs, gradient text, emoji icons, mono labels, `01/02` section numbers,
tiny uppercase eyebrows above every heading, or identical icon-card grids.

## Motion

Orchestrated hero load (name), restrained per-section reveals that enhance already-visible
content, full `prefers-reduced-motion` fallback (instant/crossfade).

## Verification

Browser screenshots at desktop (~1440) and mobile (~390) widths; contrast ≥4.5:1 body;
sticky button reachable on mobile; vCard imports on a phone; keyboard nav; no horizontal
scroll.

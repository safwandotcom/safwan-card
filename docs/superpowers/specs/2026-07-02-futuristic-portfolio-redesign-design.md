# Futuristic Portfolio Redesign — Design Spec

## Overview

Redesign the existing single-file personal portfolio (`index.html`) for Mohammed Safwanul Islam from its current dark violet/lime/multi-accent theme into a more distinctive, futuristic, Gen-Z-coded "creative professional" site. The site must feel visually alive — reacting to cursor movement and scroll position — while remaining instantly legible: a first-time visitor should understand who he is and what PreCognise does within seconds of landing, without the motion/visual layer getting in the way of the message.

Reference inspiration: venturesouq.com's disciplined dark, high-contrast, editorial tone (bold oversized type, minimal chrome, sophisticated restraint) — adapted with a more energetic, futuristic, Gen-Z visual vocabulary (glow, glass, gradient, motion) rather than copied directly.

## Goals

- Keep the site a single static `index.html` file (no build tools, no framework, no external JS dependencies) — consistent with current architecture.
- Preserve all existing content and section structure (Hero, About, Skills, Experience, PreCognise, Education, Scouting, Contact) and existing data (stats, bios, links). This is a visual/interaction redesign, not a content rewrite — copy edits are limited to adding short one-line plain-language explainers per section (see "Clarity layer").
- Deliver two motion pillars: cursor-reactive motion and scroll-reactive motion, described below.
- Keep the result performant and accessible: animations use only `transform`/`opacity`, honor `prefers-reduced-motion`, and the page remains usable with mouse, touch, and keyboard.

## Non-Goals

- No backend/CMS, no build pipeline, no page routing/multi-page site.
- No rewriting of bios/experience copy beyond adding short one-line section explainers.
- No changing the contact form's `mailto:` behavior.
- Not attempting pixel-parity with venturesouq.com — it's a tonal reference only.

## Visual Direction

- **Base palette:** near-black background retained (deepened slightly from current `#080c14`) for contrast and a premium/techy feel.
- **Accent system:** consolidate the current six-color accent set (violet, lime, amber, cyan, pink, emerald) down to a primary violet→cyan→pink holographic gradient used for emphasis (headline gradient text, glow borders, gradient buttons), with lime retained only as the single "status" accent (e.g. the "open to work" indicator dot). Amber/emerald/pink as flat solid accents are dropped in favor of the gradient system.
- **Surfaces:** section cards and stat tiles become glassmorphic — semi-transparent panels with backdrop blur and a subtle glowing gradient border, replacing the current flat `--bg2`/`--bg3` panels.
- **Background texture:** a faint animated grid/circuit-line texture sits behind sections at low opacity, plus 2-3 large soft gradient "orbs" that slowly drift and subtly shift position in response to cursor movement (parallax-by-mouse), reinforcing the futuristic feel without being distracting.
- **Typography:** keep the existing font stack (`Syne` display, `Space Grotesk` body, `JetBrains Mono` labels) — it already fits the direction. Push headline sizing further and introduce kinetic reveal (see Motion) rather than static fade-up.
- **Badges/labels:** small pill/sticker-style badges (e.g. "OPEN TO WORK", "CO-FOUNDER & CSO") replace plain mono-text labels, styled with a glow outline.

## Layout Changes

- **Stats row → bento grid:** the current uniform 4-column hero stats row becomes an asymmetric bento grid (one larger "hero" stat tile, remaining stats in smaller tiles of varying size). Same four stat values/labels, no new data.
- **Skills section:** presented as a bento grid of glass cards instead of a uniform list/grid, grouping skills so card sizes vary by category weight.
- All other sections (About, Experience, PreCognise, Education, Scouting, Contact) keep their current one-column/two-column structural layout, restyled with the new glass/gradient visual system.

## Clarity Layer

Every major section retains its existing headline but gains one short plain-language sub-line beneath it, so the section's purpose is legible independent of the visual styling. Examples (final copy to be refined during implementation, meaning must stay accurate to existing content):

- PreCognise section: "AI that matches graduates to jobs."
- Skills section: a one-line summary of what the skill set enables.
- Experience section: keep existing role/impact copy as-is; no explainer needed since entries are already concrete.

CTAs remain explicit text (e.g. "See my work", "Get in touch") — no icon-only or ambiguous CTAs.

## Motion System

### Pillar 1 — Cursor-reactive

1. **Custom cursor:** a small ring that trails the real pointer with eased movement (lerp toward pointer position each frame), rendered via a fixed-position element updated in a `requestAnimationFrame` loop. Scales up and changes glow intensity when hovering interactive elements (links, buttons, cards).
2. **Cursor spotlight:** a soft radial gradient glow positioned at the cursor coordinates, layered behind glass cards, so nearby cards appear subtly lit as the cursor passes over them.
3. **Magnetic buttons:** primary CTA buttons shift a few pixels toward the cursor when the cursor is within a threshold radius, easing back to rest when the cursor leaves.
4. **Cursor-parallax orbs:** the background gradient orbs shift slightly opposite/with cursor movement (subtle, low-amplitude) for a sense of depth.
5. **Card tilt:** bento/glass cards apply a small 3D perspective tilt toward the cursor position while hovered (CSS `transform: perspective(...) rotateX/rotateY(...)`, driven by mouse position relative to the card).

### Pillar 2 — Scroll-reactive

1. **Scroll-progress bar:** a thin fixed bar at the very top of the viewport that fills left-to-right proportional to scroll position through the page.
2. **Parallax hero watermark:** the existing large background name watermark in the hero moves at a different rate than the foreground content as the user scrolls (kept subtle).
3. **Kinetic headline reveal:** section headlines animate in via staggered word/line reveal with a brief glow-pulse as each enters the viewport, replacing the current simple fade-up-on-`.reveal` behavior. Implemented as an extension of the existing `IntersectionObserver` pattern (wrap headline words in spans, stagger their transition-delay).
4. **Count-up stats:** the bento stat numbers animate from 0 up to their target value when they first scroll into view (via the existing `IntersectionObserver`, triggering a numeric `requestAnimationFrame` tween).
5. **Signature pinned moment:** the PreCognise section gets one pinned/sticky scroll transition (the section content stays fixed briefly while its feature cards animate in sequence as the user continues scrolling) — the single "wow" moment of the page, intentionally not repeated elsewhere so it doesn't feel gimmicky.

### Accessibility & Performance Constraints

- All motion effects check `prefers-reduced-motion: reduce` at load; when set, disable the custom cursor, orb drift, parallax, tilt, and pinned-scroll effect, and replace kinetic reveals / count-ups with the current simple fade-up / instant-value behavior.
- Custom cursor must not remove usability for keyboard-only navigation — focus states remain visible independent of the cursor visuals, and the custom cursor itself is purely decorative (the native cursor is hidden only on pointer/mouse devices, never on touch).
- All animated properties are restricted to `transform`, `opacity`, and `filter` to stay GPU-accelerated; no animating `width`/`height`/`top`/`left` layout properties.
- Cursor-following effects run in a single shared `requestAnimationFrame` loop (not one listener per effect) to avoid layout thrash.

## Technical Approach

- Single `index.html` file, vanilla CSS + vanilla JS, no external JS libraries or build step — consistent with the current file.
- Existing `IntersectionObserver`-based reveal system is extended (not replaced) to support the new kinetic/count-up/pinned behaviors.
- New CSS custom properties added for the gradient/glow system, layered under the existing `:root` variable block.
- Existing `sendMail()` contact-form behavior, nav active-section highlighting, and all content/copy/links are carried over unchanged except for the new one-line section explainers.

## Success Criteria

- Page still functions as a single static HTML file openable directly in a browser, no console errors.
- All existing content (bios, stats, experience entries, education, links, contact form) is present and accurate after redesign.
- Cursor movement visibly affects at least: custom cursor, spotlight glow, magnetic buttons, card tilt, background orb drift.
- Scrolling visibly triggers at least: progress bar, hero parallax, kinetic headline reveal, count-up stats, and the PreCognise pinned moment.
- With `prefers-reduced-motion: reduce` simulated, the page remains fully readable/usable with motion effects suppressed.
- A first-time reader can state who the site is about and what PreCognise does after a quick scan, without needing to decode the visual styling.

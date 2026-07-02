# Futuristic Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle and add cursor/scroll motion to `index.html` (the personal portfolio for Mohammed Safwanul Islam) per `docs/superpowers/specs/2026-07-02-futuristic-portfolio-redesign-design.md`, without changing its content or its single-static-file architecture.

**Architecture:** Everything lives in the existing single `index.html` file. New CSS is appended inside the existing `<style>` block; new behavior is appended inside the existing `<script>` block, built around one shared `requestAnimationFrame` loop that broadcasts eased pointer position via a custom `pointerease` event so every cursor-reactive feature subscribes to one loop instead of running its own.

**Tech Stack:** Vanilla HTML/CSS/JS only. No build step, no npm packages, no external JS libraries.

## Global Constraints

- Single static `index.html` file — no build tools, no framework, no external JS dependencies (per spec).
- All existing content, copy, links, stats, and the `sendMail()` contact behavior must remain unchanged, except the one new PreCognise tagline line specified in Task 13.
- Continuous, per-frame animations (cursor tracking, RAF loops, scroll-driven updates, orb drift, parallax) must animate only `transform`, `opacity`, and `filter` — never `width`/`height`/`top`/`left`/other layout properties — to stay GPU-accelerated.
- Discrete, one-off hover transitions (e.g. a `:hover` border-color or width/height change that fires only on pointer enter/leave, not every frame) may use other properties — this matches existing patterns already in the file (e.g. `.pill:hover{border-color:...}`) and is not a per-frame cost.
- Every cursor/motion feature must check `REDUCE_MOTION` (from `prefers-reduced-motion: reduce`) and `FINE_POINTER` (from `pointer: fine`) before activating — see Task 2. Touch/coarse-pointer devices and reduced-motion users must get the plain, static layout with the existing simple fade-up reveal only.
- Follow the file's existing compact CSS style (one declaration block per rule, `var(--token)` references, kebab-case class names prefixed per section, e.g. `.hs`, `.sk-`, `.exp-`).

---

### Task 1: Design tokens for the glow/gradient/glass system

**Files:**
- Modify: `index.html` — inside the `:root{...}` block (currently lines 22-43, ends with `--emerald:  #10b981;` before the `--mono:` line).

**Interfaces:**
- Produces: CSS custom properties `--glow-grad`, `--glass-bg`, `--glass-border`, `--glass-blur`, `--orb-a`, `--orb-b`, `--orb-c`, `--ease` — consumed by Tasks 3, 6, 7, 8, 9, 12, 13.

- [ ] **Step 1: Confirm the tokens don't already exist**

Run: `grep -c "glow-grad" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the new tokens**

Edit the `:root` block so it reads (inserting the new lines directly after `--emerald:  #10b981;` and before `--mono: 'JetBrains Mono', monospace;`):

```css
  --emerald:  #10b981;

  --glow-grad: linear-gradient(120deg, var(--violet2) 0%, var(--cyan) 50%, var(--pink) 100%);
  --glass-bg:     rgba(255,255,255,.035);
  --glass-border: rgba(255,255,255,.09);
  --glass-blur:   14px;
  --orb-a: rgba(159,103,255,.35);
  --orb-b: rgba(6,182,212,.28);
  --orb-c: rgba(236,72,153,.22);
  --ease:  cubic-bezier(.16,.84,.44,1);

  --mono: 'JetBrains Mono', monospace;
```

- [ ] **Step 3: Verify**

Run: `grep -c "glow-grad" "index.html"`
Expected: `1` (or more once later tasks reference it)

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "style: add glow/glass design tokens"
```

---

### Task 2: Reduced-motion flag and shared pointer-easing loop

**Files:**
- Modify: `index.html` — inside the existing `<script>` block, immediately after the opening `<script>` tag (currently line 887) and before the existing `const obs=new IntersectionObserver...` line.

**Interfaces:**
- Produces: `REDUCE_MOTION` (boolean), `FINE_POINTER` (boolean), `pointer` (`{x,y}` object updated on every `pointermove`), and a `pointerease` `CustomEvent` dispatched on `document` every animation frame with `detail:{x,y}` holding the eased position. Consumed by Tasks 3, 4, 5, 6, 9, 10.

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "REDUCE_MOTION" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the flags and shared loop**

Insert immediately after `<script>`:

```js
<script>
const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER  = window.matchMedia('(pointer: fine)').matches;
const MOTION_ON = FINE_POINTER && !REDUCE_MOTION;

const pointer = {x:innerWidth/2, y:innerHeight/2};
const eased   = {x:innerWidth/2, y:innerHeight/2};

if(MOTION_ON){
  document.body.classList.add('has-fine-pointer');
  window.addEventListener('pointermove', e=>{ pointer.x=e.clientX; pointer.y=e.clientY; }, {passive:true});
  (function pointerLoop(){
    eased.x += (pointer.x-eased.x)*.15;
    eased.y += (pointer.y-eased.y)*.15;
    document.dispatchEvent(new CustomEvent('pointerease',{detail:{x:eased.x,y:eased.y}}));
    requestAnimationFrame(pointerLoop);
  })();
}

const obs=new IntersectionObserver(entries=>{
```

(The final line above is the existing line already in the file — it now simply follows the new block instead of following `<script>` directly.)

- [ ] **Step 3: Verify**

Run: `grep -c "pointerease" "index.html"`
Expected: `1`

Open `index.html` in a browser (PowerShell: `Start-Process index.html`) and check DevTools console — expect zero errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add reduced-motion flag and shared pointer-easing loop"
```

---

### Task 3: Custom cursor + spotlight glow

**Files:**
- Modify: `index.html` — HTML right after `<body>` (line 526), CSS right before `</style>` (line 524, after `::placeholder{color:var(--dim)}`), JS inside `<script>` after the block added in Task 2.

**Interfaces:**
- Consumes: `MOTION_ON`, `pointer`, `pointerease` event (Task 2).
- Produces: `.cursor-dot`, `.cursor-ring`, `.cursor-spot` elements other tasks may target for hover-state classes (Task 5 adds `.hover` toggling via the same elements list).

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "cursor-dot" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the HTML**

Right after `<body>`:

```html
<body>

<div class="cursor-spot" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"></div>
<div class="cursor-dot" aria-hidden="true"></div>
```

- [ ] **Step 3: Add the CSS**

Right before the closing `</style>`, after `::placeholder{color:var(--dim)}`:

```css
body.has-fine-pointer,body.has-fine-pointer a,body.has-fine-pointer button{cursor:none}
.cursor-dot,.cursor-ring,.cursor-spot{position:fixed;top:0;left:0;pointer-events:none;z-index:9999}
.cursor-dot{width:6px;height:6px;border-radius:50%;background:var(--violet2);transform:translate(-50%,-50%)}
.cursor-ring{width:32px;height:32px;border-radius:50%;border:1px solid rgba(159,103,255,.5);transform:translate(-50%,-50%);transition:width .25s var(--ease),height .25s var(--ease),border-color .25s var(--ease)}
.cursor-ring.hover{width:56px;height:56px;border-color:rgba(6,182,212,.7)}
.cursor-spot{width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(159,103,255,.10),transparent 70%);transform:translate(-50%,-50%)}
@media(pointer:coarse){.cursor-dot,.cursor-ring,.cursor-spot{display:none}}
```

- [ ] **Step 4: Add the JS**

Inside `<script>`, after the Task 2 block (before `const obs=new IntersectionObserver...`):

```js
if(MOTION_ON){
  const cDot=document.querySelector('.cursor-dot');
  const cRing=document.querySelector('.cursor-ring');
  const cSpot=document.querySelector('.cursor-spot');
  document.addEventListener('pointerease', e=>{
    const {x,y}=e.detail;
    cDot.style.transform =`translate3d(${pointer.x}px,${pointer.y}px,0) translate(-50%,-50%)`;
    cRing.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
    cSpot.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
  });
}
```

- [ ] **Step 5: Verify**

Run: `grep -c "cursor-dot" "index.html"`
Expected: `2` or more (HTML + CSS + JS references)

Open in browser, move the mouse: a small violet dot tracks the cursor exactly, a ring trails it with a slight lag, and a soft glow follows underneath. On a touch device or with reduced motion, none of this appears and the native cursor still works.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add custom cursor and spotlight glow"
```

---

### Task 4: Magnetic buttons

**Files:**
- Modify: `index.html` — CSS near the existing `.btn-p`/`.btn-o` rules (lines 152-167) and JS inside `<script>`.

**Interfaces:**
- Consumes: `MOTION_ON`, `pointer`, `pointerease` event (Task 2).

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "magnets" "index.html"`
Expected: `0`

- [ ] **Step 2: Add a transition for the magnetic transform**

Modify the existing `.btn-p` and `.btn-o` rules to include `transform` in their transition list (they currently animate `background,transform` and `border-color,background` respectively — add `transform` to `.btn-o` and confirm `.btn-p` already has it):

```css
.btn-p:hover{background:#6d28d9;transform:translateY(-2px)}
.btn-o:hover{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.04)}
```

stay as-is (no change needed — they already transition `transform`/`background`/`border-color` at the class level via the base `.btn-p{...transition:background .2s,transform .15s}` and `.btn-o{...transition:border-color .2s,background .2s}` rules). Add `transform .15s var(--ease)` to `.btn-o`'s transition list so its magnetic pull is smooth too:

```css
.btn-o{
  font-family:var(--body);font-weight:500;font-size:.85rem;
  background:transparent;color:var(--text);
  padding:.8rem 2rem;border-radius:8px;text-decoration:none;
  border:1px solid var(--border);
  transition:border-color .2s,background .2s,transform .15s var(--ease);
}
```

- [ ] **Step 3: Add the JS**

Inside `<script>`, after the Task 3 block:

```js
if(MOTION_ON){
  const magnets=document.querySelectorAll('.btn-p,.btn-o,.nav-cta,.pre-cta');
  const MAG_RADIUS=90, MAG_STRENGTH=14;
  document.addEventListener('pointerease', ()=>{
    magnets.forEach(m=>{
      const r=m.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      const dx=pointer.x-cx, dy=pointer.y-cy;
      const dist=Math.hypot(dx,dy);
      if(dist<MAG_RADIUS){
        const pull=(1-dist/MAG_RADIUS)*MAG_STRENGTH;
        m.style.transform=`translate(${(dx/dist||0)*pull}px, ${(dy/dist||0)*pull}px)`;
      } else {
        m.style.transform='';
      }
    });
  });
}
```

Note: while the cursor is within the magnet radius, this inline `transform` takes precedence over the CSS `:hover{transform:translateY(-2px)}` lift — the button gets pulled toward the cursor instead of lifting. This is the intended trade-off (magnetic pull is the more prominent effect close-up).

- [ ] **Step 4: Verify**

Run: `grep -c "magnets" "index.html"`
Expected: `1`

Open in browser, move the cursor near "Let's connect →", "View work", "Get in touch", and "Visit precognise.co →" — each nudges a few pixels toward the cursor and eases back when the cursor moves away.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add magnetic pull to buttons and CTAs"
```

---

### Task 5: 3D tilt on cards

**Files:**
- Modify: `index.html` — JS inside `<script>`, plus reusing the `.cursor-ring` hover toggle from Task 3.

**Interfaces:**
- Consumes: `MOTION_ON` (Task 2), `.cursor-ring` element (Task 3).

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "tiltEls" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the JS**

Inside `<script>`, after the Task 4 block:

```js
if(MOTION_ON){
  const tiltEls=document.querySelectorAll('.hs,.sc-stat,.sk-cell,.exp-item,.ps,.feat,.edu-card,.proj,.cert,.c-link');
  const cRing=document.querySelector('.cursor-ring');
  tiltEls.forEach(el=>{
    el.addEventListener('pointerenter', ()=>{ if(cRing) cRing.classList.add('hover'); });
    el.addEventListener('pointerleave', ()=>{
      if(cRing) cRing.classList.remove('hover');
      el.style.transform='';
    });
    el.addEventListener('pointermove', e=>{
      const r=el.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-.5;
      const py=(e.clientY-r.top)/r.height-.5;
      el.style.transform=`perspective(600px) rotateX(${py*-6}deg) rotateY(${px*6}deg)`;
    });
  });
}
```

- [ ] **Step 3: Verify**

Run: `grep -c "tiltEls" "index.html"`
Expected: `1`

Open in browser, hover slowly over a hero stat tile, a skill cell, and an experience row — each tilts slightly toward the cursor and the custom cursor ring grows; moving off resets it flat.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add cursor-driven 3D tilt to cards"
```

---

### Task 6: Cursor-parallax background orbs

**Files:**
- Modify: `index.html` — HTML after `<body>` (Task 3's insertions), CSS before `</style>`, JS inside `<script>`.

**Interfaces:**
- Consumes: `MOTION_ON`, `pointerease` event (Task 2), `--orb-a/b/c` tokens (Task 1).

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "orb-wrap" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the HTML**

Right after `<body>`, before the cursor elements added in Task 3:

```html
<body>

<div class="orb-wrap orb-wrap-a" aria-hidden="true"><div class="orb orb-a"></div></div>
<div class="orb-wrap orb-wrap-b" aria-hidden="true"><div class="orb orb-b"></div></div>
<div class="orb-wrap orb-wrap-c" aria-hidden="true"><div class="orb orb-c"></div></div>

<div class="cursor-spot" aria-hidden="true"></div>
<div class="cursor-ring" aria-hidden="true"></div>
<div class="cursor-dot" aria-hidden="true"></div>
```

- [ ] **Step 3: Add the CSS**

Before `</style>`, after the Task 3 cursor rules:

```css
.orb-wrap{position:fixed;top:0;left:0;width:0;height:0;z-index:0;pointer-events:none;transition:transform .4s var(--ease)}
.orb{position:absolute;border-radius:50%;filter:blur(60px);opacity:.55;will-change:transform}
.orb-a{width:420px;height:420px;top:-120px;left:-100px;background:var(--orb-a);animation:orbdrift 22s ease-in-out infinite}
.orb-b{width:360px;height:360px;top:40vh;left:calc(100vw - 220px);background:var(--orb-b);animation:orbdrift 28s ease-in-out infinite reverse}
.orb-c{width:300px;height:300px;top:calc(100vh - 200px);left:30vw;background:var(--orb-c);animation:orbdrift 25s ease-in-out infinite}
@keyframes orbdrift{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,30px)}}
nav,.hero,.ticker-wrap,section,footer{position:relative;z-index:1}
```

- [ ] **Step 4: Add the JS**

Inside `<script>`, after the Task 5 block:

```js
if(MOTION_ON){
  const orbWraps=document.querySelectorAll('.orb-wrap');
  document.addEventListener('pointerease', e=>{
    const {x,y}=e.detail;
    const nx=(x/innerWidth-.5), ny=(y/innerHeight-.5);
    orbWraps.forEach((w,i)=>{ w.style.transform=`translate(${nx*(i+1)*14}px, ${ny*(i+1)*14}px)`; });
  });
}
```

- [ ] **Step 5: Verify**

Run: `grep -c "orbdrift" "index.html"`
Expected: `1`

Open in browser: three large soft blurred color shapes are visible behind the content, slowly drifting on their own, and shift slightly as the mouse moves across the page. `nav,.hero,.ticker-wrap,section,footer{position:relative;z-index:1}` must keep every section's content above the orbs — confirm text is still fully legible everywhere.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add drifting cursor-parallax background orbs"
```

---

### Task 7: Glassmorphic cards + glowing badges

**Files:**
- Modify: `index.html` — CSS, appended right before `/* ── RESPONSIVE ── */` (currently line 508).

**Interfaces:**
- Consumes: `--glass-bg`, `--glass-border`, `--glass-blur` tokens (Task 1).

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "GLASS SYSTEM" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the CSS**

Right before `/* ── RESPONSIVE ── */`:

```css
/* ── GLASS SYSTEM ── */
.hs,.sc-stat,.sk-cell,.exp-item,.ps,.feat,.edu-card,.proj,.cert,.c-link,.sb{
  background:var(--glass-bg);
  backdrop-filter:blur(var(--glass-blur));
  -webkit-backdrop-filter:blur(var(--glass-blur));
  border-color:var(--glass-border);
}
.hero-status,.exp-badge,.hero-chip,.atag,.etag{
  box-shadow:0 0 0 1px rgba(159,103,255,.25),0 0 16px rgba(159,103,255,.18);
}
```

These rules appear later in the stylesheet than the original `.hs{background:var(--bg2)...}` etc. declarations, so — at equal selector specificity — they win in the cascade and override the flat backgrounds with the glass look, without editing every original rule.

- [ ] **Step 3: Verify**

Run: `grep -c "GLASS SYSTEM" "index.html"`
Expected: `1`

Open in browser: hero stat tiles, skill cells, experience rows, PreCognise stats/feature cards, education/project/cert rows, and contact links all show a translucent, blurred "glass" surface instead of a flat panel; status/experience/skill/education badges show a soft violet glow outline.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "style: apply glassmorphic surfaces and glow badges"
```

---

### Task 8: Scroll-progress bar

**Files:**
- Modify: `index.html` — HTML after `<body>`, CSS before `</style>`, JS inside `<script>`.

**Interfaces:**
- Consumes: `--glow-grad` token (Task 1).

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "scroll-progress" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the HTML**

Right after `<body>`, before the orb elements from Task 6:

```html
<body>

<div class="scroll-progress" aria-hidden="true"><div class="scroll-progress-bar"></div></div>

<div class="orb-wrap orb-wrap-a" aria-hidden="true"><div class="orb orb-a"></div></div>
```

- [ ] **Step 3: Add the CSS**

Before `</style>`, after the Task 6 orb rules:

```css
.scroll-progress{position:fixed;top:0;left:0;right:0;height:3px;z-index:1000;background:rgba(255,255,255,.05)}
.scroll-progress-bar{height:100%;width:100%;transform:scaleX(0);transform-origin:0 0;background:var(--glow-grad);transition:transform .1s linear}
```

- [ ] **Step 4: Add the JS**

Inside `<script>`, after the Task 6 block:

```js
const progressBar=document.querySelector('.scroll-progress-bar');
window.addEventListener('scroll', ()=>{
  const h=document.documentElement;
  const pct=h.scrollTop/(h.scrollHeight-h.clientHeight);
  progressBar.style.transform=`scaleX(${pct})`;
},{passive:true});
```

This bar always runs (not gated behind `MOTION_ON`) since it's a simple, cheap, accessibility-neutral scroll indicator, not a cursor/parallax effect.

- [ ] **Step 5: Verify**

Run: `grep -c "scroll-progress" "index.html"`
Expected: `3` (HTML wrapper + inner bar class + CSS rule reuse)

Open in browser, scroll from top to bottom: a thin gradient bar at the very top of the viewport fills left-to-right in proportion to scroll position, reaching full width at the page bottom.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add scroll-progress bar"
```

---

### Task 9: Hero parallax + kinetic headline reveal

**Files:**
- Modify: `index.html` — CSS before `</style>`, JS inside `<script>`.

**Interfaces:**
- Consumes: `REDUCE_MOTION` (Task 2), `--ease` (Task 1), the existing `.reveal`/`.in` IntersectionObserver mechanism (already in the file).
- Produces: `.kw` (kinetic word) spans wrapping the text of every `.kicker` and `.sec-h` element.

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "splitWords" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the CSS**

Before `</style>`, after the Task 8 rules:

```css
.kw{display:inline-block;opacity:0;filter:blur(6px);transform:translateY(14px);transition:opacity .5s var(--ease),transform .5s var(--ease),filter .5s var(--ease)}
.reveal.in .kw{opacity:1;filter:blur(0);transform:translateY(0)}
@keyframes kwglow{0%{text-shadow:0 0 0 rgba(159,103,255,0)}40%{text-shadow:0 0 16px rgba(159,103,255,.55)}100%{text-shadow:0 0 0 rgba(159,103,255,0)}}
.reveal.in .kw{animation:kwglow .8s var(--ease) forwards}
```

- [ ] **Step 3: Add the JS**

Inside `<script>`, after the Task 8 block, and **before** the existing `const obs=new IntersectionObserver(...)` line (the word-splitting must happen before that observer starts watching `.reveal` elements, so the `.kw` spans already exist when `.in` gets added):

```js
function splitWords(root){
  const walk=(node)=>{
    Array.from(node.childNodes).forEach(child=>{
      if(child.nodeType===3 && child.textContent.trim()){
        const frag=document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part=>{
          if(part.trim()===''){ frag.appendChild(document.createTextNode(part)); }
          else{ const span=document.createElement('span'); span.className='kw'; span.textContent=part; frag.appendChild(span); }
        });
        child.replaceWith(frag);
      } else if(child.nodeType===1 && child.tagName!=='BR'){
        walk(child);
      }
    });
  };
  walk(root);
  root.querySelectorAll('.kw').forEach((w,i)=>{
    w.style.transitionDelay = w.style.animationDelay = (i*35)+'ms';
  });
}
if(!REDUCE_MOTION){
  document.querySelectorAll('.kicker,.sec-h').forEach(splitWords);
}

if(!REDUCE_MOTION){
  const watermark=document.querySelector('.hero-watermark');
  window.addEventListener('scroll', ()=>{
    watermark.style.transform=`translateY(${window.scrollY*.15}px)`;
  }, {passive:true});
}
```

- [ ] **Step 4: Verify**

Run: `grep -c "splitWords" "index.html"`
Expected: `2`

Open in browser and scroll through each section: kicker labels and headlines fade/un-blur into place word-by-word with a brief violet glow pulse, instead of the whole line just fading up at once. Scroll the hero out of view — the large background name watermark should move slightly slower than the rest of the page. With reduced motion simulated (DevTools → Rendering → Emulate CSS media `prefers-reduced-motion: reduce`), headlines should appear as plain text immediately, no split spans, and the watermark should not move.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add hero parallax and kinetic word-stagger headline reveal"
```

---

### Task 10: Count-up stats

**Files:**
- Modify: `index.html` — JS inside `<script>`.

**Interfaces:**
- Consumes: `REDUCE_MOTION` (Task 2). Targets existing `.hs .n`, `.sc-stat .n`, `.ps .n` elements (no HTML changes).

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "countUp" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the JS**

Inside `<script>`, after the Task 9 block:

```js
function countUp(el){
  const raw=el.textContent.trim();
  const match=raw.match(/^([\d.]+)(.*)$/);
  if(!match) return;
  const target=parseFloat(match[1]);
  const suffix=match[2];
  const isInt=Number.isInteger(target);
  const dur=900;
  const start=performance.now();
  (function step(now){
    const p=Math.min((now-start)/dur,1);
    const e=1-Math.pow(1-p,3);
    const val=target*e;
    el.textContent=(isInt? Math.round(val): val.toFixed(1))+suffix;
    if(p<1) requestAnimationFrame(step);
    else el.textContent=raw;
  })(start);
}
if(!REDUCE_MOTION){
  const numObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting){ countUp(e.target); numObs.unobserve(e.target); } });
  },{threshold:.4});
  document.querySelectorAll('.hs .n,.sc-stat .n,.ps .n').forEach(el=>numObs.observe(el));
}
```

- [ ] **Step 3: Verify**

Run: `grep -c "countUp" "index.html"`
Expected: `2`

Open in browser, scroll so the hero stats row first enters view: "97%", "200+", "35+", "80+" should visibly animate up from 0 to their final value instead of appearing instantly. Repeat for the About section stat column ("97%, 200+, 3+, 5★") and the PreCognise stats ("80+, 150K, 4, 2") — all should count up and land on exactly their original text (confirm no rounding artifacts remain after the animation finishes, since the final step always restores `raw`).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: animate stat numbers counting up on scroll into view"
```

---

### Task 11: Bento layout for hero stats and skills grid

**Files:**
- Modify: `index.html` — CSS only, editing the existing `.hero-stats` rule (lines 170-174) and `.sk-grid` rule (line 301).

**Interfaces:**
- No new HTML — uses `:nth-child` selectors against the existing four `.hs` divs and six `.sk-cell` divs, so no markup changes are needed.

- [ ] **Step 1: Confirm the current uniform grid**

Run: `grep -n "hero-stats{" "index.html"`
Expected: shows `display:grid;grid-template-columns:repeat(4,1fr);`

- [ ] **Step 2: Replace `.hero-stats` with an asymmetric bento grid**

```css
.hero-stats{
  display:grid;grid-template-columns:1.6fr 1fr 1fr;grid-template-rows:1fr 1fr;
  gap:1px;background:var(--border);
  border:1px solid var(--border);border-radius:10px;overflow:hidden
}
.hero-stats .hs:nth-child(1){grid-column:1;grid-row:1/3}
.hero-stats .hs:nth-child(2){grid-column:2;grid-row:1}
.hero-stats .hs:nth-child(3){grid-column:3;grid-row:1}
.hero-stats .hs:nth-child(4){grid-column:2/4;grid-row:2}
```

- [ ] **Step 3: Replace `.sk-grid` with an asymmetric bento grid**

```css
.sk-grid{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:1px;background:var(--border);border:1px solid var(--border);border-radius:12px;overflow:hidden
}
.sk-grid .sk-cell:nth-child(1){grid-column:span 2}
```

- [ ] **Step 4: Update the responsive override so the bento grid still collapses cleanly on small screens**

The existing `@media(max-width:960px)` block (around line 517) has `.hero-stats{grid-template-columns:1fr 1fr}` and `.sk-grid,.feats{grid-template-columns:1fr 1fr}`. Add resets for the new column/row spans so mobile stays a simple 2-column grid:

```css
@media(max-width:960px){
  .hero-stats{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .hero-stats .hs:nth-child(1){grid-column:auto;grid-row:auto}
  .hero-stats .hs:nth-child(4){grid-column:auto}
  .sk-grid .sk-cell:nth-child(1){grid-column:auto}
}
```

(Add these four lines inside the existing `@media(max-width:960px){...}` block rather than creating a second media query block.)

- [ ] **Step 5: Verify**

Run: `grep -c "grid-column:span 2" "index.html"`
Expected: `1`

Open in browser at full width: the "97%" hero stat tile is visibly larger, spanning two rows on the left; the "AI & Machine Learning" skill cell spans two columns at the top of the skills grid. Resize the browser under 960px width (or use DevTools device toolbar) and confirm both grids fall back to a plain, even layout with no overlapping or squeezed cells.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "style: rework hero stats and skills grid into an asymmetric bento layout"
```

---

### Task 12: PreCognise sequential card reveal

**Files:**
- Modify: `index.html` — CSS only, appended after the Task 7 glass-system rules.

**Interfaces:**
- Consumes: the existing `.pre-sec.reveal` / `.in` class toggle (already present in the file's `IntersectionObserver`) — no JS or HTML changes needed.

Note on scope: the spec described this as a "pinned" scroll moment. A true CSS `position:sticky` pin was evaluated but rejected here — the `.pre-header` block isn't tall enough relative to `.feats` to make a pin visually convincing, and it would need extra invented scroll-spacer height that changes the page's overall scroll length. This task delivers the same effect the spec called for ("feature cards animate in sequence as the user continues scrolling into the section") via a per-card staggered transition keyed off the section's existing reveal state — same visual payoff, no structural risk.

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "pre-sec.in .feats" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the CSS**

Append after the Task 7 `/* ── GLASS SYSTEM ── */` block:

```css
.feats .feat{opacity:0;transform:translateY(24px);transition:opacity .55s var(--ease),transform .55s var(--ease)}
.feats .feat:nth-child(1){transition-delay:.05s}
.feats .feat:nth-child(2){transition-delay:.15s}
.feats .feat:nth-child(3){transition-delay:.25s}
.feats .feat:nth-child(4){transition-delay:.35s}
.feats .feat:nth-child(5){transition-delay:.45s}
.pre-sec.in .feats .feat{opacity:1;transform:translateY(0)}
```

- [ ] **Step 3: Verify**

Run: `grep -c "pre-sec.in .feats" "index.html"`
Expected: `1`

Open in browser, scroll to the PreCognise section: the five feature cards ("Semantic AI Matching" through "B2B Recruiter Tools") should fade and slide up one after another in reading order, not all at once.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: stagger PreCognise feature cards into sequential reveal"
```

---

### Task 13: PreCognise clarity tagline

**Files:**
- Modify: `index.html` — HTML at line 779 (inside `.pre-header`), CSS after the Task 12 rules.

**Interfaces:**
- No dependencies on other tasks; purely additive content + styling.

- [ ] **Step 1: Confirm it doesn't already exist**

Run: `grep -c "pre-tag" "index.html"`
Expected: `0`

- [ ] **Step 2: Add the HTML**

Insert directly after the `<h2 class="sec-h">PreCognise...</h2>` line and before the first `<p class="pre-p">`:

```html
        <h2 class="sec-h">PreCognise.<br><span style="color:var(--violet2)">Graduate employment,<br>reimagined.</span></h2>
        <p class="pre-tag">AI that matches graduates to jobs — at scale.</p>
        <p class="pre-p">PreCognise is an AI-native career infrastructure startup connecting talented graduates to meaningful employment through semantic AI matching, mass assessment infrastructure, and university partnership ecosystems.</p>
```

- [ ] **Step 3: Add the CSS**

Append after the Task 12 rules:

```css
.pre-tag{font-family:var(--mono);font-size:.78rem;color:var(--cyan);letter-spacing:.03em;margin-bottom:1.1rem}
```

- [ ] **Step 4: Verify**

Run: `grep -c "pre-tag" "index.html"`
Expected: `2`

Open in browser: a short monospace cyan line — "AI that matches graduates to jobs — at scale." — appears directly under the PreCognise headline, before the longer paragraphs.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "content: add plain-language PreCognise tagline"
```

---

### Task 14: Final cross-cutting verification

**Files:** none (verification only, no code changes expected).

- [ ] **Step 1: Console check**

Open `index.html` in a browser (PowerShell: `Start-Process index.html`). Open DevTools console. Reload. Expected: zero errors or warnings.

- [ ] **Step 2: Reduced-motion check**

In DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → set to `reduce`. Reload. Expected: no custom cursor, no orb drift/parallax, no magnetic buttons, no card tilt, no hero parallax, no word-stagger/glow on headlines, no count-up (numbers show final value immediately). The scroll-progress bar and the basic `.reveal`/`.in` fade-up (unrelated to `REDUCE_MOTION`, already existed before this plan) still work — content remains fully readable.

- [ ] **Step 3: Coarse-pointer / touch check**

In DevTools → toggle device toolbar (any mobile device preset). Reload. Expected: no custom cursor artifacts, buttons/cards respond normally to tap, bento grids and layout collapse per the Task 11 media query, nothing overlaps or is clipped.

- [ ] **Step 4: Content-integrity check**

Run: `grep -c "97%\|200+\|35+\|80+\|150K\|PreCognise\|precognise.co" "index.html"`
Expected: matches present exactly as before (no accidental content loss). Confirm the contact form's "Send message" button still triggers the existing `sendMail()` `mailto:` behavior.

- [ ] **Step 5: Commit** (only if Steps 1-4 required fixes)

```bash
git add index.html
git commit -m "fix: address verification findings"
```

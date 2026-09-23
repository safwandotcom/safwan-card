# Blog-from-LinkedIn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repeatable, scripted way to turn a finalized LinkedIn post into a native blog post on `safwandotcom.xyz`, wired up as a project skill Claude uses in the same session a LinkedIn post is drafted/published.

**Architecture:** A small dependency-free Node module (`scripts/blog-from-linkedin/generate-post.js`) holds pure functions that build/transform the four pieces of HTML/XML that change per post. A thin CLI wrapper (`cli.js`) wires those functions to real files on disk, driven by a JSON payload Claude writes after reshaping the LinkedIn text. A project skill (`.claude/skills/blog-from-linkedin/SKILL.md`) documents the procedure end to end: reshape → write payload → run CLI → review diff → `git commit` + `git push`.

**Tech Stack:** Node.js (v24 available, no `package.json` in this repo — plain CommonJS, zero npm dependencies), Node's built-in `node:test` runner for tests.

**Spec:** `docs/superpowers/specs/2026-09-24-blog-from-linkedin-design.md`

## Global Constraints

- No LinkedIn embed/iframe ever — content is reshaped prose, plus at most one plain link to the original post.
- No build step for the site — generated output is plain static HTML/XML, matching the existing hand-authored files exactly in structure.
- Zero new npm dependencies (repo has no `package.json`; keep it that way — use only Node built-ins).
- Git publish (`add`/`commit`/`push`) is a human-legible step Claude runs directly per the SKILL.md instructions — it is **not** baked into the CLI script, so the script can be run/tested repeatedly without ever pushing.
- If `git push` fails (e.g. remote diverged), stop and surface the failure — never force-push.

---

## File Structure

- `scripts/blog-from-linkedin/generate-post.js` — pure functions: slug/reading-time/date helpers, and builders/transformers for each of the four output artifacts (post page, listing row, homepage preview, sitemap entry). No file I/O.
- `scripts/blog-from-linkedin/generate-post.test.js` — unit tests for every function in `generate-post.js` (grows across Tasks 1-5).
- `scripts/blog-from-linkedin/cli.js` — reads a JSON payload, calls the pure functions, writes the four files on disk. Exports `main()` for testing; runs itself when invoked directly.
- `scripts/blog-from-linkedin/cli.test.js` — integration test: runs `main()` against a temp-directory copy of fixture files, asserts the four files end up correct.
- `.claude/skills/blog-from-linkedin/SKILL.md` — the procedure Claude follows in-session.
- `CLAUDE.md` (repo root, new) — one-line pointer telling Claude to offer/use the skill after a LinkedIn post is published in this repo.

---

### Task 1: Slug, reading-time, and date helpers

**Files:**
- Create: `scripts/blog-from-linkedin/generate-post.js`
- Test: `scripts/blog-from-linkedin/generate-post.test.js`

**Interfaces:**
- Produces: `slugify(title: string): string`, `uniqueSlug(baseSlug: string, existingSlugs: string[]): string`, `estimateReadingTime(bodyHtml: string): number`, `formatDateLong(isoDate: string): string` — all exported via `module.exports`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/blog-from-linkedin/generate-post.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  slugify,
  uniqueSlug,
  estimateReadingTime,
  formatDateLong,
} = require('./generate-post');

test('slugify lowercases, hyphenates, and strips punctuation', () => {
  assert.equal(slugify('Why I Build in Public'), 'why-i-build-in-public');
  assert.equal(slugify('Shipping v2.0 — the messy middle!'), 'shipping-v2-0-the-messy-middle');
});

test('uniqueSlug returns the base slug when there is no collision', () => {
  assert.equal(uniqueSlug('why-i-build-in-public', ['some-other-post']), 'why-i-build-in-public');
});

test('uniqueSlug appends -2, -3 on collision', () => {
  assert.equal(
    uniqueSlug('why-i-build-in-public', ['why-i-build-in-public']),
    'why-i-build-in-public-2'
  );
  assert.equal(
    uniqueSlug('why-i-build-in-public', ['why-i-build-in-public', 'why-i-build-in-public-2']),
    'why-i-build-in-public-3'
  );
});

test('estimateReadingTime strips tags and rounds up to whole minutes', () => {
  const words200 = `<p>${'word '.repeat(200)}</p>`;
  assert.equal(estimateReadingTime(words200), 1);
  const words201 = `<p>${'word '.repeat(201)}</p>`;
  assert.equal(estimateReadingTime(words201), 2);
});

test('estimateReadingTime never returns less than 1', () => {
  assert.equal(estimateReadingTime('<p>one</p>'), 1);
});

test('formatDateLong renders "Mon D, YYYY"', () => {
  assert.equal(formatDateLong('2026-09-24'), 'Sep 24, 2026');
  assert.equal(formatDateLong('2026-01-05'), 'Jan 5, 2026');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: FAIL — `Cannot find module './generate-post'`

- [ ] **Step 3: Implement the helpers**

Create `scripts/blog-from-linkedin/generate-post.js`:

```js
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function slugify(title) {
  return title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

function uniqueSlug(baseSlug, existingSlugs) {
  if (!existingSlugs.includes(baseSlug)) return baseSlug;
  let n = 2;
  while (existingSlugs.includes(`${baseSlug}-${n}`)) n++;
  return `${baseSlug}-${n}`;
}

function estimateReadingTime(bodyHtml) {
  const text = bodyHtml.replace(/<[^>]+>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean);
  return Math.max(1, Math.ceil(words.length / 200));
}

function formatDateLong(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

module.exports = {
  slugify,
  uniqueSlug,
  estimateReadingTime,
  formatDateLong,
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-from-linkedin/generate-post.js scripts/blog-from-linkedin/generate-post.test.js
git commit -m "Add slug/reading-time/date helpers for blog-from-linkedin"
```

---

### Task 2: Post-page HTML builder

**Files:**
- Modify: `scripts/blog-from-linkedin/generate-post.js`
- Modify: `scripts/blog-from-linkedin/generate-post.test.js`

**Interfaces:**
- Consumes: nothing from Task 1 directly (pure function), but shares the module and its `module.exports` object.
- Produces: `buildPostHtml(fields: { title, slug, isoDate, longDate, metaDescription, eyebrow, bodyHtml, readingTime, linkedinUrl }): string` — a full HTML document string.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/blog-from-linkedin/generate-post.test.js`:

```js
const { buildPostHtml } = require('./generate-post');

function samplePostFields(overrides = {}) {
  return {
    title: 'Test Post Title',
    slug: 'test-post-title',
    isoDate: '2026-09-24',
    longDate: 'Sep 24, 2026',
    metaDescription: 'A short meta description for the test post.',
    eyebrow: 'Essay',
    bodyHtml: '<p>Body paragraph one.</p><p>Body paragraph two.</p>',
    readingTime: 2,
    linkedinUrl: null,
    ...overrides,
  };
}

test('buildPostHtml includes title, canonical URL, and meta description', () => {
  const html = buildPostHtml(samplePostFields());
  assert.match(html, /<title>Test Post Title — Safwanul<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/safwandotcom\.xyz\/blog\/posts\/test-post-title\.html">/);
  assert.match(html, /<meta name="description" content="A short meta description for the test post\.">/);
  assert.match(html, /"headline": "Test Post Title"/);
  assert.match(html, /"datePublished": "2026-09-24"/);
});

test('buildPostHtml embeds the reshaped body HTML and reading time', () => {
  const html = buildPostHtml(samplePostFields());
  assert.match(html, /<p>Body paragraph one\.<\/p><p>Body paragraph two\.<\/p>/);
  assert.match(html, /<span>2 min read<\/span>/);
  assert.match(html, /<time datetime="2026-09-24">Sep 24, 2026<\/time>/);
});

test('buildPostHtml adds a plain LinkedIn footer link when linkedinUrl is set, and omits it otherwise', () => {
  const withLink = buildPostHtml(samplePostFields({ linkedinUrl: 'https://www.linkedin.com/posts/example' }));
  assert.match(withLink, /<a href="https:\/\/www\.linkedin\.com\/posts\/example">Originally posted on LinkedIn →<\/a>/);

  const withoutLink = buildPostHtml(samplePostFields());
  assert.doesNotMatch(withoutLink, /Originally posted on LinkedIn/);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: FAIL — `buildPostHtml is not a function`

- [ ] **Step 3: Implement `buildPostHtml`**

Add to `scripts/blog-from-linkedin/generate-post.js`, above the `module.exports` block:

```js
function buildPostHtml({ title, slug, isoDate, longDate, metaDescription, eyebrow, bodyHtml, readingTime, linkedinUrl }) {
  const linkedinFooter = linkedinUrl
    ? `\n      <p><a href="${linkedinUrl}">Originally posted on LinkedIn →</a></p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Safwanul</title>
<meta name="description" content="${metaDescription}">
<meta name="author" content="Mohammed Safwanul Islam">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://safwandotcom.xyz/blog/posts/${slug}.html">
<meta name="theme-color" content="#2e0bfc">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Mohammed Safwanul Islam">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${metaDescription}">
<meta property="og:url" content="https://safwandotcom.xyz/blog/posts/${slug}.html">
<meta property="og:image" content="https://safwandotcom.xyz/og.png">
<meta property="article:published_time" content="${isoDate}">
<meta property="article:author" content="Mohammed Safwanul Islam">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://safwandotcom.xyz/og.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "${title}",
  "description": "${metaDescription}",
  "image": "https://safwandotcom.xyz/og.png",
  "datePublished": "${isoDate}",
  "dateModified": "${isoDate}",
  "author": { "@type": "Person", "name": "Mohammed Safwanul Islam", "url": "https://safwandotcom.xyz/" },
  "publisher": { "@type": "Person", "name": "Mohammed Safwanul Islam" },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://safwandotcom.xyz/blog/posts/${slug}.html" }
}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..48,400..800&family=Geist:wght@300..700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../blog.css">
</head>
<body>

<header class="masthead">
  <div class="masthead-in">
    <a href="../../index.html" class="brand">Safwanul<b>.</b></a>
    <nav class="nav" aria-label="Primary">
      <a href="../../index.html#about">About</a>
      <a href="../../index.html#experience">Experience</a>
      <a href="../index.html" class="here">Writing</a>
      <a href="../../index.html#contact">Contact</a>
    </nav>
  </div>
</header>

<main>
  <article>
    <header class="article-head reading">
      <a class="back" href="../index.html">← All writing</a>
      <p class="eyebrow" style="margin-top:1.5rem">${eyebrow}</p>
      <h1>${title}</h1>
      <div class="meta">
        <time datetime="${isoDate}">${longDate}</time>
        <span class="dot"></span>
        <span>${readingTime} min read</span>
      </div>
    </header>

    <div class="prose reading">
      ${bodyHtml}${linkedinFooter}
    </div>

    <footer class="article-foot reading">
      <a class="back" href="../index.html">← All writing</a>
      <a class="back" href="../../index.html#contact">Say hello →</a>
    </footer>
  </article>
</main>

<footer class="blog-footer">
  <div class="wrap">
    <span>© 2026 Mohammed Safwanul Islam</span>
    <a href="../../index.html">← Back to portfolio</a>
  </div>
</footer>

</body>
</html>
`;
}
```

Update `module.exports` to also include `buildPostHtml`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: PASS (all tests so far)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-from-linkedin/generate-post.js scripts/blog-from-linkedin/generate-post.test.js
git commit -m "Add post-page HTML builder for blog-from-linkedin"
```

---

### Task 3: Blog listing row builder + prepend

**Files:**
- Modify: `scripts/blog-from-linkedin/generate-post.js`
- Modify: `scripts/blog-from-linkedin/generate-post.test.js`

**Interfaces:**
- Produces: `buildListingRowHtml(fields: { title, slug, isoDate, longDate, excerpt, readingTime }): string`, `prependListingRow(blogIndexHtml: string, rowHtml: string): string`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/blog-from-linkedin/generate-post.test.js`:

```js
const { buildListingRowHtml, prependListingRow } = require('./generate-post');

test('buildListingRowHtml renders a post-row anchor with title, date, and excerpt', () => {
  const row = buildListingRowHtml({
    title: 'Test Post Title',
    slug: 'test-post-title',
    isoDate: '2026-09-24',
    longDate: 'Sep 24, 2026',
    excerpt: 'A short teaser sentence.',
    readingTime: 2,
  });
  assert.match(row, /<a class="post-row" href="posts\/test-post-title\.html">/);
  assert.match(row, /<time datetime="2026-09-24">Sep 24, 2026<\/time>/);
  assert.match(row, /<h2 class="post-title">Test Post Title<\/h2>/);
  assert.match(row, /<p class="post-excerpt">A short teaser sentence\.<\/p>/);
  assert.match(row, /<span>2 min read<\/span>/);
});

test('prependListingRow inserts the new row right after the marker comment, before existing rows', () => {
  const fixture = `<div class="post-list">

      <!-- POST ROW TEMPLATE — newest first -->
      <a class="post-row" href="posts/old-post.html">
        <h2 class="post-title">Old Post</h2>
      </a>

    </div>`;
  const newRow = `      <a class="post-row" href="posts/new-post.html">
        <h2 class="post-title">New Post</h2>
      </a>`;

  const updated = prependListingRow(fixture, newRow);
  const newIndex = updated.indexOf('posts/new-post.html');
  const oldIndex = updated.indexOf('posts/old-post.html');

  assert.ok(newIndex > -1 && oldIndex > -1);
  assert.ok(newIndex < oldIndex, 'new row should appear before the old row');
});

test('prependListingRow throws when the marker comment is missing', () => {
  assert.throws(() => prependListingRow('<div class="post-list"></div>', 'x'));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: FAIL — `buildListingRowHtml is not a function`

- [ ] **Step 3: Implement**

Add to `scripts/blog-from-linkedin/generate-post.js`, above `module.exports`:

```js
const ROW_MARKER = '<!-- POST ROW TEMPLATE — newest first -->';

function buildListingRowHtml({ title, slug, isoDate, longDate, excerpt, readingTime }) {
  return `      <a class="post-row" href="posts/${slug}.html">
        <div class="post-meta">
          <time datetime="${isoDate}">${longDate}</time>
          <span class="dot"></span>
          <span>${readingTime} min read</span>
        </div>
        <h2 class="post-title">${title}</h2>
        <p class="post-excerpt">${excerpt}</p>
        <span class="more">Read →</span>
      </a>`;
}

function prependListingRow(blogIndexHtml, rowHtml) {
  const marker = `${ROW_MARKER}\n`;
  const idx = blogIndexHtml.indexOf(marker);
  if (idx === -1) {
    throw new Error('post-row marker comment not found in blog/index.html');
  }
  const insertAt = idx + marker.length;
  return `${blogIndexHtml.slice(0, insertAt)}${rowHtml}\n\n${blogIndexHtml.slice(insertAt)}`;
}
```

Update `module.exports` to also include `buildListingRowHtml` and `prependListingRow`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: PASS (all tests so far)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-from-linkedin/generate-post.js scripts/blog-from-linkedin/generate-post.test.js
git commit -m "Add blog listing row builder for blog-from-linkedin"
```

---

### Task 4: Homepage "Latest writing" preview replace

**Files:**
- Modify: `scripts/blog-from-linkedin/generate-post.js`
- Modify: `scripts/blog-from-linkedin/generate-post.test.js`

**Interfaces:**
- Produces: `buildHomepagePreviewHtml(fields: { title, slug, isoDate, longDate, excerpt, readingTime }): string`, `replaceHomepageWritingBlock(homepageHtml: string, previewHtml: string): string`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/blog-from-linkedin/generate-post.test.js`:

```js
const { buildHomepagePreviewHtml, replaceHomepageWritingBlock } = require('./generate-post');

test('buildHomepagePreviewHtml renders the styled homepage anchor block', () => {
  const block = buildHomepagePreviewHtml({
    title: 'Test Post Title',
    slug: 'test-post-title',
    isoDate: '2026-09-24',
    longDate: 'Sep 24, 2026',
    excerpt: 'A short teaser sentence.',
    readingTime: 2,
  });
  assert.match(block, /<a href="blog\/posts\/test-post-title\.html" style="display:block/);
  assert.match(block, /<h3 style="font-size:clamp\(1\.2rem,1rem \+ 1vw,1\.55rem\)">Test Post Title<\/h3>/);
  assert.match(block, /<p style="color:var\(--ink-2\);margin-top:\.4rem;max-width:60ch">A short teaser sentence\.<\/p>/);
});

test('replaceHomepageWritingBlock swaps the single preview anchor inside #writing', () => {
  const fixture = `<section class="sec" id="writing">
  <div class="wrap">
    <div class="reveal" style="border-top:1px solid var(--line)">
      <a href="blog/posts/old-post.html" style="display:block">
        <h3>Old Post</h3>
      </a>
    </div>
  </div>
</section>

<section class="contact">unrelated</section>`;

  const newBlock = `      <a href="blog/posts/new-post.html" style="display:block">
        <h3>New Post</h3>
      </a>`;

  const updated = replaceHomepageWritingBlock(fixture, newBlock);

  assert.match(updated, /blog\/posts\/new-post\.html/);
  assert.doesNotMatch(updated, /blog\/posts\/old-post\.html/);
  assert.match(updated, /unrelated/, 'content outside #writing must be untouched');
});

test('replaceHomepageWritingBlock throws when #writing section is missing', () => {
  assert.throws(() => replaceHomepageWritingBlock('<html></html>', 'x'));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: FAIL — `buildHomepagePreviewHtml is not a function`

- [ ] **Step 3: Implement**

Add to `scripts/blog-from-linkedin/generate-post.js`, above `module.exports`:

```js
const WRITING_SECTION_START = '<section class="sec" id="writing">';

function buildHomepagePreviewHtml({ title, slug, isoDate, longDate, excerpt, readingTime }) {
  return `      <a href="blog/posts/${slug}.html" style="display:block;padding-block:clamp(1.4rem,3vw,1.9rem);border-bottom:1px solid var(--line);transition:background .18s var(--e)" onmouseover="this.style.background='var(--accent-soft)'" onmouseout="this.style.background='transparent'">
        <div style="display:flex;align-items:center;gap:.7rem;font-size:.8rem;color:var(--muted);margin-bottom:.5rem">
          <time datetime="${isoDate}">${longDate}</time>
          <span style="width:3px;height:3px;border-radius:50%;background:var(--line-2)"></span>
          <span>${readingTime} min read</span>
        </div>
        <h3 style="font-size:clamp(1.2rem,1rem + 1vw,1.55rem)">${title}</h3>
        <p style="color:var(--ink-2);margin-top:.4rem;max-width:60ch">${excerpt}</p>
      </a>`;
}

function replaceHomepageWritingBlock(homepageHtml, previewHtml) {
  const sectionStart = homepageHtml.indexOf(WRITING_SECTION_START);
  if (sectionStart === -1) {
    throw new Error('#writing section not found in homepage');
  }
  const sectionEnd = homepageHtml.indexOf('</section>', sectionStart);
  if (sectionEnd === -1) {
    throw new Error('#writing section is not closed');
  }

  const before = homepageHtml.slice(0, sectionStart);
  const section = homepageHtml.slice(sectionStart, sectionEnd);
  const after = homepageHtml.slice(sectionEnd);

  const anchorPattern = /<a href="blog\/posts\/[\s\S]*?<\/a>/;
  if (!anchorPattern.test(section)) {
    throw new Error('no existing post preview anchor found in #writing section');
  }

  return before + section.replace(anchorPattern, previewHtml) + after;
}
```

Update `module.exports` to also include `buildHomepagePreviewHtml` and `replaceHomepageWritingBlock`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: PASS (all tests so far)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-from-linkedin/generate-post.js scripts/blog-from-linkedin/generate-post.test.js
git commit -m "Add homepage writing-preview replace for blog-from-linkedin"
```

---

### Task 5: Sitemap entry updater

**Files:**
- Modify: `scripts/blog-from-linkedin/generate-post.js`
- Modify: `scripts/blog-from-linkedin/generate-post.test.js`

**Interfaces:**
- Produces: `addSitemapEntry(sitemapXml: string, fields: { slug, isoDate }): string`.

- [ ] **Step 1: Write the failing tests**

Append to `scripts/blog-from-linkedin/generate-post.test.js`:

```js
const { addSitemapEntry } = require('./generate-post');

function sitemapFixture() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://safwandotcom.xyz/</loc>
    <lastmod>2026-07-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://safwandotcom.xyz/blog/</loc>
    <lastmod>2026-07-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://safwandotcom.xyz/blog/posts/why-i-build-in-public.html</loc>
    <lastmod>2026-07-25</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
`;
}

test('addSitemapEntry adds a new <url> for the post and bumps homepage/blog lastmod', () => {
  const updated = addSitemapEntry(sitemapFixture(), { slug: 'test-post-title', isoDate: '2026-09-24' });

  assert.match(updated, /<loc>https:\/\/safwandotcom\.xyz\/blog\/posts\/test-post-title\.html<\/loc>/);
  assert.match(
    updated,
    /<loc>https:\/\/safwandotcom\.xyz\/<\/loc>\s*<lastmod>2026-09-24<\/lastmod>/
  );
  assert.match(
    updated,
    /<loc>https:\/\/safwandotcom\.xyz\/blog\/<\/loc>\s*<lastmod>2026-09-24<\/lastmod>/
  );
  assert.match(
    updated,
    /<loc>https:\/\/safwandotcom\.xyz\/blog\/posts\/why-i-build-in-public\.html<\/loc>\s*<lastmod>2026-07-25<\/lastmod>/,
    'older post entries must be untouched'
  );
});

test('addSitemapEntry throws if an entry for the slug already exists', () => {
  assert.throws(() =>
    addSitemapEntry(sitemapFixture(), { slug: 'why-i-build-in-public', isoDate: '2026-09-24' })
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: FAIL — `addSitemapEntry is not a function`

- [ ] **Step 3: Implement**

Add to `scripts/blog-from-linkedin/generate-post.js`, above `module.exports`:

```js
function addSitemapEntry(sitemapXml, { slug, isoDate }) {
  if (sitemapXml.includes(`blog/posts/${slug}.html`)) {
    throw new Error(`sitemap already contains an entry for ${slug}`);
  }

  const entry = `  <url>
    <loc>https://safwandotcom.xyz/blog/posts/${slug}.html</loc>
    <lastmod>${isoDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>
`;

  let updated = sitemapXml.replace('</urlset>', `${entry}</urlset>`);

  updated = updated.replace(
    /(<loc>https:\/\/safwandotcom\.xyz\/<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/,
    `$1${isoDate}$2`
  );
  updated = updated.replace(
    /(<loc>https:\/\/safwandotcom\.xyz\/blog\/<\/loc>\s*<lastmod>)[^<]+(<\/lastmod>)/,
    `$1${isoDate}$2`
  );

  return updated;
}
```

Update `module.exports` to also include `addSitemapEntry`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test scripts/blog-from-linkedin/generate-post.test.js`
Expected: PASS (all tests — this file's full suite)

- [ ] **Step 5: Commit**

```bash
git add scripts/blog-from-linkedin/generate-post.js scripts/blog-from-linkedin/generate-post.test.js
git commit -m "Add sitemap entry updater for blog-from-linkedin"
```

---

### Task 6: CLI orchestration

**Files:**
- Create: `scripts/blog-from-linkedin/cli.js`
- Create: `scripts/blog-from-linkedin/cli.test.js`

**Interfaces:**
- Consumes: every function exported by `scripts/blog-from-linkedin/generate-post.js` (Tasks 1-5): `slugify`, `uniqueSlug`, `estimateReadingTime`, `formatDateLong`, `buildPostHtml`, `buildListingRowHtml`, `prependListingRow`, `buildHomepagePreviewHtml`, `replaceHomepageWritingBlock`, `addSitemapEntry`.
- Produces: `main(payloadPath: string, options?: { repoRoot?: string }): { slug: string }`, writing `blog/posts/<slug>.html`, and updating `blog/index.html`, `index.html`, `sitemap.xml` under `repoRoot` (default `process.cwd()`).

- [ ] **Step 1: Write the failing test**

Create `scripts/blog-from-linkedin/cli.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { main } = require('./cli');

function makeFixtureRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-from-linkedin-'));
  fs.mkdirSync(path.join(repoRoot, 'blog', 'posts'), { recursive: true });

  fs.writeFileSync(
    path.join(repoRoot, 'blog', 'posts', 'why-i-build-in-public.html'),
    '<html><!-- existing post fixture --></html>'
  );

  fs.writeFileSync(
    path.join(repoRoot, 'blog', 'index.html'),
    `<div class="post-list">

      <!-- POST ROW TEMPLATE — newest first -->
      <a class="post-row" href="posts/why-i-build-in-public.html">
        <h2 class="post-title">Why I build in public</h2>
      </a>

    </div>`
  );

  fs.writeFileSync(
    path.join(repoRoot, 'index.html'),
    `<section class="sec" id="writing">
  <div class="wrap">
    <div class="reveal" style="border-top:1px solid var(--line)">
      <a href="blog/posts/why-i-build-in-public.html" style="display:block">
        <h3>Why I build in public</h3>
      </a>
    </div>
  </div>
</section>`
  );

  fs.writeFileSync(
    path.join(repoRoot, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://safwandotcom.xyz/</loc>
    <lastmod>2026-07-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://safwandotcom.xyz/blog/</loc>
    <lastmod>2026-07-25</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`
  );

  return repoRoot;
}

test('main() creates the post page and updates listing, homepage, and sitemap', () => {
  const repoRoot = makeFixtureRepo();
  const payloadPath = path.join(repoRoot, 'payload.json');
  fs.writeFileSync(
    payloadPath,
    JSON.stringify({
      title: 'A Fresh Test Post',
      metaDescription: 'A meta description for the fresh test post.',
      bodyHtml: '<p>Body content for the fresh test post.</p>',
      date: '2026-09-24',
    })
  );

  const result = main(payloadPath, { repoRoot });
  assert.equal(result.slug, 'a-fresh-test-post');

  const postPath = path.join(repoRoot, 'blog', 'posts', 'a-fresh-test-post.html');
  assert.ok(fs.existsSync(postPath));
  const postHtml = fs.readFileSync(postPath, 'utf8');
  assert.match(postHtml, /<h1>A Fresh Test Post<\/h1>/);

  const blogIndex = fs.readFileSync(path.join(repoRoot, 'blog', 'index.html'), 'utf8');
  assert.ok(blogIndex.indexOf('a-fresh-test-post.html') < blogIndex.indexOf('why-i-build-in-public.html'));

  const homepage = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  assert.match(homepage, /blog\/posts\/a-fresh-test-post\.html/);
  assert.doesNotMatch(homepage, /blog\/posts\/why-i-build-in-public\.html/);

  const sitemap = fs.readFileSync(path.join(repoRoot, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /blog\/posts\/a-fresh-test-post\.html/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('main() throws a clear error when the payload is missing required fields', () => {
  const repoRoot = makeFixtureRepo();
  const payloadPath = path.join(repoRoot, 'payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify({ title: 'Missing fields' }));

  assert.throws(() => main(payloadPath, { repoRoot }), /must include title, metaDescription, and bodyHtml/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/blog-from-linkedin/cli.test.js`
Expected: FAIL — `Cannot find module './cli'`

- [ ] **Step 3: Implement `cli.js`**

Create `scripts/blog-from-linkedin/cli.js`:

```js
const fs = require('node:fs');
const path = require('node:path');
const {
  slugify,
  uniqueSlug,
  estimateReadingTime,
  formatDateLong,
  buildPostHtml,
  buildListingRowHtml,
  prependListingRow,
  buildHomepagePreviewHtml,
  replaceHomepageWritingBlock,
  addSitemapEntry,
} = require('./generate-post');

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function main(payloadPath, { repoRoot = process.cwd() } = {}) {
  const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  const {
    title,
    metaDescription,
    excerpt = payload.metaDescription,
    eyebrow = 'Essay',
    bodyHtml,
    linkedinUrl = null,
    date = todayIso(),
  } = payload;

  if (!title || !metaDescription || !bodyHtml) {
    throw new Error('payload must include title, metaDescription, and bodyHtml');
  }

  const postsDir = path.join(repoRoot, 'blog', 'posts');
  const existingSlugs = fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => f.slice(0, -'.html'.length));

  const slug = uniqueSlug(slugify(title), existingSlugs);
  const longDate = formatDateLong(date);
  const readingTime = estimateReadingTime(bodyHtml);

  const fields = {
    title,
    slug,
    isoDate: date,
    longDate,
    metaDescription,
    excerpt,
    eyebrow,
    bodyHtml,
    readingTime,
    linkedinUrl,
  };

  fs.writeFileSync(path.join(postsDir, `${slug}.html`), buildPostHtml(fields), 'utf8');

  const blogIndexPath = path.join(repoRoot, 'blog', 'index.html');
  const updatedBlogIndex = prependListingRow(
    fs.readFileSync(blogIndexPath, 'utf8'),
    buildListingRowHtml(fields)
  );
  fs.writeFileSync(blogIndexPath, updatedBlogIndex, 'utf8');

  const homepagePath = path.join(repoRoot, 'index.html');
  const updatedHomepage = replaceHomepageWritingBlock(
    fs.readFileSync(homepagePath, 'utf8'),
    buildHomepagePreviewHtml(fields)
  );
  fs.writeFileSync(homepagePath, updatedHomepage, 'utf8');

  const sitemapPath = path.join(repoRoot, 'sitemap.xml');
  const updatedSitemap = addSitemapEntry(fs.readFileSync(sitemapPath, 'utf8'), { slug, isoDate: date });
  fs.writeFileSync(sitemapPath, updatedSitemap, 'utf8');

  console.log(`Created blog/posts/${slug}.html`);
  console.log('Updated blog/index.html, index.html (#writing), sitemap.xml');

  return { slug };
}

if (require.main === module) {
  const payloadPath = process.argv[2];
  if (!payloadPath) {
    console.error('Usage: node cli.js <payload.json>');
    process.exit(1);
  }
  main(payloadPath);
}

module.exports = { main };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/blog-from-linkedin/cli.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Run the full test suite**

Run: `node --test scripts/blog-from-linkedin/`
Expected: PASS (every test from Tasks 1-6)

- [ ] **Step 6: Commit**

```bash
git add scripts/blog-from-linkedin/cli.js scripts/blog-from-linkedin/cli.test.js
git commit -m "Add CLI orchestration for blog-from-linkedin"
```

---

### Task 7: Skill instructions + repo pointer

**Files:**
- Create: `.claude/skills/blog-from-linkedin/SKILL.md`
- Create: `CLAUDE.md` (repo root)

**Interfaces:**
- Consumes: `scripts/blog-from-linkedin/cli.js` as a shell command (`node scripts/blog-from-linkedin/cli.js <payload.json>`), documented, not called programmatically.

- [ ] **Step 1: Write `.claude/skills/blog-from-linkedin/SKILL.md`**

```markdown
---
name: blog-from-linkedin
description: Mirror a LinkedIn post just drafted/published in this session onto this site's blog as a native, reshaped post (no LinkedIn embed). Use right after a LinkedIn post is finalized while working in this repo.
---

# Blog from LinkedIn

Turns a LinkedIn post that was just drafted or published in this conversation
into a native blog post on `safwandotcom.xyz`, then publishes it.

## When to use

Right after a LinkedIn post has been finalized in this session (e.g. via the
linkedin-post-writer skill / Publora) — while working in this repo. If the
user hasn't asked directly, offer it.

## Steps

1. **Reshape the content.** From the finalized LinkedIn text, write:
   - `title` — a real title, not just the LinkedIn hook line.
   - `bodyHtml` — the post promoted into article HTML: an intro paragraph,
     `<h2>`/`<h3>` where the post shifts topic, `<ul>`/`<blockquote>` where
     the post already uses lists or emphasis. Same voice and content,
     adapted to a page instead of a feed post.
   - `metaDescription` — one sentence, roughly 150-160 characters.
   - `excerpt` (optional) — a teaser sentence for the listing/homepage rows;
     defaults to `metaDescription` if omitted.
   - `linkedinUrl` (optional) — the post's public URL. This becomes a single
     plain link in the post footer ("Originally posted on LinkedIn →") —
     never an embed or iframe.
   - Leave `eyebrow` (defaults to `"Essay"`) and `date` (defaults to today)
     unset unless the user asks for something different.

2. **Write the payload** to a scratch JSON file (use the session's scratchpad
   directory), matching:

   ```json
   {
     "title": "...",
     "metaDescription": "...",
     "excerpt": "...",
     "bodyHtml": "<p>...</p>",
     "linkedinUrl": "https://www.linkedin.com/posts/..."
   }
   ```

3. **Run the generator** from the repo root:

   ```bash
   node scripts/blog-from-linkedin/cli.js <path-to-payload.json>
   ```

   This creates `blog/posts/<slug>.html` and updates `blog/index.html`,
   `index.html` (the `#writing` section), and `sitemap.xml`. It prints the
   slug it chose — if a post with a very similar title already exists, it
   will pick `<slug>-2`, etc.

4. **Review the diff** (`git diff`) — read the generated post and confirm
   the listing/homepage/sitemap edits look right before publishing.

5. **Publish.** Per the user's standing choice for this workflow, there is
   no separate review gate — commit and push directly:

   ```bash
   git add blog/posts/<slug>.html blog/index.html index.html sitemap.xml
   git commit -m "Blog: <title>"
   git push
   ```

   If the push fails (e.g. the remote has diverged), stop and tell the user
   — do not force-push.
```

- [ ] **Step 2: Write `CLAUDE.md`** (repo root)

```markdown
# safwan-card

Mohammed Safwanul Islam's personal site (safwandotcom.xyz) — a static
site with no build step. `blog/` is a hand-authored blog; see
`.claude/skills/blog-from-linkedin/SKILL.md` for the workflow that mirrors
a LinkedIn post into a new blog post here.

Whenever a LinkedIn post is finalized in a session working out of this
repo, offer (or use, if asked) the `blog-from-linkedin` skill to mirror it
onto the blog.
```

- [ ] **Step 3: Verify the skill file is well-formed**

There is no automated test for a Markdown instructions file. Manually
confirm:
- The YAML frontmatter between the `---` lines parses (name + description
  present, no tab characters, no unescaped colons breaking the block).
- Every file path mentioned (`scripts/blog-from-linkedin/cli.js`) matches
  what Tasks 1-6 actually created.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/blog-from-linkedin/SKILL.md CLAUDE.md
git commit -m "Add blog-from-linkedin skill instructions"
```

---

### Task 8: End-to-end manual dry run (no push)

**Files:**
- None created — this task exercises Tasks 1-7 against the real repo files and then reverts, so no fake content ever reaches `blog/index.html`, `index.html`, or `sitemap.xml` in git history.

**Interfaces:**
- Consumes: `scripts/blog-from-linkedin/cli.js` (Task 6), the real repo's `blog/posts/`, `blog/index.html`, `index.html`, `sitemap.xml`.

- [ ] **Step 1: Write a throwaway sample payload**

Write to the scratchpad directory (not into the repo), e.g.
`E:\temp\claude\...\scratchpad\dry-run-payload.json`:

```json
{
  "title": "Dry Run Test Post — Safe To Delete",
  "metaDescription": "A throwaway post used to verify the blog-from-linkedin pipeline end to end.",
  "bodyHtml": "<p>This is a throwaway paragraph used only to verify the generator end to end.</p><h2>A section</h2><p>Another paragraph to check heading rendering.</p>"
}
```

- [ ] **Step 2: Run the CLI against the real repo**

Run: `node scripts/blog-from-linkedin/cli.js E:\temp\claude\...\scratchpad\dry-run-payload.json`
(run from the repo root, so the default `repoRoot = process.cwd()` is correct)

Expected output: `Created blog/posts/dry-run-test-post-safe-to-delete.html` plus the "Updated ..." line.

- [ ] **Step 3: Verify the four files**

- Open `blog/posts/dry-run-test-post-safe-to-delete.html` — confirm it renders as a complete, correctly structured post (title, meta, body, footer).
- Open `blog/index.html` — confirm the new row appears above the existing `why-i-build-in-public` row.
- Open `index.html` — confirm the `#writing` section now shows the dry-run post instead of the old preview.
- Open `sitemap.xml` — confirm the new `<url>` entry exists and the homepage/blog `<lastmod>` values were bumped to today.

- [ ] **Step 4: Revert — this was a dry run, not a real post**

```bash
git status --short
git checkout -- blog/index.html index.html sitemap.xml
rm blog/posts/dry-run-test-post-safe-to-delete.html
git status --short
```

Expected: `git status --short` shows a clean working tree (matching Task 7's commit) — nothing from the dry run remains.

- [ ] **Step 5: Confirm the full test suite still passes**

Run: `node --test scripts/blog-from-linkedin/`
Expected: PASS

No commit for this task — it's verification only, and Step 4 already restores the working tree.

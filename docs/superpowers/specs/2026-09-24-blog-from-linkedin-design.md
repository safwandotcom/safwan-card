# Blog-from-LinkedIn automation

## Problem

Safwanul posts to LinkedIn daily (drafted with Claude via the `linkedin-skills`
plugin and published through Publora). None of that writing exists on his own
site. He wants each post mirrored onto `safwandotcom.xyz/blog/` as a native
page — no LinkedIn iframe/embed, reshaped to read as a standalone post — with
minimal extra effort per day.

## Constraints

- LinkedIn's own API does not give convenient read access to a member's own
  published post content; scraping is fragile and against ToS. Both are
  avoided by sourcing the text from the same Claude session that drafted the
  LinkedIn post, before or right after it's published — not by fetching it
  back from LinkedIn afterward.
- The blog has no build step (`docs/superpowers/specs/2026-07-24-*` and
  `blog/` itself). Posts are static hand-authored HTML. This automation keeps
  that model — it generates the same kind of files a human would have
  hand-built, it just does it from LinkedIn text instead of from scratch.
- Publishing is a direct `git push` to `main` on `safwandotcom/safwan-card`
  (Vercel auto-deploys). The user explicitly chose auto-push with no review
  gate for this workflow — confirmed during design (see Decisions below).

## Decisions (from brainstorming)

1. **Source**: posts are already drafted with Claude via linkedin-post-writer/Publora — reuse that text, don't re-fetch from LinkedIn.
2. **Trigger**: same-session, right after the LinkedIn post is finalized — not a scheduled/decoupled job.
3. **Content format**: reshaped for the blog (real title, light structure/intro, full SEO metadata) — not a verbatim repost.
4. **Publish gate**: auto-push immediately, no separate review step.

## Architecture

A new project skill, `.claude/skills/blog-from-linkedin/SKILL.md`, invoked
in the same conversation where a LinkedIn post was drafted/published. Input:
the finalized LinkedIn post text, and optionally its public URL. Output:
a new blog post live on the site.

```
LinkedIn post text (in-session)
        │
        ▼
 blog-from-linkedin skill
        │
        ├─ 1. Reshape content → title, body HTML, meta description
        ├─ 2. Derive slug (kebab-case of title), reading time (word count / 200wpm)
        ├─ 3. Write blog/posts/<slug>.html          (from existing post template)
        ├─ 4. Prepend post-row to blog/index.html   (listing page)
        ├─ 5. Replace "Latest writing" block in index.html (#writing section)
        ├─ 6. Add <url> entry to sitemap.xml; bump lastmod on / and /blog/
        └─ 7. git add + commit + push to main       (triggers Vercel deploy)
```

### 1. Content reshaping

Claude (in-session, no extra API calls) turns the LinkedIn text into:
- A real title (not just the LinkedIn hook line)
- Body prose promoted from LinkedIn's short-paragraph style into an
  article: intro paragraph, `<h2>`/`<h3>` breaks where the post has topic
  shifts, `<ul>`/`<blockquote>` where the post already uses lists/emphasis
- A one-sentence meta description (~150-160 chars) for `<meta name="description">`, `og:description`, `twitter` fields, and the JSON-LD `description`
- Eyebrow label: `"Essay"`, matching the existing post — the page carries
  no visible marker that it originated on LinkedIn
- If a LinkedIn post URL is available, add a single quiet footer line
  ("Originally posted on LinkedIn →") linking out — never an embed/iframe

### 2. Slug & metadata

- Slug: kebab-case of the generated title, ASCII-folded, truncated to a
  reasonable length (existing example: `why-i-build-in-public`)
- Date: today's date (`YYYY-MM-DD`), used for `datetime`, `article:published_time`, `dateModified`, `lastmod`
- Reading time: `ceil(word_count / 200)` minutes, formatted `"N min read"`
- Collision handling: if the slug already exists under `blog/posts/`,
  append `-2`, `-3`, etc.

### 3. File: `blog/posts/<slug>.html`

Built from the existing template (`blog/posts/why-i-build-in-public.html`)
verbatim in structure — same `<head>` metadata block (title, description,
canonical, robots, theme-color, icons, OG tags, `article:*`, twitter card,
JSON-LD `BlogPosting`), same masthead/nav, same `article`/`prose reading`
body shape, same footer. Only the content fields and body HTML change.

### 4. `blog/index.html` listing update

Prepend a new `<a class="post-row">` block (matching the existing
`<!-- POST ROW TEMPLATE -->` comment already in the file) directly under
that comment, ahead of all older rows — newest first.

### 5. Homepage `#writing` preview update

The homepage's `<section class="sec" id="writing">` only ever shows the
single latest post. Replace its one `post-row`-equivalent block's `href`,
`datetime`, reading time, title, and excerpt with the new post's values.

### 6. `sitemap.xml` update

Add a new `<url>` entry for `blog/posts/<slug>.html` (`changefreq: yearly`,
`priority: 0.6`, matching the existing post entry), and bump `<lastmod>`
on the `/` and `/blog/` entries to today's date.

### 7. Git publish

`git add` the five touched/created files, commit (message: the post
title), `git push` to `origin main`. This is a direct, un-gated push per
the user's explicit choice (see Decisions).

## Error handling / edge cases

- **Slug collision**: append `-2`/`-3` suffix rather than overwrite.
- **LinkedIn post has no natural title/hook**: Claude generates one from
  the post's core point rather than failing.
- **Very short LinkedIn post** (a one-liner): still reshaped into a short
  post rather than skipped — length is not a gate, the user decides per
  post whether to invoke the skill at all.
- **Git push fails** (e.g. remote has diverged): surface the failure and
  stop — do not force-push. This is the one case where the "no review
  gate" decision doesn't apply, since a failed push means nothing went
  live and needs the user's attention.

## Testing

Manual end-to-end run: feed the skill a real (or sample) LinkedIn post,
confirm the generated `blog/posts/<slug>.html` renders correctly locally,
confirm `blog/index.html` and the homepage `#writing` section both show
the new post, confirm `sitemap.xml` is well-formed, then push and verify
the live Vercel deploy at `safwandotcom.xyz/blog/`.

## Out of scope

- Any LinkedIn embed/widget/iframe of the original post.
- Fetching or scraping LinkedIn after the fact.
- A scheduled/cron job — this is a same-session, on-demand skill.
- Images/media from the LinkedIn post (none of the current posts use
  them; add later if/when a real post needs it).

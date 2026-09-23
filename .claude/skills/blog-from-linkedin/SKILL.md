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

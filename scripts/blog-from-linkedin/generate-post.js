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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPostHtml({ title, slug, isoDate, longDate, metaDescription, eyebrow, bodyHtml, readingTime, linkedinUrl }) {
  const escapedTitle = escapeHtml(title);
  const escapedMetaDescription = escapeHtml(metaDescription);
  const escapedEyebrow = escapeHtml(eyebrow);
  const escapedLinkedinUrl = linkedinUrl ? escapeHtml(linkedinUrl) : null;

  const linkedinFooter = escapedLinkedinUrl
    ? `\n      <p><a href="${escapedLinkedinUrl}">Originally posted on LinkedIn →</a></p>`
    : '';

  const jsonLdObject = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": metaDescription,
    "image": "https://safwandotcom.xyz/og.png",
    "datePublished": isoDate,
    "dateModified": isoDate,
    "author": { "@type": "Person", "name": "Mohammed Safwanul Islam", "url": "https://safwandotcom.xyz/" },
    "publisher": { "@type": "Person", "name": "Mohammed Safwanul Islam" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `https://safwandotcom.xyz/blog/posts/${slug}.html` }
  };
  const jsonLdString = JSON.stringify(jsonLdObject, null, 2).replace(/<\//g, '<\\/');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapedTitle} — Safwanul</title>
<meta name="description" content="${escapedMetaDescription}">
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
<meta property="og:title" content="${escapedTitle}">
<meta property="og:description" content="${escapedMetaDescription}">
<meta property="og:url" content="https://safwandotcom.xyz/blog/posts/${slug}.html">
<meta property="og:image" content="https://safwandotcom.xyz/og.png">
<meta property="article:published_time" content="${isoDate}">
<meta property="article:author" content="Mohammed Safwanul Islam">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://safwandotcom.xyz/og.png">
<script type="application/ld+json">
${jsonLdString}
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
      <p class="eyebrow" style="margin-top:1.5rem">${escapedEyebrow}</p>
      <h1>${escapedTitle}</h1>
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

const ROW_MARKER = '<!-- POST ROW TEMPLATE — newest first -->';

function buildListingRowHtml({ title, slug, isoDate, longDate, excerpt, readingTime }) {
  return `      <a class="post-row" href="posts/${slug}.html">
        <div class="post-meta">
          <time datetime="${isoDate}">${longDate}</time>
          <span class="dot"></span>
          <span>${readingTime} min read</span>
        </div>
        <h2 class="post-title">${escapeHtml(title)}</h2>
        <p class="post-excerpt">${escapeHtml(excerpt)}</p>
        <span class="more">Read →</span>
      </a>`;
}

function prependListingRow(blogIndexHtml, rowHtml) {
  const idx = blogIndexHtml.indexOf(ROW_MARKER);
  if (idx === -1) {
    throw new Error('post-row marker comment not found in blog/index.html');
  }
  let insertAt = idx + ROW_MARKER.length;
  if (blogIndexHtml.slice(insertAt, insertAt + 2) === '\r\n') {
    insertAt += 2;
  } else if (blogIndexHtml[insertAt] === '\n') {
    insertAt += 1;
  }
  return `${blogIndexHtml.slice(0, insertAt)}${rowHtml}\n\n${blogIndexHtml.slice(insertAt)}`;
}

const WRITING_SECTION_START = '<section class="sec" id="writing">';

function buildHomepagePreviewHtml({ title, slug, isoDate, longDate, excerpt, readingTime }) {
  return `      <a href="blog/posts/${slug}.html" style="display:block;padding-block:clamp(1.4rem,3vw,1.9rem);border-bottom:1px solid var(--line);transition:background .18s var(--e)" onmouseover="this.style.background='var(--accent-soft)'" onmouseout="this.style.background='transparent'">
        <div style="display:flex;align-items:center;gap:.7rem;font-size:.8rem;color:var(--muted);margin-bottom:.5rem">
          <time datetime="${isoDate}">${longDate}</time>
          <span style="width:3px;height:3px;border-radius:50%;background:var(--line-2)"></span>
          <span>${readingTime} min read</span>
        </div>
        <h3 style="font-size:clamp(1.2rem,1rem + 1vw,1.55rem)">${escapeHtml(title)}</h3>
        <p style="color:var(--ink-2);margin-top:.4rem;max-width:60ch">${escapeHtml(excerpt)}</p>
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

  return before + section.replace(anchorPattern, previewHtml.trimStart()) + after;
}

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

module.exports = {
  slugify,
  uniqueSlug,
  estimateReadingTime,
  formatDateLong,
  escapeHtml,
  buildPostHtml,
  buildListingRowHtml,
  prependListingRow,
  buildHomepagePreviewHtml,
  replaceHomepageWritingBlock,
  addSitemapEntry,
};

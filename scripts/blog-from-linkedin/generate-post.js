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

module.exports = {
  slugify,
  uniqueSlug,
  estimateReadingTime,
  formatDateLong,
  buildPostHtml,
};

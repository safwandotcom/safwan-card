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

function todayIso(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

  // Build every output in memory first so a failure leaves the repo untouched.
  const blogIndexPath = path.join(repoRoot, 'blog', 'index.html');
  const homepagePath = path.join(repoRoot, 'index.html');
  const sitemapPath = path.join(repoRoot, 'sitemap.xml');

  const outputs = [
    [path.join(postsDir, `${slug}.html`), buildPostHtml(fields)],
    [blogIndexPath, prependListingRow(fs.readFileSync(blogIndexPath, 'utf8'), buildListingRowHtml(fields))],
    [homepagePath, replaceHomepageWritingBlock(fs.readFileSync(homepagePath, 'utf8'), buildHomepagePreviewHtml(fields))],
    [sitemapPath, addSitemapEntry(fs.readFileSync(sitemapPath, 'utf8'), { slug, isoDate: date })],
  ];

  for (const [filePath, content] of outputs) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

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

module.exports = { main, todayIso };

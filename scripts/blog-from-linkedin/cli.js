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

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

// Payload media: `images` is a list of paths (or { src, alt }); `video` is a path or { src, poster }.
// Relative paths resolve against the payload file's folder. Files are copied to blog/media/<slug>/.
function planMedia({ images, video, slug, title, payloadDir, repoRoot }) {
  const destDir = path.join(repoRoot, 'blog', 'media', slug);
  const copies = [];
  const place = (src, name) => {
    const from = path.resolve(payloadDir, src);
    if (!fs.existsSync(from)) throw new Error(`media file not found: ${from}`);
    const file = `${name}${path.extname(from).toLowerCase()}`;
    copies.push([from, path.join(destDir, file)]);
    return file;
  };

  const media = { images: [], video: null };
  images.forEach((img, i) => {
    const { src, alt } = typeof img === 'string' ? { src: img } : img;
    media.images.push({ file: place(src, String(i + 1)), alt: alt || `Photo ${i + 1} from "${title}"` });
  });
  if (video) {
    const { src, poster } = typeof video === 'string' ? { src: video } : video;
    media.video = { file: place(src, 'video'), poster: poster ? place(poster, 'video-poster') : null };
  }
  return { media, copies };
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
    images = [],
    video = null,
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

  const { media, copies } = planMedia({ images, video, slug, title, payloadDir: path.dirname(payloadPath), repoRoot });

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
    media,
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

  for (const [from, to] of copies) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  for (const [filePath, content] of outputs) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  console.log(`Created blog/posts/${slug}.html${copies.length ? ` (+${copies.length} media files in blog/media/${slug}/)` : ''}`);
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

const test = require('node:test');
const assert = require('node:assert/strict');
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
} = require('./generate-post');

test('slugify lowercases, hyphenates, and strips punctuation', () => {
  assert.equal(slugify('Why I Build in Public'), 'why-i-build-in-public');
  assert.equal(slugify('Shipping v2.0 — the messy middle!'), 'shipping-v2-0-the-messy-middle');
});

test('slugify drops apostrophes instead of hyphenating them', () => {
  assert.equal(slugify("Meeting UCSI's Leadership"), 'meeting-ucsis-leadership');
  assert.equal(slugify('Don’t Use It'), 'dont-use-it');
});

test('slugify strips accented characters', () => {
  assert.equal(slugify('Café Today'), 'cafe-today');
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

test('buildPostHtml escapes special characters in title, description, eyebrow, and linkedinUrl', () => {
  const html = buildPostHtml(samplePostFields({
    title: 'A "Test" & Post',
    metaDescription: 'Description with <tag> & "quotes"',
    eyebrow: 'Essay & Guide',
    linkedinUrl: 'https://example.com/posts?id=123&type="article"'
  }));

  // Check that escaped forms appear in attributes and content
  assert.match(html, /A &quot;Test&quot; &amp; Post/);
  assert.match(html, /Description with &lt;tag&gt; &amp; &quot;quotes&quot;/);
  assert.match(html, /Essay &amp; Guide/);
  assert.match(html, /id=123&amp;type=&quot;article&quot;/);

  // Check that raw unescaped versions do NOT appear in dangerous contexts
  assert.doesNotMatch(html, /<title>A "Test" & Post/);
  assert.doesNotMatch(html, /content="[^"]*<tag>[^"]*"/);
});

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

test('buildListingRowHtml escapes special characters in title and excerpt', () => {
  const row = buildListingRowHtml({
    title: 'A "Test" & Post',
    slug: 'test-post',
    isoDate: '2026-09-24',
    longDate: 'Sep 24, 2026',
    excerpt: 'Text with <tag> & "quotes".',
    readingTime: 2,
  });

  // Check that escaped forms appear in the HTML
  assert.match(row, /<h2 class="post-title">A &quot;Test&quot; &amp; Post<\/h2>/);
  assert.match(row, /<p class="post-excerpt">Text with &lt;tag&gt; &amp; &quot;quotes&quot;\.<\/p>/);

  // Check that raw unescaped versions do NOT appear
  assert.doesNotMatch(row, /<h2 class="post-title">A "Test" & Post<\/h2>/);
  assert.doesNotMatch(row, /excerpt">Text with <tag>/);
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

test('prependListingRow handles CRLF line endings correctly', () => {
  const fixture = `<div class="post-list">\r\n\r\n      <!-- POST ROW TEMPLATE — newest first -->\r\n      <a class="post-row" href="posts/old-post.html">\r\n        <h2 class="post-title">Old Post</h2>\r\n      </a>\r\n\r\n    </div>`;
  const newRow = `      <a class="post-row" href="posts/new-post.html">\r\n        <h2 class="post-title">New Post</h2>\r\n      </a>`;

  const updated = prependListingRow(fixture, newRow);
  const newIndex = updated.indexOf('posts/new-post.html');
  const oldIndex = updated.indexOf('posts/old-post.html');

  assert.ok(newIndex > -1 && oldIndex > -1);
  assert.ok(newIndex < oldIndex, 'new row should appear before the old row with CRLF line endings');
});

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

test('buildHomepagePreviewHtml escapes special characters in title and excerpt', () => {
  const block = buildHomepagePreviewHtml({
    title: 'A "Test" & Post',
    slug: 'test-post',
    isoDate: '2026-09-24',
    longDate: 'Sep 24, 2026',
    excerpt: 'Text with <tag> & "quotes".',
    readingTime: 2,
  });

  // Check that escaped forms appear in the HTML
  assert.match(block, /<h3 style="font-size:clamp\(1\.2rem,1rem \+ 1vw,1\.55rem\)">A &quot;Test&quot; &amp; Post<\/h3>/);
  assert.match(block, /<p style="color:var\(--ink-2\);margin-top:\.4rem;max-width:60ch">Text with &lt;tag&gt; &amp; &quot;quotes&quot;\.<\/p>/);

  // Check that raw unescaped versions do NOT appear in dangerous contexts
  assert.doesNotMatch(block, /<h3[^>]*>A "Test" & Post<\/h3>/);
  assert.doesNotMatch(block, /<p[^>]*>Text with <tag>/);
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
  assert.match(updated, /\n {6}<a href="blog\/posts\/new-post\.html"/, 'keeps the original indentation, not doubled');
});

test('replaceHomepageWritingBlock throws when #writing section is missing', () => {
  assert.throws(() => replaceHomepageWritingBlock('<html></html>', 'x'));
});

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

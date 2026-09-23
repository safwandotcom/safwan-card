const test = require('node:test');
const assert = require('node:assert/strict');
const {
  slugify,
  uniqueSlug,
  estimateReadingTime,
  formatDateLong,
  buildPostHtml,
} = require('./generate-post');

test('slugify lowercases, hyphenates, and strips punctuation', () => {
  assert.equal(slugify('Why I Build in Public'), 'why-i-build-in-public');
  assert.equal(slugify('Shipping v2.0 — the messy middle!'), 'shipping-v2-0-the-messy-middle');
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

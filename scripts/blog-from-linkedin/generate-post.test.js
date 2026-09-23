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

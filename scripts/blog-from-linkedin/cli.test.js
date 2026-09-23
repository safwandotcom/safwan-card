const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { main, todayIso } = require('./cli');

function makeFixtureRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-from-linkedin-'));
  fs.mkdirSync(path.join(repoRoot, 'blog', 'posts'), { recursive: true });

  fs.writeFileSync(
    path.join(repoRoot, 'blog', 'posts', 'why-i-build-in-public.html'),
    '<html><!-- existing post fixture --></html>'
  );

  fs.writeFileSync(
    path.join(repoRoot, 'blog', 'index.html'),
    `<div class="post-list">

      <!-- POST ROW TEMPLATE — newest first -->
      <a class="post-row" href="posts/why-i-build-in-public.html">
        <h2 class="post-title">Why I build in public</h2>
      </a>

    </div>`
  );

  fs.writeFileSync(
    path.join(repoRoot, 'index.html'),
    `<section class="sec" id="writing">
  <div class="wrap">
    <div class="reveal" style="border-top:1px solid var(--line)">
      <a href="blog/posts/why-i-build-in-public.html" style="display:block">
        <h3>Why I build in public</h3>
      </a>
    </div>
  </div>
</section>`
  );

  fs.writeFileSync(
    path.join(repoRoot, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
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
</urlset>
`
  );

  return repoRoot;
}

test('main() creates the post page and updates listing, homepage, and sitemap', () => {
  const repoRoot = makeFixtureRepo();
  const payloadPath = path.join(repoRoot, 'payload.json');
  fs.writeFileSync(
    payloadPath,
    JSON.stringify({
      title: 'A Fresh Test Post',
      metaDescription: 'A meta description for the fresh test post.',
      bodyHtml: '<p>Body content for the fresh test post.</p>',
      date: '2026-09-24',
    })
  );

  const result = main(payloadPath, { repoRoot });
  assert.equal(result.slug, 'a-fresh-test-post');

  const postPath = path.join(repoRoot, 'blog', 'posts', 'a-fresh-test-post.html');
  assert.ok(fs.existsSync(postPath));
  const postHtml = fs.readFileSync(postPath, 'utf8');
  assert.match(postHtml, /<h1>A Fresh Test Post<\/h1>/);

  const blogIndex = fs.readFileSync(path.join(repoRoot, 'blog', 'index.html'), 'utf8');
  assert.ok(blogIndex.indexOf('a-fresh-test-post.html') < blogIndex.indexOf('why-i-build-in-public.html'));

  const homepage = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
  assert.match(homepage, /blog\/posts\/a-fresh-test-post\.html/);
  assert.doesNotMatch(homepage, /blog\/posts\/why-i-build-in-public\.html/);

  const sitemap = fs.readFileSync(path.join(repoRoot, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /blog\/posts\/a-fresh-test-post\.html/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('main() throws a clear error when the payload is missing required fields', () => {
  const repoRoot = makeFixtureRepo();
  const payloadPath = path.join(repoRoot, 'payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify({ title: 'Missing fields' }));

  assert.throws(() => main(payloadPath, { repoRoot }), /must include title, metaDescription, and bodyHtml/);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('main() writes nothing when a later step fails', () => {
  const repoRoot = makeFixtureRepo();
  fs.writeFileSync(path.join(repoRoot, 'index.html'), '<html>no writing section</html>');
  const blogIndexBefore = fs.readFileSync(path.join(repoRoot, 'blog', 'index.html'), 'utf8');
  const payloadPath = path.join(repoRoot, 'payload.json');
  fs.writeFileSync(
    payloadPath,
    JSON.stringify({ title: 'Doomed Post', metaDescription: 'x', bodyHtml: '<p>x</p>', date: '2026-09-24' })
  );

  assert.throws(() => main(payloadPath, { repoRoot }), /#writing section not found/);
  assert.ok(!fs.existsSync(path.join(repoRoot, 'blog', 'posts', 'doomed-post.html')));
  assert.equal(fs.readFileSync(path.join(repoRoot, 'blog', 'index.html'), 'utf8'), blogIndexBefore);

  fs.rmSync(repoRoot, { recursive: true, force: true });
});

test('todayIso uses the local calendar date, not UTC', () => {
  assert.equal(todayIso(new Date(2026, 8, 24, 23, 59)), '2026-09-24');
  assert.equal(todayIso(new Date(2026, 0, 5, 0, 1)), '2026-01-05');
});

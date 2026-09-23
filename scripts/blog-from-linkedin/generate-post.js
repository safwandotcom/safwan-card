const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function slugify(title) {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
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

module.exports = {
  slugify,
  uniqueSlug,
  estimateReadingTime,
  formatDateLong,
};

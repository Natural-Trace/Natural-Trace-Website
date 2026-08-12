/* ---------------------------------------------------------------------------
   Did the news migration actually work?

   The first migration run stopped at article eight of sixteen and said nothing
   about it. Seven files appeared, the terminal scrolled, and from the outside
   that looks exactly like a finished job. This is the check that would have
   caught it in one command instead of by counting files by hand.

   It reads what is on disk. No network, so it can be run at any point, and it
   never contacts natural-trace.com. What it verifies:

     1  all sixteen articles from the archive are present
     2  every article has the front matter the layout and the index need
     3  every image an article points at is actually in the repository
     4  no article still loads anything from natural-trace.com, which is the
        domain being switched off
     5  every date carries a timezone offset, and they agree with each other

   Point 4 is the one that matters at cutover. An article that still points at
   natural-trace.com looks perfect today and loses its picture the moment the
   domain moves, which is the exact failure this whole migration exists to
   prevent, quietly reintroduced.

   Run with:  node scripts/check-news-migration.mjs
   Exits non-zero if anything is wrong, so it can go in a pre-deploy check.
--------------------------------------------------------------------------- */

import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const POSTS_DIR = 'src/insights';
const IMAGE_DIR = 'src/assets/images/insights';

/* The archive as it stood on 12 August 2026, read from the WordPress REST API
   and cross-checked against the sixteen article slugs already in
   src/_data/redirects.yml. If Kirsty publishes on WordPress after this date,
   add the slug here as well as re-running the migration, or this check will
   keep saying the archive is complete when it is not. */
const EXPECTED = [
  'singapore-based-startup-natural-trace-develops',
  'recent-regulations-driving-traceability-in-food-and-agriculture-sectors',
  'views-from-natural-trace-rise-in-food-fraud-suspicions',
  'dietary-supplement-recalls-tackling-fraud-counterfeits-and-fake-ingredients',
  'taking-a-byte-of-transparency-the-tech-behind-agri-food-traceability',
  'natural-trace-selected-as-a-finalist-for-the-fi-europe-2024-startup-challenge',
  'winners-fi-europe-startup-challenge-2024-most-innovative-service-or-digital-solution-supporting-the-fb-industry',
  'empowering-future-innovators-zoeys-journey-with-natural-trace',
  'dna-based-bio-code-offers-a-natural-tracer-for-detecting-food-fraud',
  'nutraceutical-focus-brochure-2025',
  'successful-traceability-trial-in-tasmanian-strawberries-with-natural-trace',
  'ingredient-integrity-supplement-brands',
  'natural-trace-appoints-dr-julia-lee-as-chief-executive-officer',
  'natural-trace-at-supplyside-global-2025',
  'natural-trace-vitafoods-europe-2026-recap',
  'natural-trace-announces-new-co-ceo-structure-to-accelerate-next-phase-of-global-growth',
];

const problems = [];
const notes = [];

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

const files = (await readdir(POSTS_DIR)).filter(f => f.endsWith('.md')).sort();
console.log(`${files.length} article(s) in ${POSTS_DIR}\n`);

const seenSlugs = new Set();
const offsets = new Map();

for (const file of files) {
  const raw = await readFile(join(POSTS_DIR, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) { problems.push(`${file}: no front matter`); continue; }
  const [, fm, body] = m;

  const field = name => {
    const hit = fm.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
    return hit ? hit[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };

  /* The slug is whatever follows the date prefix in the filename, which is how
     Eleventy builds the URL, so this is the real slug and not a guess. */
  const slugMatch = file.match(/^\d{4}-\d{2}-\d{2}-(.+)\.md$/);
  if (slugMatch) seenSlugs.add(slugMatch[1]);

  /* Front matter the layout and the index card both read. A missing summary is
     not cosmetic: it becomes the meta description, and healthcheck fails on a
     thin one. */
  for (const required of ['title', 'date', 'summary']) {
    if (!field(required)) problems.push(`${file}: no ${required}`);
  }

  const date = field('date');
  if (date) {
    if (!/[+-]\d{2}:\d{2}$/.test(date)) {
      problems.push(`${file}: date has no timezone offset, Eleventy will read it as UTC`);
    } else {
      const off = date.slice(-6);
      offsets.set(off, (offsets.get(off) || 0) + 1);
    }
    if (Number.isNaN(Date.parse(date))) problems.push(`${file}: date does not parse`);
  }

  /* The featured image, and every image inside the body. A path that is not on
     disk is a broken image on a live page. */
  const image = field('image');
  const bodyImages = [...body.matchAll(/src="([^"]+)"/g)].map(x => x[1]);
  for (const src of [image, ...bodyImages].filter(Boolean)) {
    if (src.startsWith('http')) {
      if (src.includes('natural-trace.com')) {
        problems.push(`${file}: still loads ${src}\n      that domain is being switched off, so this breaks at cutover`);
      } else {
        notes.push(`${file}: loads ${src} from a server we do not control`);
      }
      continue;
    }
    /* A site-relative src is /assets/... in the browser and src/assets/... on
       disk, because src/assets is what Eleventy copies to the site root. */
    const onDisk = join('src', src.replace(/^\//, ''));
    if (!(await exists(onDisk))) problems.push(`${file}: image not in the repo: ${src}`);
  }

  /* markdownTemplateEngine is njk, so an unwrapped body containing {{ or {%
     is a page that silently loses text or a build that fails. */
  const wrapped = body.includes('{% raw %}');
  if (!wrapped && /\{\{|\{%/.test(body)) {
    problems.push(`${file}: contains {{ or {% and is not wrapped in a raw block`);
  }
}

const missing = EXPECTED.filter(s => !seenSlugs.has(s));
if (missing.length) {
  problems.push(`${missing.length} article(s) from the archive never migrated:`);
  missing.forEach(s => problems.push(`      ${s}`));
}

if (offsets.size > 1) {
  notes.push(`articles do not agree on a timezone offset: `
    + [...offsets.entries()].map(([o, n]) => `${o} on ${n}`).join(', '));
}

console.log(`${seenSlugs.size} slug(s) found, ${EXPECTED.length - missing.length} of ${EXPECTED.length} from the archive\n`);

if (notes.length) {
  console.log('Worth knowing:');
  notes.forEach(n => console.log(`  - ${n}`));
  console.log('');
}

if (problems.length) {
  console.log(`${problems.length} problem(s):`);
  problems.forEach(p => console.log(`  - ${p}`));
  console.log('\nRe-run the migration:  node scripts/migrate-wordpress-news.mjs');
  process.exit(1);
}

console.log('All checks passed. Every article is present, every image is in the repo,');
console.log('and nothing still points at natural-trace.com.');

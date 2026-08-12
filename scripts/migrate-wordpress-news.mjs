/* ---------------------------------------------------------------------------
   Migrate the natural-trace.com news archive into this repository.

   WHY THIS IS A SCRIPT AND NOT A ONE-OFF COPY AND PASTE

   Sixteen articles, spread from May 2022 to July 2026, with images that live on
   natural-trace.com. When the domain moves to this site those image URLs stop
   resolving, so the images have to be brought into the repository, not linked
   to. Doing that by hand sixteen times invites sixteen chances to mistype a
   date, drop a paragraph, or forget an image.

   It is also re-runnable. Anything published on the WordPress site between now
   and the cutover gets picked up by running it again; existing files are left
   alone unless --force is passed. That matters because the cutover date is not
   fixed yet, and a migration that can only be done once has to be done last.

   WHAT IT DOES

     1  reads every published post from the WordPress REST API, paginated
     2  downloads each post's featured image, and every image inside the body,
        into src/assets/images/insights/
     3  rewrites those image URLs to site-relative paths
     4  writes src/insights/<date>-<slug>.md with front matter matching the
        three posts already in this folder
     5  writes _migration-report.md at the repo root with everything it did,
        every claim it flagged, and a ready-to-paste redirect block

   WHAT IT DOES NOT DO

   It does not rewrite a single word of the articles. The body is carried over
   as the HTML WordPress rendered, because markdown conversion is lossy and
   these are already-published texts. Markdown files pass HTML through, so this
   is faithful rather than lazy.

   It does not publish anything on its own. Everything it writes is a file in
   the working tree; nothing is committed and nothing is pushed.

   RUN IT

     node scripts/migrate-wordpress-news.mjs            normal run
     node scripts/migrate-wordpress-news.mjs --force    overwrite existing files
     node scripts/migrate-wordpress-news.mjs --dry-run  report only, write nothing

   Needs network access and Node 18 or newer for global fetch. Confirmed
   against Node 22 on the machine this repo lives on.
--------------------------------------------------------------------------- */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join, extname } from 'node:path';

/* Overridable so the script can be exercised against a local stand-in of the
   WordPress API without touching the live site. That is how it was tested:
   see the fixture run described at the bottom of this file's commit message. */
const API = process.env.WP_API || 'https://natural-trace.com/wp-json/wp/v2';
const POSTS_DIR = 'src/insights';
const IMAGE_DIR = 'src/assets/images/insights';
const IMAGE_URL_BASE = '/assets/images/insights';
const REPORT = '_migration-report.md';

const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry-run');

/* WordPress category slug to the tag vocabulary this site uses.
   Uncategorized is deliberately dropped rather than carried across: it is not
   a description of anything, and a tag page called Uncategorized is worse than
   no tag at all. */
const CATEGORY_TAGS = {
  'news': 'News',
  'press-release': 'Press Release',
  'research-blog': 'Research Blog',
};

/* Phrases that the 30 July copy review treated as claims needing sign-off.
   These articles predate that review, so anything matching is flagged in the
   front matter as a YAML comment. A YAML comment is stripped by the parser, so
   the flag is visible to anyone reading the source and invisible on the site.

   This is a net, not a judge. It is meant to over-flag: a false positive costs
   someone ten seconds, a miss puts an unreviewed claim on a live page. */
const CLAIM_PATTERNS = [
  [/\b\d+(\.\d+)?\s*%/g,                          'a percentage figure'],
  [/\bparts per (million|billion|trillion)\b/gi,  'a concentration claim'],
  [/\bppm\b|\bppb\b/g,                            'a concentration claim'],
  [/\bGRAS\b/g,                                   'a regulatory status claim'],
  [/\bFDA\b|\bSFA\b|\bISO\s*\d+/g,                'a regulatory or standards claim'],
  [/\bGMP\b|\bHACCP\b/g,                          'a certification claim'],
  [/\b(first|only|leading|world.s first)\b/gi,     'a superlative'],
  [/\b\d+\+?\s*(categories|matrices|products|clients|customers|partners)\b/gi,
                                                  'a countable claim'],
  [/\bpatent(ed|s)?\b/gi,                         'an intellectual property claim'],
  [/\bclinically\b|\bvalidated\b|\bproven\b/gi,   'an efficacy claim'],
];

const log = (...a) => console.log(...a);

/* WordPress returns titles and excerpts with HTML entities in them, and the
   front matter has to be plain text. This covers the entities WordPress's own
   texturisation produces; anything else is left alone rather than guessed at. */
function decodeEntities(s) {
  const named = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
    '&nbsp;': ' ', '&hellip;': '…', '&mdash;': '—', '&ndash;': '–',
    '&rsquo;': '’', '&lsquo;': '‘', '&rdquo;': '”', '&ldquo;': '“',
    '&trade;': '™', '&reg;': '®', '&copy;': '©',
  };
  return String(s)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-z]+;/gi, m => (m in named ? named[m] : m));
}

const stripTags = html => decodeEntities(String(html).replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

/* WordPress hands back two timestamps: date, in the site's own timezone, and
   date_gmt. Neither carries an offset, so writing either one straight into the
   front matter leaves Eleventy to guess, and it guesses UTC. For a post
   published at 09:00 Singapore time that shifts the displayed date back a day.

   The offset is not assumed. It is the difference between the two timestamps,
   which is exact and needs no knowledge of where the site is hosted. */
function isoWithOffset(post) {
  const local = post.date, gmt = post.date_gmt;
  if (!gmt) return local;
  const mins = Math.round((Date.parse(local + 'Z') - Date.parse(gmt + 'Z')) / 60000);
  const sign = mins < 0 ? '-' : '+';
  const a = Math.abs(mins);
  const pad = n => String(n).padStart(2, '0');
  return `${local}${sign}${pad(a / 60 | 0)}:${pad(a % 60)}`;
}

/* Quoted YAML for anything going into front matter. Single quotes, because a
   double-quoted YAML scalar processes backslash escapes and several of these
   titles contain none but might later. Doubling an internal quote is how YAML
   escapes it. */
const yamlString = s => `'${String(s).replace(/'/g, "''")}'`;

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function api(path) {
  const res = await fetch(`${API}${path}`, { headers: { 'User-Agent': 'natural-trace-migration' } });
  if (!res.ok) throw new Error(`${path} responded ${res.status}`);
  return res.json();
}

/* Walks the pagination rather than asking for everything at once. A single
   large page is one request that can fail wholesale; this fails on a page and
   says which one. */
async function allPosts() {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    let batch;
    try {
      batch = await api(`/posts?per_page=20&page=${page}&orderby=date&order=asc&_embed=wp:featuredmedia`);
    } catch (err) {
      /* WordPress answers a page past the end with a 400, which is the normal
         way this loop ends, not a failure. */
      if (String(err).includes('400')) break;
      throw err;
    }
    if (!batch.length) break;
    out.push(...batch);
    if (batch.length < 20) break;
  }
  return out;
}

let categoryNames = null;
async function categorySlugs(ids) {
  if (!categoryNames) {
    const cats = await api('/categories?per_page=100&_fields=id,slug');
    categoryNames = Object.fromEntries(cats.map(c => [c.id, c.slug]));
  }
  return (ids || []).map(id => categoryNames[id]).filter(Boolean);
}

/* Images.

   Saved under the post's slug so the filename says which article it belongs to
   and two posts cannot collide. Body images get a numeric suffix. The source
   extension is kept: converting formats here would mean a second tool and a
   quality decision that belongs to whoever is looking at the picture. */
const downloaded = new Map();

async function downloadImage(url, basename) {
  if (downloaded.has(url)) return downloaded.get(url);
  let ext = extname(new URL(url).pathname).toLowerCase();
  if (!/^\.(jpe?g|png|webp|gif|avif|svg)$/.test(ext)) ext = '.jpg';
  const filename = `${basename}${ext}`;
  const target = join(IMAGE_DIR, filename);
  const publicPath = `${IMAGE_URL_BASE}/${filename}`;

  if (!DRY) {
    if (FORCE || !(await exists(target))) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`image ${url} responded ${res.status}`);
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
      log(`    image  ${filename}  ${(res.headers.get('content-length') / 1024 | 0) || '?'}KB`);
    } else {
      log(`    image  ${filename}  already here, skipped`);
    }
  }
  downloaded.set(url, publicPath);
  return publicPath;
}

/* Body HTML.

   Three things happen and nothing else. WordPress block comments come out,
   because they are editor bookkeeping and mean nothing here. Images hosted on
   natural-trace.com come down and their src is rewritten, because that domain
   is the thing being moved away from. Everything else is left exactly as
   WordPress rendered it. */
async function processBody(html, slug) {
  let body = String(html).replace(/<!--\s*\/?wp:[^>]*-->/g, '');

  const srcs = [...body.matchAll(/src="(https?:\/\/natural-trace\.com\/wp-content\/uploads\/[^"]+)"/g)]
    .map(m => m[1]);
  let n = 0;
  for (const url of [...new Set(srcs)]) {
    const local = await downloadImage(url, `${slug}-${++n}`);
    body = body.split(url).join(local);
  }

  /* srcset points at the same images at other sizes. Nothing here serves those
     alternates, and leaving them in means the browser may pick a URL that is
     about to stop existing, which is the exact failure this migration is for. */
  body = body.replace(/\s+srcset="[^"]*"/g, '').replace(/\s+sizes="[^"]*"/g, '');

  const offsite = [...body.matchAll(/src="(https?:\/\/(?!natural-trace\.com)[^"]+)"/g)].map(m => m[1]);

  return { body: body.trim(), offsite: [...new Set(offsite)] };
}

function findClaims(text) {
  const plain = stripTags(text);
  const found = [];
  for (const [re, why] of CLAIM_PATTERNS) {
    for (const m of plain.matchAll(re)) {
      const start = Math.max(0, m.index - 60);
      found.push({ why, quote: plain.slice(start, m.index + m[0].length + 60).trim() });
      break;   /* one example per pattern is enough to send someone looking */
    }
  }
  return found;
}

/* ------------------------------------------------------------------------ */

log(`Reading ${API}/posts${DRY ? '   (dry run, nothing will be written)' : ''}`);
const posts = await allPosts();
log(`${posts.length} published post(s) found\n`);

if (!DRY) {
  await mkdir(POSTS_DIR, { recursive: true });
  await mkdir(IMAGE_DIR, { recursive: true });
}

const report = [];
let written = 0, skipped = 0;

for (const post of posts) {
  const slug = post.slug;
  const date = post.date.slice(0, 10);
  const filename = `${date}-${slug}.md`;
  const target = join(POSTS_DIR, filename);
  const title = decodeEntities(post.title?.rendered || slug);

  log(`${date}  ${title}`);

  if (!FORCE && await exists(target)) {
    log(`    already migrated, skipped\n`);
    skipped++;
    report.push({ date, slug, filename, title, status: 'skipped, already present', claims: [], offsite: [] });
    continue;
  }

  const media = post._embedded?.['wp:featuredmedia']?.[0];
  let image = null;
  if (media?.source_url) {
    try { image = await downloadImage(media.source_url, slug); }
    catch (err) { log(`    featured image failed: ${err.message}`); }
  }

  const { body, offsite } = await processBody(post.content?.rendered || '', slug);
  /* The summary becomes the page's meta description, so a thin one is a real
     defect rather than a cosmetic one: scripts/healthcheck.mjs fails the build
     on it, and a search result with no description is a search result nobody
     clicks. WordPress excerpts are optional and several of these are empty or
     a single clause, so a short one falls back to the opening of the article,
     cut at a word boundary. */
  let summary = stripTags(post.excerpt?.rendered || '').replace(/\s*\[…\]\s*$/, '').trim();
  if (summary.length < 70) {
    const opening = stripTags(post.content?.rendered || '');
    if (opening.length > summary.length) {
      summary = opening.length <= 200 ? opening
        : opening.slice(0, 197).replace(/\s+\S*$/, '') + '…';
    }
  }
  const cats = await categorySlugs(post.categories);
  const tags = cats.map(c => CATEGORY_TAGS[c]).filter(Boolean);
  const claims = findClaims(post.content?.rendered || '');

  const fm = [
    '---',
    'layout: layouts/post.njk',
    `title: ${yamlString(title)}`,
    `date: ${isoWithOffset(post)}`,
    `author: 'Natural Trace'`,
    summary ? `summary: ${yamlString(summary)}` : null,
    image ? `image: ${image}` : null,
    tags.length ? 'tags:' : null,
    ...tags.map(t => `  - ${yamlString(t)}`),
    '',
    `# Migrated from natural-trace.com on ${new Date().toISOString().slice(0, 10)} by`,
    '# scripts/migrate-wordpress-news.mjs. The body below is the HTML WordPress',
    '# rendered, carried over unchanged. Image paths are the only edit: they',
    '# pointed at natural-trace.com, which is the domain being moved away from.',
    `# Original URL: https://natural-trace.com/${slug}/`,
    claims.length ? '#' : null,
    claims.length ? `# CLAIM REVIEW: ${claims.length} phrase(s) here predate the 30 July 2026 copy` : null,
    claims.length ? '# review and are not signed off. Listed in _migration-report.md.' : null,
    ...claims.map(c => `#   ${c.why}: ...${c.quote}...`),
    '---',
    '',
  ].filter(x => x !== null).join('\n');

  /* The raw block is not optional.

     markdownTemplateEngine is njk in .eleventy.js, so every markdown file is
     run through Nunjucks before markdown. A WordPress article containing {{ or
     {% anywhere in it, in a quoted price, a code sample, a set of curly braces
     in a product name, would be read as a template expression: at best the
     text vanishes, at worst the build fails on a page nobody was looking at.
     These are third-party texts nobody is going to re-read for brace
     characters, so the escape is applied to all of them rather than to the
     ones that happen to need it today. */
  const wrapped = `{% raw %}\n${body}\n{% endraw %}\n`;
  if (!DRY) await writeFile(target, fm + wrapped, 'utf8');
  log(`    wrote ${filename}${claims.length ? `  (${claims.length} claim flag(s))` : ''}\n`);
  written++;
  report.push({ date, slug, filename, title, status: 'migrated', claims, offsite, image });
}

/* ------------------------------------------------------------------------ */

const flagged = report.filter(r => r.claims.length);
const offsiteAll = report.filter(r => r.offsite.length);

const lines = [
  '# WordPress news migration report',
  '',
  `Run ${new Date().toISOString()}.`,
  `${posts.length} post(s) on natural-trace.com, ${written} written, ${skipped} already present.`,
  '',
  'This file is scratch. `.gitignore` catches anything at the repo root starting',
  'with an underscore, so it is not committed.',
  '',
  '## Articles',
  '',
  '| Date | Title | File | Featured image |',
  '| --- | --- | --- | --- |',
  ...report.map(r => `| ${r.date} | ${r.title.replace(/\|/g, '\\|')} | \`${r.filename}\` | ${r.image ? '`' + r.image + '`' : 'none'} |`),
  '',
  '## Claims to review',
  '',
  flagged.length
    ? 'These predate the 30 July 2026 copy review. Nothing was reworded. Each is also'
      + ' flagged as a comment in that article\'s front matter, where it is visible in'
      + ' the source and invisible on the site.'
    : 'None matched.',
  '',
  ...flagged.flatMap(r => [`### ${r.title}`, '', `\`${r.filename}\``, '',
    ...r.claims.map(c => `- **${c.why}** ...${c.quote}...`), '']),
  '## Images still hosted elsewhere',
  '',
  offsiteAll.length
    ? 'These are inside article bodies and point at servers we do not control. They'
      + ' survive the cutover only for as long as somebody else chooses to keep them.'
    : 'None. Every image is in the repository.',
  '',
  ...offsiteAll.flatMap(r => [`- \`${r.filename}\``, ...r.offsite.map(u => `    - ${u}`)]),
  '',
  '## Redirects',
  '',
  'The old URLs currently all land on the Insights index. Now that the articles',
  'exist, they should land on the article. Paste into `src/_data/redirects.yml`,',
  'replacing the matching entries.',
  '',
  '```yaml',
  ...report.flatMap(r => [
    `  - from: "/${r.slug}/"`,
    `    to: "/insights/${r.date}-${r.slug}/"`,
  ]),
  '```',
  '',
];

if (!DRY) await writeFile(REPORT, lines.join('\n'), 'utf8');

log('---');
log(`${written} written, ${skipped} skipped, ${downloaded.size} image(s) downloaded`);
log(`${flagged.length} article(s) carry a claim flag`);
if (offsiteAll.length) log(`${offsiteAll.length} article(s) still load an image from another server`);
log(DRY ? 'Dry run: nothing was written.' : `Report: ${REPORT}`);

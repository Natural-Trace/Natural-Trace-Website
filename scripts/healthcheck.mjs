/**
 * Post-build health check. No dependencies.
 *
 *   npx @11ty/eleventy && node scripts/healthcheck.mjs _site
 *   node scripts/healthcheck.mjs _site --external   (also pings outbound links)
 *
 * Run it against a FULL build. SKIP_ASSETS=1 omits assets and every asset
 * reference will look broken.
 *
 * Fails the build if the site would ship broken. Run in CI on every push and
 * on a schedule, so a dead link or a silently missing page surfaces on its own
 * rather than when someone happens to click it.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const ROOT = process.argv[2] || '_site';
const CHECK_EXTERNAL = process.argv.includes('--external');
const problems = [];
const note = (m) => problems.push(m);

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = await walk(ROOT);
const pages = files.filter((f) => f.endsWith('.html') && !f.includes(`${ROOT}/admin/`));

// ── 1. every page must exist and carry the basics
const REQUIRED = ['/', '/about/', '/naturaltag/', '/naturaldetect/', '/naturalcloud/',
                  '/industries/', '/industries/use-cases/', '/faq/', '/team/',
                  '/careers/', '/insights/', '/contact/', '/privacy/'];
for (const url of REQUIRED) {
  const f = join(ROOT, url === '/' ? 'index.html' : `${url}index.html`);
  if (!existsSync(f)) note(`missing page: ${url}`);
}
if (!existsSync(join(ROOT, '404.html'))) note('missing 404.html');
if (!existsSync(join(ROOT, 'sitemap.xml'))) note('missing sitemap.xml');
if (!existsSync(join(ROOT, 'robots.txt'))) note('missing robots.txt');
if (!existsSync(join(ROOT, 'llms.txt'))) note('missing llms.txt');

// ── 2. internal links resolve
const externals = new Set();
for (const f of pages) {
  const html = await readFile(f, 'utf8');
  const page = '/' + relative(ROOT, f).replace(/index\.html$/, '').replace(/\\/g, '/');

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(mailto:|tel:|javascript:|#|data:)/.test(raw)) continue;
    if (/^https?:\/\//.test(raw) || raw.startsWith('//')) { externals.add(raw.replace(/^\/\//, 'https://')); continue; }
    // The site's own origin appears in canonicals and Open Graph tags. It is
    // not an outbound link and pinging it from CI tells us nothing.
    const clean = raw.split(/[?#]/)[0];
    if (!clean) continue;
    const abs = clean.startsWith('/') ? join(ROOT, clean) : join(dirname(f), clean);
    const ok = existsSync(abs) || existsSync(join(abs, 'index.html')) || existsSync(`${abs}.html`);
    if (!ok) note(`broken link on ${page}: ${raw}`);
  }

  // ── 3. SEO basics. Redirect stubs are noindex by design, so they are exempt.
  // data-hold="site" is the site-wide search hold, not a page that is meant to
  // stay out of the index. Keep checking those pages, or the hold would quietly
  // switch off every SEO check on the site.
  const noindex = /name="robots"[^>]*noindex/.test(html) && !/data-hold="site"/.test(html);
  if (!noindex) {
  if (!/<title>.{10,}<\/title>/s.test(html)) note(`missing or thin <title>: ${page}`);
  const desc = html.match(/<meta name="description" content="([^"]*)"/);
  if (!desc || desc[1].length < 50) note(`missing or thin meta description: ${page}`);
  else if (desc[1].length > 165) note(`meta description too long (${desc[1].length}): ${page}`);
  if (!/rel="canonical"/.test(html)) note(`missing canonical: ${page}`);
  }

  // ── 4. structured data must parse
  for (const s of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { JSON.parse(s[1]); } catch (e) { note(`invalid JSON-LD on ${page}: ${e.message.slice(0, 60)}`); }
  }
}

// ── 4b. every redirect target resolves, and no stub leaks into the sitemap
const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8').catch(() => '');
let stubs = 0;
for (const f of pages) {
  const html = await readFile(f, 'utf8');
  const m = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/);
  if (!m) continue;
  stubs++;
  const from = '/' + relative(ROOT, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  const target = m[1].split('#')[0];
  const abs = join(ROOT, target);
  if (!existsSync(abs) && !existsSync(join(abs, 'index.html'))) note(`redirect ${from} points at missing ${m[1]}`);
  if (sitemap.includes(`<loc>${''}` ) && sitemap.includes(from + '</loc>')) note(`redirect stub in sitemap: ${from}`);
}
console.log(`  ${stubs} redirect stubs`);

// ── 5. the contact form still exists and still has somewhere to send to
const contact = await readFile(join(ROOT, 'contact/index.html'), 'utf8').catch(() => '');
if (!/<form/i.test(contact)) note('contact page has no <form>');
if (!/mailto:|hs-portal="[^"]+"/.test(contact)) note('contact form has no HubSpot portal and no mailto fallback');

// ── 6. optional external link check
//
// This runs weekly rather than on every push, so it has to be trustworthy: a
// check that cries wolf every Monday gets filtered into a folder nobody opens,
// and then the week it is right, nobody looks. The first scheduled run
// reported five problems and four of them were not problems at all. Hence the
// three rules below.
if (CHECK_EXTERNAL) {
  // 1. Our own origin. It shows up in canonical tags, Open Graph URLs and the
  //    404 page. It is this site, not an outbound link.
  //    Read from the canonical tag the build wrote, so it follows the site to a
  //    custom domain without anyone remembering to update this file.
  const ownOrigin = await (async () => {
    for (const f of pages) {
      const m = /<link rel="canonical" href="(https?:\/\/[^"]+)"/.exec(await readFile(f, 'utf8'));
      if (m) { try { return new URL(m[1]).origin; } catch { /* keep looking */ } }
    }
    return null;
  })();

  // 2. Resource hints. <link rel="preconnect" href="https://fonts.gstatic.com">
  //    is an instruction to open a connection early, not a page. Requesting the
  //    bare origin returns 404 by design, which says nothing about whether the
  //    font loads.
  const hintOrigins = new Set();
  for (const f of pages) {
    const html = await readFile(f, 'utf8');
    for (const m of html.matchAll(/<link[^>]+rel="(?:preconnect|dns-prefetch|preload)"[^>]*>/g)) {
      const href = /href="([^"]+)"/.exec(m[0]);
      if (href) hintOrigins.add(href[1].replace(/\/$/, ''));
    }
  }

  // 3. Hosts that refuse automated requests on principle. LinkedIn answers a
  //    bot with 429 or 403 whether the page exists or not, so a failure from
  //    one of these is information about their bot policy and nothing else.
  //    Reported, never failed, so a genuinely dead link still gets eyes on it.
  const BOT_HOSTILE = [/(^|\.)linkedin\.com$/, /(^|\.)licdn\.com$/, /(^|\.)x\.com$/, /(^|\.)twitter\.com$/];

  const unverified = [];
  for (const url of externals) {
    let u;
    try { u = new URL(url); } catch { note(`malformed link: ${url}`); continue; }
    if (ownOrigin && u.origin === ownOrigin) continue;
    if (hintOrigins.has(url.replace(/\/$/, ''))) continue;

    const hostile = BOT_HOSTILE.some(re => re.test(u.hostname));
    try {
      const r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (r.status >= 400) {
        if (hostile) unverified.push(`${u.hostname} answered ${r.status} to an automated request: ${url}`);
        else note(`external link ${r.status}: ${url}`);
      }
    } catch {
      if (hostile) unverified.push(`${u.hostname} did not answer an automated request: ${url}`);
      else note(`external link unreachable: ${url}`);
    }
  }

  if (unverified.length) {
    console.log(`\n${unverified.length} link(s) could not be verified automatically, check by hand if they matter:`);
    for (const u of unverified) console.log('  - ' + u);
  }
}

const hotlinked = [];

// ── 7. images hotlinked from someone else's server
//
// Added after an Insights header image vanished from the live site. It was
// pointed straight at LinkedIn's CDN, and that URL carried an expiry stamp of
// 30 July 2026. On 31 July the article started showing a broken image and
// nothing in the build had changed, so nothing flagged it.
//
// Anything with an expiry baked into the query string is a deadline, not a
// link. Fail on it while it is still fixable.
for (const f of pages) {
  const html = await readFile(f, 'utf8');
  const page = '/' + relative(ROOT, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  for (const m of html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g)) {
    const src = m[1];
    const expiry = /[?&](?:e|expires|Expires|X-Amz-Expires)=(\d{9,})/.exec(src);
    if (expiry) {
      const when = new Date(Number(expiry[1]) * 1000);
      const past = when < new Date();
      note(`${page} shows an image on a signed URL that ${past ? 'expired' : 'expires'} ${when.toISOString().slice(0, 10)}: ${src.slice(0, 70)}...`);
      continue;
    }
    // No expiry stamp, but still someone else's server. A social CDN can drop
    // an image when a post is edited or removed, and the ones worth worrying
    // about refuse automated requests, so nothing here can watch them for us.
    // Listed rather than failed: these work today, and blocking a deploy over
    // an image that currently loads helps nobody.
    if (/(^|\.)(licdn|twimg|fbcdn|cdninstagram)\.com$/.test(new URL(src).hostname)) {
      hotlinked.push(`${page} loads its image from ${new URL(src).hostname}, which we do not control`);
    }
  }
}
if (hotlinked.length) {
  console.log(`\n${hotlinked.length} image(s) hosted on someone else's server:`);
  for (const h of hotlinked) console.log('  - ' + h);
  console.log('  Save these into the site instead, through the CMS, so they cannot disappear.');
}

console.log(`checked ${pages.length} pages, ${externals.size} external links${CHECK_EXTERNAL ? '' : ' (skipped)'}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('all checks passed');

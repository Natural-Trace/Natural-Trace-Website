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
/* Separators normalised before the admin folder is excluded. Windows walks
   this tree as _site\admin\index.html, which does not contain "_site/admin/",
   so the CMS page was skipped on Linux and checked on Windows. A check that
   examines a different set of pages depending on who runs it is worse than one
   that is simply wrong, because CI stays green while a developer's machine
   reports a fault nobody else can reproduce. */
const pages = files.filter((f) =>
  f.endsWith('.html') && !f.replace(/\\/g, '/').includes(`${ROOT}/admin/`));

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
/* A URL is percent-encoded; a filename on disk is not. Several assets have
   spaces in their names, so the CMS logo went into the HTML as
   NT%20icon%20without%20logo.png and this check looked on disk for a file
   called exactly that. It reported a broken link against a file that was
   sitting right there. Any asset with a space, a comma or an ampersand in its
   name would have done the same.

   Wrapped, because decodeURIComponent throws on a lone % rather than returning
   the string, and one malformed href should not end the run. */
function decodePath(p) {
  try { return decodeURIComponent(p); } catch { return p; }
}

const externals = new Set();
/* Collected while walking the pages, resolved once every page has been read. */
const fragmentLinks = [];
for (const f of pages) {
  const html = await readFile(f, 'utf8');
  const page = '/' + relative(ROOT, f).replace(/index\.html$/, '').replace(/\\/g, '/');

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(mailto:|tel:|javascript:|#|data:)/.test(raw)) continue;
    if (/^https?:\/\//.test(raw) || raw.startsWith('//')) { externals.add(raw.replace(/^\/\//, 'https://')); continue; }
    // The site's own origin appears in canonicals and Open Graph tags. It is
    // not an outbound link and pinging it from CI tells us nothing.
    const clean = decodePath(raw.split(/[?#]/)[0]);
    if (!clean) continue;
    const abs = clean.startsWith('/') ? join(ROOT, clean) : join(dirname(f), clean);
    const ok = existsSync(abs) || existsSync(join(abs, 'index.html')) || existsSync(`${abs}.html`);
    if (!ok) { note(`broken link on ${page}: ${raw}`); continue; }

    /* The page exists. Does the part after the # exist on it?
       This is not pedantry. How It Works moved off the NaturalTag page on
       8 Aug and the homepage's "See how it works" link kept pointing at
       /naturaltag/#how-it-works, an anchor that had gone with it. The link
       resolved, the page loaded, and the reader landed at the top of a page
       that no longer contained what they clicked for. Nothing complained,
       because the file was still there. The nav alone carries seven of these. */
    const frag = raw.split('#')[1];
    if (frag) fragmentLinks.push({ page, raw, frag: decodePath(frag), abs });
  }

  /* ── 2b. images set through CSS, not through a src attribute.
     Three backgrounds on this site are handed to the stylesheet as custom
     properties: the homepage hero, the call-to-action watermark and the Why We
     Exist photograph. The loop above only looks at href and src, so a custom
     property pointing at a file that does not exist passed every check and
     rendered as a blank section, with the CMS field appearing to do nothing.
     That is exactly what happened on 12 Aug: the Why We Exist background was
     written as /assets/images/kirsty/vision.webp after the kirsty folder had
     already been flattened away in fa5e925.

     Query strings and fragments are stripped the same way as above, and remote
     URLs join the external list rather than being resolved on disk. */
  for (const m of html.matchAll(/--[\w-]+\s*:\s*url\((['"]?)([^'")]+)\1\)/g)) {
    const raw = m[2].trim();
    if (/^(data:|#)/.test(raw)) continue;
    if (/^https?:\/\//.test(raw) || raw.startsWith('//')) { externals.add(raw.replace(/^\/\//, 'https://')); continue; }
    const clean = decodePath(raw.split(/[?#]/)[0]);
    if (!clean) continue;
    const abs = clean.startsWith('/') ? join(ROOT, clean) : join(dirname(f), clean);
    if (!existsSync(abs)) note(`broken CSS background on ${page}: ${raw}`);
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

// ── 4c. every #fragment resolves to an id on the page it points at
for (const { page, raw, frag, abs } of fragmentLinks) {
  const target = existsSync(join(abs, 'index.html')) ? join(abs, 'index.html')
    : existsSync(`${abs}.html`) ? `${abs}.html` : abs;
  if (!target.endsWith('.html')) continue;          // a link to a PDF or an image
  const html = await readFile(target, 'utf8').catch(() => '');
  /* id="x", id='x' and the bare id=x an editor might paste. name= too, which
     is still legal as an anchor target. */
  const found = new RegExp(`(?:id|name)=["']?${frag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\\s>]`).test(html);
  if (!found) note(`link to a missing anchor on ${page}: ${raw}`);
}

// ── 4b. every redirect target resolves, and no stub leaks into the sitemap
const sitemap = await readFile(join(ROOT, 'sitemap.xml'), 'utf8').catch(() => '');
/* Paths, not raw XML.
   This used to test sitemap.includes(from + '</loc>'), which is a substring
   match on the whole document and therefore matches any longer URL ending the
   same way. The moment the migrated archive gave the Insights tag pages real
   content, /insights/tag/news/ started matching the /tag/news/ redirect stub
   and the build failed on a page that was completely fine.

   The first half of that condition, sitemap.includes('<loc>'), compared the
   document against an empty template string and was always true. It never
   tested anything. */
const sitemapPaths = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(m => { try { return new URL(m[1]).pathname; } catch { return m[1]; } })
);
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
  /* A stub is a page that only exists to bounce; listing it in the sitemap
     asks a search engine to index a redirect. Compared as whole paths, and
     with the path prefix allowed for, since the sitemap carries absolute URLs
     and this walks the built directory. */
  const prefixed = [from, (process.env.PATH_PREFIX || '/').replace(/\/$/, '') + from];
  if (prefixed.some(x => sitemapPaths.has(x))) note(`redirect stub in sitemap: ${from}`);
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

  // 3. Hosts that do not answer an automated request the way they answer a
  //    person. LinkedIn returns 429 or 403 to a bot whether the page exists or
  //    not; Forbes blocks datacentre address ranges, which is every CI runner;
  //    the German ministry site refuses the connection outright from GitHub's
  //    IP ranges while serving fine from a browser. A failure from one of these
  //    is information about their traffic policy and nothing about our link.
  //    Reported, never failed, so a genuinely dead link still gets eyes on it.
  //
  //    All three were verified by hand on 18 Aug 2026: every one loads normally
  //    in a browser. Do not delete a link because this list grew; check it
  //    first.
  const BOT_HOSTILE = [
    /(^|\.)linkedin\.com$/,
    /(^|\.)lnkd\.in$/,          // LinkedIn's own shortener, same policy
    /(^|\.)licdn\.com$/,
    /(^|\.)x\.com$/,
    /(^|\.)twitter\.com$/,
    /(^|\.)forbes\.com$/,
    /(^|\.)csr-in-deutschland\.de$/,
    /(^|\.)fda\.gov$/,           // Akamai answers a datacentre GET with 401
  ];

  const unverified = [];
  for (const url of externals) {
    let u;
    try { u = new URL(url); } catch { note(`malformed link: ${url}`); continue; }
    if (ownOrigin && u.origin === ownOrigin) continue;
    if (hintOrigins.has(url.replace(/\/$/, ''))) continue;

    const hostile = BOT_HOSTILE.some(re => re.test(u.hostname));
    try {
      /* HEAD first, because it is cheap and most servers answer it. A fair
         number answer it with 403 or 405 while serving the same URL to GET:
         HEAD is optional in practice and some CDN rules treat it as a scraper
         signal. So a HEAD failure is not yet a finding. Retry once with GET
         before saying anything, and believe the GET. */
      let r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (r.status >= 400) {
        try {
          r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000) });
        } catch { /* keep the HEAD result, reported below */ }
      }
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

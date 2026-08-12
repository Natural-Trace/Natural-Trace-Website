/* ---------------------------------------------------------------------------
   Layout audit.

   The health check proves every page builds, every link resolves and the
   metadata is present. It cannot see a heading cut in half by its container,
   two paragraphs printed on top of each other, or a table shoving the page
   sideways on a phone. Those only surface when a person looks, and nobody
   looks at seventeen pages across six widths.

   This loads every page in a real browser at six widths and reports three
   things:

     CLIPPED   text that is drawn but not visible, because an ancestor with
               overflow hidden cuts it off
     OVERFLOW  text pushing the page wider than the window, which is what
               causes sideways scrolling on a phone
     OVERLAP   two runs of text physically on top of each other
     WRAPPED   an element marked data-single-line that has broken onto two

   It measures the text itself, not the boxes around it.

   That distinction is the whole point, and it was learned the hard way. The
   first version of this script compared scrollWidth against clientWidth on
   every element. It found nothing on the homepage hero, where the H1 was
   visibly sliced in half, because .hero-line-inner carries white-space:nowrap:
   the box was exactly as wide as its column and reported healthy, while the
   text inside it ran straight past the edge and was clipped by the parent. A
   box can be the right size and still show the wrong thing. So every check
   below starts from a Range around the actual characters.

   Run with:  node scripts/layout-audit.mjs
   Needs a built site in _site, playwright, and @fontsource/montserrat, which is
   how the real webfont is served to the browser without a network call. Exits
   non-zero if it finds anything.
--------------------------------------------------------------------------- */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { readFile, stat, readdir } from 'node:fs/promises';
import { useLocalMontserrat } from './lib/local-fonts.mjs';

const ROOT = '_site';
const PORT = 8123;

const VIEWPORTS = [
  [390, 844, 'iPhone'],
  [430, 932, 'iPhone Max'],
  [768, 1024, 'tablet'],
  [1024, 768, 'small laptop'],
  [1440, 900, 'laptop'],
  [1920, 1080, 'desktop'],
];

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain',
};

function serve() {
  return new Promise(resolve => {
    const s = createServer(async (req, res) => {
      const p = normalize(decodeURIComponent(req.url.split('?')[0]));
      let f = join(ROOT, p);
      try {
        if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
      } catch { res.writeHead(404); return res.end(); }
      try {
        const body = await readFile(f);
        res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    });
    s.listen(PORT, () => resolve(s));
  });
}

/* Every page that is a page. Redirect stubs are excluded: they are three lines
   of meta refresh and nobody reads them. */
async function findPages(dir = ROOT, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await findPages(full, out);
    else if (entry.name === 'index.html') {
      const html = await readFile(full, 'utf8');
      if (/http-equiv=["']refresh/i.test(html)) continue;
      const rel = full.slice(ROOT.length, -'index.html'.length) || '/';
      out.push(rel);
    }
  }
  return out.sort();
}

/* Runs inside the page. One function because it is serialised across. */
function inspect() {
  const findings = [];
  const vw = window.innerWidth;
  const docScrolls = document.documentElement.scrollWidth > vw + 1;

  const styleCache = new WeakMap();
  const cs = el => {
    let v = styleCache.get(el);
    if (!v) { v = getComputedStyle(el); styleCache.set(el, v); }
    return v;
  };

  const describe = el => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return el.tagName.toLowerCase() + id + cls;
  };

  /* Things that are meant to be out of sight, and are not defects:

     - a honeypot field, which exists precisely to be invisible to people
     - the cookie banner once dismissed
     - a collapsed accordion answer, hidden behind max-height 0
     - anything explicitly hidden from assistive technology
     - the partner logo rail, which is wider than its window on purpose and
       animates through it

     Without this list the run is mostly noise, and a report that is mostly
     noise gets ignored, which is worse than no report. */
  const deliberatelyHidden = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const c = cs(n);
      if (c.visibility === 'hidden' || c.display === 'none') return true;
      if (parseFloat(c.opacity) === 0) return true;
      if (c.clipPath && c.clipPath !== 'none') return true;
      if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return true;
      if (c.animationName && c.animationName !== 'none') return true;
      /* A closed <details>. Chromium keeps the subtree in the tree so that
         find-in-page can reach it, and a Range around that text still returns
         rectangles, so it looks like clipped content unless it is excluded
         here. The summary itself is visible and stays in scope. */
      if (n.tagName === 'DETAILS' && !n.open && !el.closest('summary')) return true;
      const r = n.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return true;
      /* Collapsed by a max-height transition, the usual accordion pattern. */
      if (c.maxHeight !== 'none' && parseFloat(c.maxHeight) === 0) return true;
      /* Parked off-screen. */
      if (c.position === 'absolute' && (r.right < 0 || r.bottom < 0)) return true;
    }
    return false;
  };

  /* Every run of real text on the page, with the rectangle the characters
     actually occupy. */
  const runs = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(parent.tagName)) continue;
    if (deliberatelyHidden(parent)) continue;

    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const ink = {
      left: Math.min(...rects.map(r => r.left)),
      right: Math.max(...rects.map(r => r.right)),
      top: Math.min(...rects.map(r => r.top)),
      bottom: Math.max(...rects.map(r => r.bottom)),
    };
    runs.push({ parent, text, ink, rects });
  }

  /* 1. Text an ancestor is cutting off. */
  for (const run of runs) {
    let visibleLeft = run.ink.left, visibleRight = run.ink.right;
    let visibleTop = run.ink.top, visibleBottom = run.ink.bottom;
    let culprit = null;

    for (let n = run.parent; n && n !== document.body; n = n.parentElement) {
      const c = cs(n);
      const clipsX = c.overflowX === 'hidden' || c.overflowX === 'clip';
      const clipsY = c.overflowY === 'hidden' || c.overflowY === 'clip';
      if (!clipsX && !clipsY) continue;
      const b = n.getBoundingClientRect();
      if (clipsX && (b.left > visibleLeft || b.right < visibleRight)) {
        visibleLeft = Math.max(visibleLeft, b.left);
        visibleRight = Math.min(visibleRight, b.right);
        culprit = culprit || n;
      }
      if (clipsY && (b.top > visibleTop || b.bottom < visibleBottom)) {
        visibleTop = Math.max(visibleTop, b.top);
        visibleBottom = Math.min(visibleBottom, b.bottom);
        culprit = culprit || n;
      }
    }

    const full = (run.ink.right - run.ink.left) * (run.ink.bottom - run.ink.top);
    const shown = Math.max(0, visibleRight - visibleLeft) * Math.max(0, visibleBottom - visibleTop);
    if (culprit && full > 0 && shown / full < 0.97) {
      findings.push({
        kind: 'CLIPPED',
        el: describe(run.parent),
        by: describe(culprit),
        lost: Math.round((1 - shown / full) * 100) + '%',
        text: run.text.slice(0, 60),
      });
    }
  }

  /* 2. Text making the page scroll sideways. Only counted when the document
        genuinely scrolls, because a decorative element hanging off the edge
        under an overflow-hidden parent harms nobody. */
  if (docScrolls) {
    for (const run of runs) {
      if (run.ink.right > vw + 1) {
        findings.push({ kind: 'OVERFLOW', el: describe(run.parent),
          by: Math.round(run.ink.right - vw) + 'px past the right edge',
          text: run.text.slice(0, 60) });
      }
    }
  }

  /* 3. Anything the design says must hold one line, holding two. Wrapping is
        normally correct behaviour, so this is opt-in: put data-single-line on
        the element and the check enforces it at every width. It exists because
        the hero headline breaking across three lines was a real fault that no
        general rule would ever have called a fault. */
  for (const el of document.querySelectorAll('[data-single-line]')) {
    if (deliberatelyHidden(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter(r => r.width > 1);
    if (!rects.length) continue;
    const lines = new Set(rects.map(r => Math.round(r.top))).size;
    if (lines > 1) {
      findings.push({ kind: 'WRAPPED', el: describe(el), by: `${lines} lines`,
        text: (el.textContent || '').trim().slice(0, 60) });
    }
  }

  /* 4. Two runs of text on top of each other. Sorted by top edge so the inner
        loop can stop early; otherwise this is quadratic and a long page takes
        minutes. */
  const sorted = runs.slice().sort((a, b) => a.ink.top - b.ink.top);
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (b.ink.top >= a.ink.bottom - 1) break;
      if (a.parent === b.parent) continue;
      if (a.parent.contains(b.parent) || b.parent.contains(a.parent)) continue;
      /* ink is the union of a run's line boxes, which is the right shape for
         the cheap rejection above and the wrong shape for the answer. A run of
         inline text wrapping over four lines has a union box the full width of
         the column and four lines tall, so two adjacent spans inside one
         flowing paragraph always appear to overlap while no glyph touches any
         other.

         That went unnoticed until the migrated WordPress articles arrived:
         they are full of <span style="font-weight: 400"> wrappers, which are
         the first long multi-line inline runs on this site, and the audit
         reported thirteen overlaps on pages that render perfectly.

         So the union boxes only nominate a pair. The verdict comes from the
         line boxes, which is where the glyphs actually are. */
      const ux = Math.min(a.ink.right, b.ink.right) - Math.max(a.ink.left, b.ink.left);
      const uy = Math.min(a.ink.bottom, b.ink.bottom) - Math.max(a.ink.top, b.ink.top);
      if (ux <= 1 || uy <= 1) continue;

      let worst = 0, worstPair = null;
      for (const ra of a.rects) {
        for (const rb of b.rects) {
          const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (ox <= 1 || oy <= 1) continue;
          const smaller = Math.min(ra.width * ra.height, rb.width * rb.height);
          if (smaller <= 0) continue;
          const share = (ox * oy) / smaller;
          if (share > worst) { worst = share; worstPair = [ra, rb]; }
        }
      }
      if (worst > 0.2 && worstPair) {
        findings.push({ kind: 'OVERLAP', el: describe(a.parent), by: describe(b.parent),
          text: a.text.slice(0, 40) + '  //  ' + b.text.slice(0, 40) });
      }
    }
  }

  return findings;
}

const pages = await findPages();
const server = await serve();
const browser = await chromium.launch();

const findings = [];
for (const [w, h, name] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  /* Off-site requests are answered locally rather than left to time out.
     Waiting on Google Fonts, Unsplash and the HubSpot script took a page load
     from 0.1s to 12.6s, which turned a two minute run into one that never
     finished.

     Montserrat is the exception and it matters more than the rest of this file
     put together. An earlier version blocked it along with everything else, so
     every page was measured in the system fallback, which is around 18%
     narrower. The run came back clean while the hero headline was wrapping onto
     three lines on a real machine. The font is served from node_modules now, so
     what gets measured is what a visitor sees. */
  await useLocalMontserrat(page, {
    allowPrefix: `http://127.0.0.1:${PORT}`,
    origin: `http://127.0.0.1:${PORT}`,
  });
  for (const url of pages) {
    try {
      await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch { continue; }
    /* Nothing is measured until the webfont is actually applied, or the first
       page of every run gets measured mid-swap. */
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.evaluate(() => { const c = document.querySelector('.consent'); if (c) c.remove(); });
    for (const f of await page.evaluate(inspect)) {
      findings.push({ ...f, url, viewport: `${w} ${name}` });
    }
  }
  await page.close();
}
await browser.close();
server.close();

/* One line per distinct problem with every width it shows at, rather than the
   same fault printed six times. */
const grouped = new Map();
for (const f of findings) {
  const key = [f.kind, f.url, f.el, f.by, f.text].join('|');
  if (!grouped.has(key)) grouped.set(key, { ...f, widths: [] });
  grouped.get(key).widths.push(f.viewport);
}

const rows = [...grouped.values()]
  .sort((a, b) => a.kind.localeCompare(b.kind) || a.url.localeCompare(b.url));

for (const r of rows) {
  console.log(`${r.kind}  ${r.url}`);
  console.log(`  ${r.el}  "${r.text}"`);
  console.log(`  ${r.kind === 'CLIPPED' ? `${r.lost} hidden by ${r.by}` : r.kind === 'OVERLAP' ? `sits on ${r.by}` : r.by}`);
  console.log(`  at ${r.widths.join(', ')}\n`);
}

console.log(`${rows.length} issue(s) across ${pages.length} pages x ${VIEWPORTS.length} widths.`);
process.exit(rows.length ? 1 : 0);

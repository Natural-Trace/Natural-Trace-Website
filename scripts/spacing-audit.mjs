/* ---------------------------------------------------------------------------
   Spacing audit.

   The layout audit answers "is anything broken". This answers a different and
   fussier question: "does the page look like one person laid it out".

   Nothing it reports is a bug. Every page can build, every link can resolve,
   every character can be visible, and the site can still read as untidy
   because one heading sits 16px above its paragraph and the next sits 48px
   above its own, or because a two line subtitle breaks after the word "If"
   and leaves it hanging on the end of the first line.

   Three things get measured:

     BREAK   a line ending somewhere a line should not end. Three kinds:

               ORPHAN   the line ends on a short joining word, so it dangles
                        with nothing to join to until the eye has travelled
                        back across the page. "...nutraceutical ingredients.
                        If / that problem interests you" is this.
               SPLIT    the line ends mid word at a hyphen, cutting a compound
                        in half. "Designed for Real- / World Manufacturing."
               SCRAP    a short piece of display text whose last line is two
                        words or fewer and under a third of the width above it.
                        Restricted to display text on purpose: an ordinary
                        eight line paragraph ending on one word is how prose
                        works, and flagging it buries the real faults.

     GAP     the optical distance from the bottom of a heading's letters to
             the top of the next element's letters, listed per pairing so the
             same pairing measured differently on two pages is obvious.

     TIGHT   a gap under 8px between two separate blocks, which is the case
             where things are not merely inconsistent but actually touching.

   Everything is measured from a Range around the characters, never from the
   element box. A heading box includes half leading above and below the
   letters, which on a 3.4rem headline is over 20px of air that is not
   really there. Comparing boxes would make identical looking pairs report
   different numbers and different looking pairs report the same one, which is
   worse than not measuring at all.

   Run with:  node scripts/spacing-audit.mjs
   Needs a built site in _site, playwright, and @fontsource/montserrat.
   Prints a report and always exits zero: this is a judgement aid, not a gate.
--------------------------------------------------------------------------- */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { readFile, stat, readdir } from 'node:fs/promises';
import { useLocalMontserrat } from './lib/local-fonts.mjs';

const ROOT = '_site';
const PORT = 8124;

/* Gaps barely move between 1024 and 1920, so two desktop widths would just
   print everything twice. One wide, one narrow, one phone. */
const VIEWPORTS = [
  [390, 844, 'phone'],
  [768, 1024, 'tablet'],
  [1440, 900, 'laptop'],
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

async function findPages(dir = ROOT, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await findPages(full, out);
    else if (entry.name === 'index.html') {
      const html = await readFile(full, 'utf8');
      if (/http-equiv=["']refresh/i.test(html)) continue;
      out.push(full.slice(ROOT.length, -'index.html'.length) || '/');
    }
  }
  return out.sort();
}

/* Runs inside the page. */
function inspect() {
  const out = { ragged: [], gaps: [] };

  const cs = el => getComputedStyle(el);

  const label = el => {
    const cls = typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    return el.tagName.toLowerCase() + cls;
  };

  const hidden = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const c = cs(n);
      if (c.visibility === 'hidden' || c.display === 'none') return true;
      if (parseFloat(c.opacity) === 0) return true;
      if (n.getAttribute && n.getAttribute('aria-hidden') === 'true') return true;
      if (n.tagName === 'DETAILS' && !n.open) return true;
    }
    return false;
  };

  /* An element is a leaf of text when it has no block level children. Anything
     with a block child is a container, and measuring a container's ink tells
     you about its descendants rather than about it. */
  const isTextLeaf = el => {
    if (!el.textContent.trim()) return false;
    for (const c of el.children) {
      const d = cs(c).display;
      if (d !== 'inline' && d !== 'inline-block' && d !== 'contents') return false;
    }
    return true;
  };

  /* The rectangle around the actual letters. */
  const ink = el => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(x => x.width > 1 && x.height > 1);
    if (!rects.length) return null;
    return {
      top: Math.min(...rects.map(x => x.top)),
      bottom: Math.max(...rects.map(x => x.bottom)),
      left: Math.min(...rects.map(x => x.left)),
      right: Math.max(...rects.map(x => x.right)),
    };
  };

  /* Every word with the line it landed on, so the report can name the words
     left stranded rather than just saying the last line is short. */
  const words = el => {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const found = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const t = n.textContent;
      const re = /\S+/g;
      let m;
      while ((m = re.exec(t))) {
        const r = document.createRange();
        r.setStart(n, m.index);
        r.setEnd(n, m.index + m[0].length);
        /* A word broken at a hyphen has two rectangles on two different
           lines. getBoundingClientRect would union them into one tall box and
           hide exactly the fault worth catching, so the pieces are kept. */
        const parts = [...r.getClientRects()].filter(x => x.width > 0);
        if (!parts.length) continue;
        const tops = [...new Set(parts.map(x => Math.round(x.top)))];
        found.push({
          word: m[0],
          top: Math.round(parts[0].top),
          left: Math.min(...parts.map(x => x.left)),
          right: Math.max(...parts.map(x => x.right)),
          straddles: tops.length > 1,
        });
      }
    }
    return found;
  };

  const TEXT = 'h1,h2,h3,h4,p,li,blockquote,figcaption,summary,dt,dd';

  /* Words that cannot end a line without leaving the reader hanging: they
     introduce what follows rather than completing what came before. Kept to
     the short, unambiguous ones. "Is" and "are" are left out because they
     legitimately end a line in comparisons, and including them produced more
     noise than signal. */
  const JOINING = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'so', 'if', 'as', 'at', 'by', 'for',
    'from', 'in', 'into', 'of', 'on', 'to', 'with', 'that', 'than', 'then',
    'when', 'while', 'which', 'who', 'your', 'our', 'their', 'its', 'this',
    'these', 'those', 'every', 'each', 'not', 'no',
  ]);

  for (const el of document.querySelectorAll(TEXT)) {
    if (hidden(el) || !isTextLeaf(el)) continue;
    const ws = words(el);
    if (ws.length < 4) continue;

    const lines = new Map();
    for (const w of ws) {
      if (!lines.has(w.top)) lines.set(w.top, []);
      lines.get(w.top).push(w);
    }
    const rows = [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    if (rows.length < 2) continue;

    const width = r => Math.max(...r.map(w => w.right)) - Math.min(...r.map(w => w.left));
    const full = ws.map(w => w.word).join(' ');
    const add = (kind, detail) => out.ragged.push({
      kind, el: label(el), text: full.slice(0, 90), detail, lines: rows.length,
    });

    /* Display text is a heading, or copy explicitly styled as a subtitle or
       lead. That restriction is doing real work. An earlier version treated
       anything under thirty words as display and reported 60-odd orphans,
       nearly all of them ordinary paragraphs on a phone where a line has to
       end somewhere and no wording change would help. A report that size is a
       report nobody reads. */
    const isHeading = /^h[1-4]$/.test(el.tagName.toLowerCase());
    const isDisplay = isHeading
      || /subtitle|lead|intro|eyebrow/i.test(el.className || '');
    /* Centred only. In a left aligned column the eye returns to a fixed margin
       and a short or awkward last line reads as ordinary ragged right setting.
       Centred copy has no such anchor, so an unbalanced break is the first
       thing anyone notices, and it is the shape Kirsty's pages are built in. */
    const centred = cs(el).textAlign === 'center';


    /* A compound cut in half at its hyphen. Display text only, for the same
       reason as the rules below: in running text, breaking after a hyphen is
       what a hyphen is for, and reporting it produced twenty findings a
       typesetter would call correct. In a heading it is a fault, because a
       heading is read as a shape before it is read as a sentence. */
    if (isHeading) {
      for (const w of ws) {
        if (w.straddles && /[\u2010-]/.test(w.word)) add('SPLIT', `"${w.word}" is broken across two lines`);
      }
    }

    for (let i = 0; i < rows.length - 1; i++) {
      const endWord = rows[i][rows[i].length - 1].word;
      /* Only the break before the final line, and only in short display copy.
         That break sets the shape of the whole block, which is why "...If /
         that problem interests you" reads as a mistake while the same word
         ending line four of a paragraph does not. */
      if (!isDisplay || !centred || rows.length > 3 || i !== rows.length - 2) continue;
      const bare = endWord.toLowerCase().replace(/[^a-z]/g, '');
      if (JOINING.has(bare) && !/[.,;:?!]$/.test(endWord)) {
        add('ORPHAN', `the last break lands after "${endWord}"`);
      }
    }

    if (isDisplay && centred && rows.length <= 3) {
      const last = rows[rows.length - 1];
      const widest = Math.max(...rows.slice(0, -1).map(width));
      if (widest && last.length <= 2 && width(last) / widest < 0.34) {
        add('SCRAP', `last line is "${last.map(w => w.word).join(' ')}", `
          + `${Math.round(width(last) / widest * 100)}% of the line above`);
      }
    }
  }

  /* Heading to the thing it introduces. Also the eyebrow label above a title,
     which is the same relationship the other way up. */
  for (const el of document.querySelectorAll('h1,h2,h3,h4,.section-label')) {
    if (hidden(el)) continue;
    let next = el.nextElementSibling;
    /* A heading that ends its wrapper introduces whatever the wrapper is
       followed by. That is the .vp-head / .how-head pattern all over the site,
       and skipping it would miss most of the real pairings. */
    if (!next && el.parentElement && el.parentElement !== document.body) {
      next = el.parentElement.nextElementSibling;
    }
    if (!next || hidden(next)) continue;
    const a = ink(el);
    const b = ink(next);
    if (!a || !b) continue;
    if (b.top < a.bottom) continue;          // side by side, not stacked
    out.gaps.push({
      pair: `${label(el)} -> ${label(next)}`,
      gap: Math.round(b.top - a.bottom),
      text: el.textContent.trim().slice(0, 46),
    });
  }

  return out;
}

const pages = await findPages();
const server = await serve();
const browser = await chromium.launch();

const ragged = [];
const gaps = [];

for (const [w, h, name] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await useLocalMontserrat(page, {
    allowPrefix: `http://127.0.0.1:${PORT}`,
    origin: `http://127.0.0.1:${PORT}`,
  });
  for (const url of pages) {
    try {
      await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch { continue; }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    await page.evaluate(() => { const c = document.querySelector('.consent'); if (c) c.remove(); });
    const r = await page.evaluate(inspect);
    for (const f of r.ragged) ragged.push({ ...f, url, width: name });
    for (const f of r.gaps) gaps.push({ ...f, url, width: name });
  }
  await page.close();
}
await browser.close();
server.close();

/* ---- ragged line breaks ---- */
const rgroup = new Map();
for (const f of ragged) {
  const key = [f.kind, f.url, f.el, f.text, f.detail].join('|');
  if (!rgroup.has(key)) rgroup.set(key, { ...f, widths: [] });
  rgroup.get(key).widths.push(f.width);
}
const rrows = [...rgroup.values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.url.localeCompare(b.url));

console.log('LINE BREAKS');
console.log('SPLIT a compound cut at a hyphen, ORPHAN a line ending on a joining');
console.log('word, SCRAP a display line left with a two word tail.\n');
if (!rrows.length) console.log('  none\n');
for (const r of rrows) {
  console.log(`  ${r.kind}  ${r.url}  ${r.el}`);
  console.log(`    "${r.text}"`);
  console.log(`    ${r.detail}`);
  console.log(`    at ${r.widths.join(', ')}\n`);
}

/* ---- gaps ---- */
const byPair = new Map();
for (const g of gaps) {
  const key = `${g.width}  ${g.pair}`;
  if (!byPair.has(key)) byPair.set(key, []);
  byPair.get(key).push(g);
}

const inconsistent = [];
const tight = [];
for (const [key, list] of byPair) {
  const values = [...new Set(list.map(g => g.gap))].sort((a, b) => a - b);
  if (values.length > 1 && values[values.length - 1] - values[0] >= 10) {
    inconsistent.push({ key, values, list });
  }
  for (const g of list) if (g.gap < 8) tight.push({ key, ...g });
}

console.log('\nTIGHT');
console.log('Under 8px between a heading and what follows it.\n');
if (!tight.length) console.log('  none\n');
for (const t of tight.sort((a, b) => a.gap - b.gap)) {
  console.log(`  ${t.gap}px  ${t.url}  ${t.pair}   "${t.text}"  [${t.width}]`);
}

console.log('\nINCONSISTENT');
console.log('The same pairing measuring 10px or more apart on different pages.\n');
if (!inconsistent.length) console.log('  none\n');
for (const i of inconsistent.sort((a, b) => a.key.localeCompare(b.key))) {
  console.log(`  ${i.key}`);
  for (const v of i.values) {
    const where = i.list.filter(g => g.gap === v);
    const urls = [...new Set(where.map(g => g.url))];
    console.log(`    ${String(v).padStart(4)}px   ${urls.slice(0, 6).join(', ')}${urls.length > 6 ? ` (+${urls.length - 6} more)` : ''}`);
  }
  console.log('');
}

console.log(`${rrows.length} break(s), ${tight.length} tight, ${inconsistent.length} inconsistent pairing(s) across ${pages.length} pages x ${VIEWPORTS.length} widths.`);

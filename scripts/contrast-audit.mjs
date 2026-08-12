/* ---------------------------------------------------------------------------
   Contrast audit.

   The homepage hero is a photograph. That means the colour behind any given
   letter is not written down anywhere: it depends on the picture, on the
   gradient over it, on the blend mode, and on how the browser happened to crop
   the image at that viewport width. Reading the stylesheet tells you the text
   is white and the tint is #1A1E2E. It does not tell you whether the word
   "Investigate" is currently sitting on a bright glass beaker.

   So this measures pixels. For each viewport it:

     1  records where every piece of hero text is, and what colour it is
     2  makes that text and its button chrome transparent
     3  photographs the page
     4  finds the brightest pixel inside each text box, which is the pixel that
        decides whether that text passes
     5  reports the ratio against the WCAG 2.1 threshold for that text size

   Point 4 is the whole method. An average would flatter the result: text is
   readable only where it is worst, and one bright object behind three letters
   is enough to lose them.

   Two details that were got wrong on the way and are worth not repeating.
   Hiding text with visibility:hidden on the wrapper is not enough, because
   something further down puts it back on the buttons and the probe then
   measures the white button label as if it were the background. And the hero
   ticks are drawn as a rotated border on a pseudo element, which if left
   visible becomes the brightest pixel in the list item and reports the gold
   tick as the background behind its own label.

   Run with:  node scripts/contrast-audit.mjs
   Needs a built site in _site and playwright. Exits non-zero on a failure.
--------------------------------------------------------------------------- */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { useLocalMontserrat } from './lib/local-fonts.mjs';

const ROOT = '_site';
const PORT = 8125;

/* Pages with text over a photograph. Everything else is flat colour and can be
   reasoned about from the stylesheet. */
const TARGETS = [
  { url: '/', selectors: {
    'hero headline': '.hero-lab h1 .hero-line-inner',
    'hero lead': '.hero-lab .hero-lead',
    'hero tick': '.hero-lab .hero-ticks li',
    'hero coda': '.hero-lab .hero-ticks-coda',
    'hero outline button': '.hero-lab .btn-outline-dark',
    'nav link': 'nav:not(.scrolled) .nav-links a',
    /* Every industry tile, not one of them. The label sits on whatever the
       bottom of that particular photograph happens to be, so one tile passing
       says nothing about the other three. */
    'industry tile 1': '.industries-grid .industry-card:nth-child(1) h3',
    'industry tile 2': '.industries-grid .industry-card:nth-child(2) h3',
    'industry tile 3': '.industries-grid .industry-card:nth-child(3) h3',
    'industry tile 4': '.industries-grid .industry-card:nth-child(4) h3',
  } },
  { url: '/industries/', selectors: {
    'industry tile 1': '.industries-grid .industry-card:nth-child(1) h3',
    'industry tile 2': '.industries-grid .industry-card:nth-child(2) h3',
    'industry tile 3': '.industries-grid .industry-card:nth-child(3) h3',
    'industry tile 4': '.industries-grid .industry-card:nth-child(4) h3',
  } },
  /* Why We Exist became a photograph on 12 Aug. Every paragraph is listed
     rather than the block, because the picture is a field under a sky and the
     paragraph sitting on the sky is not the paragraph sitting on the soil.
     The vision and mission cards are four per cent white, so what is behind
     them still reaches the text through the card. */
  { url: '/about/', selectors: {
    'why label': '#why-we-exist .section-label',
    'why headline': '#why-we-exist .section-title',
    'why para 1': '#why-we-exist .why-body p:nth-child(1)',
    'why para 2': '#why-we-exist .why-body p:nth-child(2)',
    'why para 3': '#why-we-exist .why-body p:nth-child(3)',
    'vision heading': '#why-we-exist .how-step:nth-child(1) h3',
    'vision text': '#why-we-exist .how-step:nth-child(1) p',
    'mission heading': '#why-we-exist .how-step:nth-child(2) h3',
    'mission text': '#why-we-exist .how-step:nth-child(2) p',
  } },
];

const VIEWPORTS = [[1440, 950, 'desktop'], [1024, 768, 'laptop'], [390, 844, 'phone']];

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
  '.ico': 'image/x-icon', '.json': 'application/json',
};

function serve() {
  return new Promise(resolve => {
    const s = createServer(async (req, res) => {
      let f = join(ROOT, normalize(decodeURIComponent(req.url.split('?')[0])));
      try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); }
      catch { res.writeHead(404); return res.end(); }
      try {
        const body = await readFile(f);
        res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    });
    s.listen(PORT, () => resolve(s));
  });
}

const server = await serve();
const browser = await chromium.launch();
/* Decoding the screenshot happens in a second page rather than with a PNG
   library, so this script needs nothing beyond playwright. The image goes in as
   a data URL, onto a canvas, and comes back out as raw pixels. */
const decoder = await browser.newPage();

async function brightest(pngBuffer, box) {
  return decoder.evaluate(async ({ data, box }) => {
    const img = new Image();
    img.src = data;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    const x0 = Math.max(0, box.x), y0 = Math.max(0, box.y);
    const w = Math.min(box.w, img.width - x0), h = Math.min(box.h, img.height - y0);
    if (w <= 0 || h <= 0) return null;
    const d = c.getContext('2d').getImageData(x0, y0, w, h).data;
    const lum = (r, g, b) => {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    let best = -1, px = null;
    for (let i = 0; i < d.length; i += 4) {
      const L = lum(d[i], d[i + 1], d[i + 2]);
      if (L > best) { best = L; px = [d[i], d[i + 1], d[i + 2]]; }
    }
    return { lum: best, px };
  }, { data: 'data:image/png;base64,' + pngBuffer.toString('base64'), box });
}

const lumOf = ([r, g, b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

let failures = 0;
for (const target of TARGETS) {
  for (const [w, h, tag] of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await useLocalMontserrat(page, {
      allowPrefix: `http://127.0.0.1:${PORT}`, origin: `http://127.0.0.1:${PORT}`,
    });
    await page.goto(`http://127.0.0.1:${PORT}${target.url}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await page.evaluate(() => { const c = document.querySelector('.consent'); if (c) c.remove(); });

    const boxes = await page.evaluate(sels => {
      const out = [];
      for (const [name, sel] of Object.entries(sels)) {
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          const cs = getComputedStyle(el);
          out.push({
            name, colour: cs.color,
            size: parseFloat(cs.fontSize), weight: parseInt(cs.fontWeight, 10) || 400,
            /* Document coordinates, to match the full page screenshot. */
            x: Math.round(r.left + scrollX), y: Math.round(Math.max(0, r.top + scrollY)),
            w: Math.round(r.width), h: Math.round(r.height),
          });
          break;   /* one representative per selector is enough */
        }
      }
      return out;
    }, target.selectors);

    /* Every selector this target measures, hidden by construction.
       This used to be a hand-written list, and adding /about/ to TARGETS
       without also adding its selectors here made all nine of its probes
       measure their own letters: the white headline reported rgb(255,255,255)
       behind it and "failed" at 1.00:1. A hand-maintained parallel list is a
       bug waiting for the next person, so it is derived now. */
    const measured = Object.values(target.selectors).join(',');
    await page.addStyleTag({ content: `
      ${measured}{color:transparent!important;-webkit-text-fill-color:transparent!important}
      .hero-lab .hero-copy, .hero-lab .hero-copy *, nav .nav-links a{
        color:transparent!important;-webkit-text-fill-color:transparent!important;
        background-image:none!important;
      }
      .hero-lab .btn{background:transparent!important;border-color:transparent!important;box-shadow:none!important}
      .hero-lab .hero-ticks li::before{border-color:transparent!important}
      /* The tile label has to go, but the gradient over the photograph has to
         stay: that gradient is the background the label is read against. */
      .industry-card h3, .industry-card p{color:transparent!important;-webkit-text-fill-color:transparent!important}
    ` });
    await page.waitForTimeout(300);
    /* Full page, because the industry tiles are well below the fold and a
       viewport clip would simply miss them. */
    const shot = await page.screenshot({ fullPage: true });
    await page.close();

    console.log(`\n${target.url}  ${tag} ${w}x${h}`);
    for (const box of boxes) {
      const bg = await brightest(shot, box);
      if (!bg) continue;
      const m = box.colour.match(/[\d.]+/g).map(Number);
      const alpha = m[3] === undefined ? 1 : m[3];
      /* Text with alpha is composited over whatever is behind it. */
      const fg = [0, 1, 2].map(k => m[k] * alpha + bg.px[k] * (1 - alpha));
      const r = ratio(lumOf(fg), bg.lum);
      /* WCAG 2.1: large text is 24px or more, or 18.66px or more when bold. */
      const large = box.size >= 24 || (box.size >= 18.66 && box.weight >= 700);
      const need = large ? 3 : 4.5;
      const ok = r >= need;
      if (!ok) failures++;
      console.log(`  ${box.name.padEnd(20)} ${r.toFixed(2).padStart(6)}:1  ${ok ? 'pass' : 'FAIL'}`
        + `  needs ${need}  (${Math.round(box.size)}px, worst pixel behind it rgb(${bg.px.join(',')}))`);
    }
  }
}

await browser.close();
server.close();
console.log(`\n${failures} contrast failure(s).`);
process.exit(failures ? 1 : 0);

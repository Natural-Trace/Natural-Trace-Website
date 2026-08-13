/* ---------------------------------------------------------------------------
   Contrast audit.

   Every piece of text on every page, at three viewport widths. No list of
   pages, no list of selectors.

   The list is why this was rewritten. From 6 to 12 August this script carried a
   hand-written TARGETS array and visited two pages, and every time a page was
   added to it, it found something that had already shipped:

     the About page          three failures, including body copy at 3.76:1
     the technology pages    the NaturalCloud eyebrow at 3.62:1, live since 11 Aug
     the contact page        the CTA label and subcopy at 2.52:1 and 2.94:1,
                             failing since the panel was built

   Three for three. A check that only looks where it is told is not a check, it
   is a record of where somebody has looked.

   HOW IT WORKS

   Two passes, because measuring pixels is accurate and slow and most of the
   site does not need it.

   1  Computed pass. For each text-bearing element, walk up its ancestors
      compositing background-color until something opaque is reached. If nothing
      in that chain has a background image, a gradient, a blend mode, a
      translucent ancestor or a pseudo-element that could paint behind the text,
      the backdrop is a known flat colour and the ratio is arithmetic. Most of
      the site lands here.

   2  Pixel pass. Anything the computed pass cannot be sure about (a
      photograph, a gradient, a mask, a card over an image) is measured from a
      screenshot of the page with that text made transparent, taking the
      brightest pixel inside each text box, because text is only readable where
      it is worst. One screenshot per page and viewport; every box is then read
      out of the one decoded image.

   Text colour alpha is composited too: rgba(255,255,255,.5) on a green panel is
   not white on a green panel, and pretending otherwise is how the contact page
   sat at 2.52:1 for a week.

   WHAT IT DOES NOT DO

   It reads what the browser paints. Text over a video frame is judged against
   the poster or the first frame. It does not model text-shadow. It does not
   check focus rings or non-text contrast.

   Run with:  node scripts/contrast-audit.mjs
   Needs a built site in _site and playwright. Exits non-zero on a failure.
--------------------------------------------------------------------------- */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { extname, join, normalize, relative } from 'node:path';
import { readFile, readdir, stat } from 'node:fs/promises';
import { useLocalMontserrat } from './lib/local-fonts.mjs';

const ROOT = '_site';
const PORT = 8125;

/* Seasonal themes are an accent layer, but an accent layer is still a colour
   system and the whole point of this script is that colour systems are not
   checked by eye. `--theme=space` forces that theme on every page before
   anything is measured, so a themed day is audited exactly like an ordinary
   one. Without the flag the site is measured untinted, as before. */
const THEME = (process.argv.find(a => a.startsWith('--theme=')) || '').split('=')[1] || '';
const VIEWPORTS = [[1440, 950, 'desktop'], [1024, 768, 'laptop'], [390, 844, 'phone']];

/* Redirect stubs are three lines of markup that bounce, and the CMS is a
   third-party application whose colours we do not set. */
const SKIP = /^\/(admin|404\.html)/;

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
  '.ico': 'image/x-icon', '.json': 'application/json',
};

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

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

/* Which pages to visit. Redirect stubs are excluded by content rather than by
   path, so a stub with a new name cannot slip in: they carry the site-wide
   noindex and nothing else. */
const files = await walk(ROOT);
const urls = [];
for (const f of files) {
  if (!f.endsWith('.html')) continue;
  const url = '/' + relative(ROOT, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  if (SKIP.test(url)) continue;
  const html = await readFile(f, 'utf8');
  if (/<script>window\.location\.replace/.test(html)) continue;
  urls.push(url);
}
urls.sort();

const lum = ([r, g, b]) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

const server = await serve();
const browser = await chromium.launch();
const decoder = await browser.newPage();

/* The screenshot is decoded once per page and viewport and kept on a canvas in
   the decoder page. Every box is then read out of that one image, so a page
   with forty probes costs one decode rather than forty. */
async function loadImage(pngBuffer) {
  return decoder.evaluate(async data => {
    const img = new Image();
    img.src = data;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0);
    window.__ctx = c.getContext('2d', { willReadFrequently: true });
    window.__w = img.width; window.__h = img.height;
    return [img.width, img.height];
  }, 'data:image/png;base64,' + pngBuffer.toString('base64'));
}

/* One entry per item; each item is a list of line boxes and the answer is the
   brightest pixel across all of them. */
async function brightestIn(groups) {
  return decoder.evaluate(groups => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const L = (r, g, b) => 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    return groups.map(boxes => {
      let best = -1, px = null;
      for (const box of boxes) {
        const x0 = Math.max(0, Math.round(box.x)), y0 = Math.max(0, Math.round(box.y));
        const w = Math.min(Math.round(box.w), window.__w - x0), h = Math.min(Math.round(box.h), window.__h - y0);
        if (w <= 0 || h <= 0) continue;
        const d = window.__ctx.getImageData(x0, y0, w, h).data;
        for (let i = 0; i < d.length; i += 4) {
          const l = L(d[i], d[i + 1], d[i + 2]);
          if (l > best) { best = l; px = [d[i], d[i + 1], d[i + 2]]; }
        }
      }
      return px ? { lum: best, px } : null;
    });
  }, groups);
}

/* Runs in the page. Returns one record per text-bearing element. */
const COLLECT = () => {
  const parse = s => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(v => parseFloat(v.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const paints = cs =>
    cs.backgroundImage !== 'none' ||
    (cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) ||
    (cs.content !== 'none' && cs.content !== 'normal') ||
    parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'OPTION', 'TEMPLATE', 'TITLE']);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  const out = [];
  let n, id = 0;

  while ((n = walker.nextNode())) {
    if (!n.nodeValue.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el) || SKIP_TAGS.has(el.tagName)) continue;
    seen.add(el);

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;

    /* The line boxes of this run of text, not the element's box.
       An element's box includes its padding, its border and the space outside
       its border-radius, and the brightest pixel in a rounded sage button was
       the near-white nav showing through its own corner: 1.00:1 reported for
       white-on-sage. Line boxes are the letters and nothing else. */
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = [...range.getClientRects()].filter(b => b.width >= 1 && b.height >= 1);
    if (!rects.length) continue;

    /* Text painted with a gradient through background-clip:text. Its colour is
       transparent and what you see is its own background, so the brightest
       pixel inside the box is the letterform, not what is behind it. The hero's
       gold "Behind Your Brand" reported 2.19:1 against itself. These are
       counted and listed rather than silently skipped, because nothing here can
       judge them and a person should look once. */
    if (cs.backgroundClip === 'text' || cs.webkitBackgroundClip === 'text') {
      out.push({ unmeasurable: true, tag: el.tagName.toLowerCase(),
                 text: n.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 42) });
      continue;
    }
    const colour = parse(cs.color);
    if (!colour || colour.a === 0) continue;

    /* Walk up compositing background-color, and note anything that means the
       arithmetic cannot be trusted. */
    let node = el, needsPixels = false, layers = [], guard = 0;
    while (node && guard++ < 60) {
      const s = getComputedStyle(node);
      if (s.backgroundImage !== 'none') needsPixels = true;
      if (s.backgroundBlendMode !== 'normal' || s.mixBlendMode !== 'normal') needsPixels = true;
      if (node !== el && parseFloat(s.opacity) < 1) needsPixels = true;
      if (s.filter !== 'none' || s.backdropFilter !== 'none') needsPixels = true;
      /* A sibling or pseudo-element can be painted between this text and the
         background it looks like it is on. Pseudo-elements are cheap to ask
         about; arbitrary siblings are not, so anything positioned is treated as
         suspect. */
      if (paints(getComputedStyle(node, '::before')) || paints(getComputedStyle(node, '::after'))) needsPixels = true;
      if (s.position === 'absolute' || s.position === 'fixed') {
        /* The element itself being positioned is fine; an ancestor being
           positioned means something else may be layered under it. */
        if (node !== el) needsPixels = true;
      }
      const bg = parse(s.backgroundColor);
      if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= 1) break; }
      node = node.parentElement;
    }
    if (!layers.length) layers.push({ r: 255, g: 255, b: 255, a: 1 });
    /* Composite far to near. */
    let back = layers[layers.length - 1];
    if (back.a < 1) back = over(back, { r: 255, g: 255, b: 255, a: 1 });
    for (let i = layers.length - 2; i >= 0; i--) back = over(layers[i], back);

    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);

    el.setAttribute('data-ca', String(id));
    out.push({
      id: id++,
      tag: el.tagName.toLowerCase(),
      cls: (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''),
      text: n.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 42),
      colour: [colour.r, colour.g, colour.b], alpha: colour.a,
      back: [back.r, back.g, back.b],
      size, weight, large, needsPixels,
      boxes: rects.map(b => ({
        x: Math.round(b.left + scrollX), y: Math.round(Math.max(0, b.top + scrollY)),
        w: Math.round(b.width), h: Math.round(b.height),
      })),
    });
  }
  return out;
};

let failures = 0, checked = 0, pixelChecked = 0;
const unmeasurable = new Set();
const reported = new Set();

for (const url of urls) {
  for (const [w, h, tag] of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await useLocalMontserrat(page, {
      allowPrefix: `http://127.0.0.1:${PORT}`, origin: `http://127.0.0.1:${PORT}`,
    });
    /* Set before navigation so the attribute is already on <html> when the
       page's own detector runs, and so no frame is ever measured untinted. */
    if (THEME) {
      await page.addInitScript(t => {
        document.addEventListener('DOMContentLoaded', () =>
          document.documentElement.setAttribute('data-theme', t));
        try { document.documentElement.setAttribute('data-theme', t); } catch (e) {}
      }, THEME);
    }
    await page.goto(`http://127.0.0.1:${PORT}${url}`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    if (THEME) await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), THEME);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    /* The consent bar sits over the page and is not part of any page's design.
       Open every disclosure, or the text inside one is never measured. */
    await page.evaluate(() => {
      const c = document.querySelector('.consent'); if (c) c.remove();
      document.querySelectorAll('details').forEach(d => { d.open = true; });
    });
    await page.waitForTimeout(150);

    const all = await page.evaluate(COLLECT);
    for (const u of all.filter(i => i.unmeasurable)) unmeasurable.add(`${u.tag} "${u.text}"`);
    const items = all.filter(i => !i.unmeasurable);
    checked += items.length;

    const lines = [];
    const flat = items.filter(i => !i.needsPixels);
    for (const it of flat) {
      const bl = lum(it.back);
      const fg = it.alpha >= 1 ? it.colour : it.colour.map((c, i) => c * it.alpha + it.back[i] * (1 - it.alpha));
      const rr = ratio(lum(fg), bl);
      const need = it.large ? 3 : 4.5;
      if (rr < need) lines.push({ it, rr, need, back: hex(it.back), how: 'computed' });
    }

    const needy = items.filter(i => i.needsPixels);
    if (needy.length) {
      pixelChecked += needy.length;
      await page.addStyleTag({ content: `
        /* The element's own border and shadow sit inside its box, so the
           brightest pixel in a ghost button was its own 30% white border and
           not the panel behind the label: 3.10:1 reported against a backdrop
           that does not exist. Chrome under the text, not chrome around it. */
        [data-ca]{color:transparent!important;-webkit-text-fill-color:transparent!important;
          border-color:transparent!important;box-shadow:none!important;
          text-decoration-color:transparent!important}
        [data-ca]::before,[data-ca]::after{color:transparent!important;-webkit-text-fill-color:transparent!important;border-color:transparent!important}
      ` });
      await page.waitForTimeout(200);
      const shot = await page.screenshot({ fullPage: true });
      await loadImage(shot);
      const res = await brightestIn(needy.map(i => i.boxes));
      for (let i = 0; i < needy.length; i++) {
        const it = needy[i], probe = res[i];
        if (!probe) continue;
        const fg = it.alpha >= 1 ? it.colour : it.colour.map((c, k) => c * it.alpha + probe.px[k] * (1 - it.alpha));
        const rr = ratio(lum(fg), probe.lum);
        const need = it.large ? 3 : 4.5;
        if (rr < need) lines.push({ it, rr, need, back: hex(probe.px), how: 'pixel' });
      }
    }
    await page.close();

    for (const l of lines) {
      /* One report per distinct fault, not per occurrence. The same nav link
         failing on thirty-seven pages is one thing to fix. */
      const key = `${l.it.tag}${l.it.cls}|${hex(l.it.colour)}|${l.back}|${Math.round(l.it.size)}`;
      if (reported.has(key)) continue;
      reported.add(key);
      failures++;
      console.log(
        `FAIL ${l.rr.toFixed(2)}:1  needs ${l.need}  ${l.it.tag}${l.it.cls}` +
        `\n     ${hex(l.it.colour)}${l.it.alpha < 1 ? ` at ${l.it.alpha} alpha` : ''} on ${l.back}` +
        `  ${Math.round(l.it.size)}px/${l.it.weight}  (${l.how})` +
        `\n     ${url}  ${tag}  "${l.it.text}"`);
    }
  }
}

await browser.close();
server.close();

console.log(`\n${checked} text elements across ${urls.length} pages x ${VIEWPORTS.length} widths` +
            `, ${pixelChecked} of them measured from pixels`);
if (unmeasurable.size) {
  console.log(`\n${unmeasurable.size} element(s) painted with a gradient through background-clip:text.`);
  console.log('Not measurable from a screenshot; check these by eye once:');
  for (const u of unmeasurable) console.log(`  ${u}`);
}
console.log(`${failures} distinct contrast failure(s).`);
process.exit(failures ? 1 : 0);

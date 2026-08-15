import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import fs from 'node:fs';
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto(pathToFileURL(resolve('./out/scene.html')).href);
await pg.waitForFunction(() => document.body.dataset.ready === '1');
const r = await pg.evaluate(() => {
  const texts = [...document.querySelectorAll('text')].map(t => t.textContent);
  const imgs = [...document.querySelectorAll('image')].map(i => i.getAttribute('href').slice(0, 60));
  const discs = document.querySelectorAll('circle[r="50"]').length;
  return { texts, imgs, discs };
});
await b.close();

const EXPECT = ['FARM','WAREHOUSE','INGREDIENTMANUFACTURE','FINISHED PRODUCTMANUFACTURE',
                'DISTRIBUTION','MARKETPLACE','CONSUMER'];
const labels = r.texts.filter(t => t === t.toUpperCase());
const word = r.texts.filter(t => t !== t.toUpperCase());

console.log('discs:', r.discs);
console.log('wordmark:', JSON.stringify(word));
console.log('labels  :', JSON.stringify(labels));
console.log('label match:', JSON.stringify(labels) === JSON.stringify(EXPECT) ? 'PASS' : 'FAIL');
console.log('text elements total:', r.texts.length, '(7 labels + wordmark + tagline expected = 9)');
console.log('tagline exact:', JSON.stringify(word[1]), word[1] === 'Tag.Trace.Trust.' ? 'PASS (tspans join without spaces; rendered with dx gaps)' : 'CHECK');

const b64 = p => fs.readFileSync(p).toString('base64').slice(0, 40);
const L = '../../src/assets/logos/';
const leafOK = r.imgs.some(h => h.includes(b64(L + 'NT icon without logo.png').slice(0, 30)));
const cloudOK = r.imgs.some(h => h.includes(b64(L + 'NaturalCloud-icon.png').slice(0, 30)));
console.log('leaf PNG is the repo file :', leafOK ? 'PASS' : 'FAIL');
console.log('cloud PNG is the repo file:', cloudOK ? 'PASS' : 'FAIL');

// --- do any two links touch? ------------------------------------------------
const b2 = await chromium.launch();
const pg2 = await b2.newPage({ viewport: { width: 1920, height: 1080 } });
await pg2.goto(pathToFileURL(resolve('./out/scene.html')).href);
await pg2.waitForFunction(() => document.body.dataset.ready === '1');
const gap = await pg2.evaluate(() => {
  const paths = [...document.querySelectorAll('path')].filter(p => p.getAttribute('stroke') === '#A29349');
  const pts = paths.map(p => {
    const L = p.getTotalLength(), out = [];
    for (let d = 0; d <= L; d += 2) { const q = p.getPointAtLength(d); out.push([q.x, q.y]); }
    return out;
  });
  let min = Infinity, where = null;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++)
    for (const a of pts[i]) for (const c of pts[j]) {
      const d = Math.hypot(a[0] - c[0], a[1] - c[1]);
      if (d < min) { min = d; where = [i, j, Math.round(a[0]), Math.round(a[1])]; }
    }
  return { count: paths.length, min: Math.round(min * 10) / 10, where };
});
await b2.close();
console.log('gold link paths:', gap.count);
console.log('closest approach between any two links:', gap.min + 'px', 'at', gap.where);
console.log(gap.min > 8 ? 'no two links touch: PASS' : 'links too close: FAIL');

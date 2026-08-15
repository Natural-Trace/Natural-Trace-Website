import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const FPS = 30, DUR = 10, N = FPS * DUR;
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await pg.goto(pathToFileURL(resolve('./out/scene.html')).href);
await pg.waitForFunction(() => document.body.dataset.ready === '1');

const t0 = Date.now();
for (let i = 0; i < N; i++) {
  await pg.evaluate(t => window.setTime(t), i / FPS);
  await pg.screenshot({ path: `./out/frames/${String(i).padStart(4, '0')}.png` });
  if (i % 60 === 0) console.log(i, '/', N, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await b.close();
console.log('rendered', N, 'frames in', ((Date.now() - t0) / 1000).toFixed(0) + 's');

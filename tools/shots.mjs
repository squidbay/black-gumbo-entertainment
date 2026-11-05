#!/usr/bin/env node
// Section screenshots for before/after review.
//   node tools/shots.mjs <baseURL> <outDir>
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const BASE = (process.argv[2] || 'http://localhost:8743/black-gumbo-entertainment/').replace(/\/?$/, '/');
const OUT = process.argv[3] || 'review-shots/after';
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'phone-390', width: 390, height: 844, mobile: true },
  { name: 'land-844', width: 844, height: 390, mobile: true },
];
const TARGETS = [
  ['home', '', 'section[aria-labelledby="disc-h"]', 'disciplines'],
  ['home', '', '.card-grid', 'selected-work'],
  ['film', 'film/', '#portfolio .card-grid', 'film-portfolio'],
  ['msots', 'film/my-side-of-the-story/', '.related .card-grid, #related-h + .card-grid', 'related'],
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const [name, path, sel, label] of TARGETS) {
    await page.goto(`${BASE}${path}?cb=${Date.now()}`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    });
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await el.screenshot({ path: `${OUT}/${vp.name}--${name}-${label}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log(`saved to ${OUT}`);

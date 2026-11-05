#!/usr/bin/env node
// Media-frame proof with unpublished fixture artwork.
// Generates landscape / square / extra-tall test patterns into .serve/fixtures
// (never into docs/), swaps them into real cards and tiles on the local build,
// then measures every frame and saves screenshots.
//   node tools/frame-fixtures.mjs [baseURL] [outDir]

import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = (process.argv[2] || 'http://localhost:8743/black-gumbo-entertainment/').replace(/\/?$/, '/');
const OUT = process.argv[3] || 'review-shots/fixtures';
const FIX = '.serve/fixtures';
const FIX_URL = new URL('/fixtures/', BASE).href;
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME });
await mkdir(FIX, { recursive: true });
await mkdir(OUT, { recursive: true });

// 1. Test patterns: edge markers on every side so any cropping is visible.
const PATTERNS = { landscape: [1600, 900], square: [1000, 1000], tall: [800, 2000] };
const painter = await browser.newPage();
for (const [name, [w, h]] of Object.entries(PATTERNS)) {
  // Drawn on a canvas at exact pixel size: red edge on every side, label in the centre.
  const dataUrl = await painter.evaluate(({ name, w, h }) => {
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const g = c.getContext('2d');
    for (let x = -h; x < w + h; x += 120) {
      g.fillStyle = '#3a6ea5'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x + 60 - h, h); g.lineTo(x - h, h); g.fill();
      g.fillStyle = '#2b5480'; g.beginPath(); g.moveTo(x + 60, 0); g.lineTo(x + 120, 0); g.lineTo(x + 120 - h, h); g.lineTo(x + 60 - h, h); g.fill();
    }
    const b = Math.round(Math.min(w, h) / 25);
    g.strokeStyle = '#e0402f'; g.lineWidth = b; g.strokeRect(b / 2, b / 2, w - b, h - b);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const fs = Math.round(Math.min(w, h) / 9); g.font = `700 ${fs}px Arial`;
    ['TEST', name.toUpperCase(), `${w}×${h}`].forEach((t, i) => g.fillText(t, w / 2, h / 2 + (i - 1) * fs * 1.2));
    return c.toDataURL('image/jpeg', 0.85);
  }, { name, w, h });
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  await writeFile(`${FIX}/${name}.jpg`, buf);
  await writeFile(`${FIX}/${name}-640.jpg`, buf);
}
await painter.close();

// 2. Measure: the painted artwork (object-fit: contain) sits fully inside its frame,
//    keeps its natural aspect ratio, and the frame matches its preset shape.
const measure = () =>
  [...document.querySelectorAll('.frame')].filter((f) => f.offsetParent).map((f) => {
    const fr = f.getBoundingClientRect();
    const ratio = getComputedStyle(f).getPropertyValue('--frame-ratio').trim();
    const [rw, rh] = ratio.split('/').map(Number);
    const out = { cls: f.className, frameRatioOk: Math.abs(fr.width / fr.height - rw / rh) < 0.02, w: Math.round(fr.width), h: Math.round(fr.height) };
    const img = f.querySelector('.frame-art');
    if (img) {
      const nr = img.naturalWidth / img.naturalHeight;
      const box = img.getBoundingClientRect();
      const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
      const pw = img.naturalWidth * scale, ph = img.naturalHeight * scale;
      const left = box.left + (box.width - pw) / 2, top = box.top + (box.height - ph) / 2;
      out.src = img.currentSrc.split('/').pop();
      out.loaded = img.naturalWidth > 0;
      out.fit = getComputedStyle(img).objectFit;
      out.inside = left >= fr.left - 0.5 && top >= fr.top - 0.5 && left + pw <= fr.right + 0.5 && top + ph <= fr.bottom + 0.5;
      out.aspectKept = Math.abs(pw / ph - nr) < 0.01;
      out.fill = Math.round(((pw * ph) / (fr.width * fr.height)) * 100);
      out.backdrop = !!f.querySelector('.frame-backdrop');
    }
    return out;
  });

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'phone-390', width: 390, height: 844, mobile: true },
  { name: 'land-844', width: 844, height: 390, mobile: true },
];
const problems = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const [path, scope] of [['', '.discipline-grid'], ['', '.card-grid'], ['film/', '#portfolio .card-grid']]) {
    for (const mode of ['real', 'fixtures']) {
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      if (mode === 'fixtures') {
        await page.evaluate(({ scope, url }) => {
          const names = ['landscape', 'square', 'tall'];
          [...document.querySelectorAll(`${scope} .frame--backdrop`)].slice(0, 3).forEach((f, i) => {
            const art = f.querySelector('.frame-art');
            art.removeAttribute('srcset');
            art.src = `${url}${names[i]}.jpg`;
            f.querySelector('.frame-backdrop').src = `${url}${names[i]}-640.jpg`;
          });
        }, { scope, url: FIX_URL });
      }
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
        await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      });
      const frames = (await page.evaluate(measure)).filter((f) => f);
      const scoped = await page.locator(scope).first();
      for (const f of frames) {
        const bad = [!f.frameRatioOk && 'frame shape', f.src && !f.loaded && 'not loaded', f.src && f.fit !== 'contain' && 'not contain', f.src && !f.inside && 'artwork clipped', f.src && !f.aspectKept && 'aspect changed'].filter(Boolean);
        if (bad.length) problems.push(`${vp.name} /${path} ${mode} ${f.src || f.cls}: ${bad.join(', ')}`);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (overflow) problems.push(`${vp.name} /${path} ${mode}: horizontal overflow`);
      await scoped.scrollIntoViewIfNeeded();
      await scoped.screenshot({ path: `${OUT}/${vp.name}--${(path || 'home').replace(/\//g, '')}-${scope.replace(/[^a-z]/g, '')}-${mode}.png` });
      if (vp.name === 'desktop-1440' && mode === 'fixtures' && path === '')
        console.log(scope, JSON.stringify(frames.filter((f) => f.src).map((f) => [f.src, `${f.fill}% filled`])));
    }
  }
  await ctx.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'All frames: complete artwork, natural aspect, correct frame shape, no overflow');
process.exit(problems.length ? 1 : 0);

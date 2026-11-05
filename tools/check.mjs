#!/usr/bin/env node
// Rendered-site checks across desktop, tablet, phone portrait and phone landscape.
//   node tools/check.mjs [baseURL]
// baseURL defaults to the local subpath server (python3 -m http.server 8743 --directory .serve).
// Uses the installed Google Chrome via playwright-core (CHROME_PATH overrides).

import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const BASE = (process.argv[2] || 'http://localhost:8743/black-gumbo-entertainment/').replace(/\/?$/, '/');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHOTS = process.env.SHOTS ? 'check-output' : '';

const PAGES = ['', 'film/', 'television/', 'music/', 'about/', 'contact/', 'privacy/',
  'film/my-side-of-the-story/', 'film/inside-the-ringing-bell/', 'film/butterfly-lane/', 'film/coffee-break/',
  'television/queen-nerd/', 'music/jolly-time-animation-concept/'];
const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'phone-390', width: 390, height: 844, mobile: true },
  { name: 'phone-320', width: 320, height: 640, mobile: true },
  { name: 'land-844', width: 844, height: 390, mobile: true },
  { name: 'land-667', width: 667, height: 375, mobile: true },
];

const failures = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

const browser = await chromium.launch({ executablePath: CHROME });
if (SHOTS) await mkdir(SHOTS, { recursive: true });

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.mobile, hasTouch: !!vp.mobile,
    deviceScaleFactor: vp.mobile ? 2 : 1, reducedMotion: 'reduce',
  });
  for (const path of PAGES) {
    const where = `${vp.name} /${path}`;
    const page = await ctx.newPage();
    const bad = [];
    page.on('console', (m) => m.type() === 'error' && bad.push(`console: ${m.text()}`));
    page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`));
    page.on('response', (r) => r.status() >= 400 && bad.push(`HTTP ${r.status()} ${r.url()}`));
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
    if (!res || res.status() !== 200) fail(where, `status ${res && res.status()}`);
    // Force lazy images to load, then wait for them.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
      scrollTo(0, 0);
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
      await document.fonts.ready;
    });
    const r = await page.evaluate(() => {
      const out = { issues: [] };
      const de = document.documentElement;
      if (de.scrollWidth > de.clientWidth + 1) out.issues.push(`horizontal overflow ${de.scrollWidth} > ${de.clientWidth}`);
      for (const img of document.images) {
        const cs = getComputedStyle(img);
        if (cs.display === 'none' || img.closest('[hidden]')) continue;
        if (img.classList.contains('frame-backdrop') && cs.objectFit !== 'cover') out.issues.push('backdrop not cover');
        if (img.classList.contains('frame-art') && cs.objectFit !== 'contain') out.issues.push(`artwork not contained ${img.src.split('/').pop()}`);
        if (!img.naturalWidth) { out.issues.push(`broken image ${img.currentSrc || img.src}`); continue; }
        const b = img.getBoundingClientRect();
        // contain/cover never distort (cover is only used for the decorative frame backdrop).
        if (!['contain', 'cover'].includes(cs.objectFit) && b.width && b.height) {
          const d = Math.abs(b.width / b.height - img.naturalWidth / img.naturalHeight) / (img.naturalWidth / img.naturalHeight);
          if (d > 0.02) out.issues.push(`distorted image ${img.src.split('/').pop()} (${d.toFixed(3)})`);
        }
      }
      // Touch targets: interactive elements under 44px in both dimensions' minimum (height).
      for (const el of document.querySelectorAll('a[href], button, input, select, textarea')) {
        if (el.closest('[hidden]') || el.classList.contains('skip-link')) continue;
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        if (el.classList.contains('card-link')) continue; // stretched over the whole card
        if (b.height < 44 && !el.closest('.prose, .notice, .small, .disclaimer, .partner-credits, .media-note, .error-summary'))
          out.issues.push(`small target ${Math.round(b.width)}x${Math.round(b.height)} "${(el.textContent || el.name || '').trim().slice(0, 30)}"`);
        if (b.right > window.innerWidth + 1) out.issues.push(`target off-screen right "${el.textContent.trim().slice(0, 30)}"`);
      }
      // Text that overflows its own box horizontally.
      for (const el of document.querySelectorAll('h1, h2, h3, p, dd, dt, li, label')) {
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'visible' && el.clientWidth)
          out.issues.push(`text overflow <${el.tagName.toLowerCase()}> "${el.textContent.trim().slice(0, 30)}"`);
      }
      const h1 = document.querySelector('h1');
      out.h1 = h1 && h1.getBoundingClientRect().bottom;
      const primary = document.querySelector('.hero .button, .project-hero .button');
      out.primaryBottom = primary && primary.getBoundingClientRect().bottom;
      out.vh = window.innerHeight;
      out.headerH = document.querySelector('.site-header').getBoundingClientRect().height;
      const links = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')].map((l) => l.href);
      out.links = links;
      out.noindex = !!document.querySelector('meta[name="robots"][content*="noindex"]');
      return out;
    });
    r.issues.forEach((i) => fail(where, i));
    bad.forEach((b) => fail(where, b));
    if (!r.noindex) fail(where, 'missing noindex');
    if (path === '' || path === 'film/my-side-of-the-story/') {
      const limit = vp.name.startsWith('phone') ? r.vh * 2 : r.vh;
      if (r.primaryBottom > limit) fail(where, `primary action below ${vp.name.startsWith('phone') ? 'two screens' : 'first screen'} (${Math.round(r.primaryBottom)} > ${limit})`);
    }
    if (vp.name.startsWith('desktop') && path === '') {
      for (const href of r.links) {
        const s = (await page.request.get(href)).status();
        if (s !== 200) fail(where, `head asset ${href} → ${s}`);
      }
      const m = await (await page.request.get(BASE + 'site.webmanifest')).json();
      for (const icon of m.icons) {
        const s = (await page.request.get(new URL(icon.src, BASE + 'site.webmanifest').href)).status();
        if (s !== 200) fail(where, `manifest icon ${icon.src} → ${s}`);
      }
    }
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${vp.name}--${path.replace(/\//g, '_') || 'home'}.png`, fullPage: true });
    await page.close();
  }
  await ctx.close();
}

// Interactions: mobile menu focus trap + Escape, contact form never claims delivery.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('.menu-button');
  if (!(await page.isVisible('#mobile-menu'))) fail('menu', 'did not open');
  if ((await page.evaluate(() => document.activeElement.className)) !== 'menu-close') fail('menu', 'focus not on Close');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() => !!document.activeElement.closest('#mobile-menu'));
  if (!inside) fail('menu', 'focus escaped the open menu');
  await page.keyboard.press('Escape');
  if (await page.isVisible('#mobile-menu')) fail('menu', 'Escape did not close');
  if ((await page.evaluate(() => document.activeElement.className)) !== 'menu-button') fail('menu', 'focus not returned to Menu');

  await page.goto(BASE + 'contact/?project=my-side-of-the-story&type=screener', { waitUntil: 'networkidle' });
  if ((await page.inputValue('#f-project')) !== 'my-side-of-the-story') fail('contact', 'project not pre-filled');
  await page.fill('#f-message', '');
  await page.click('button[type=submit]');
  if (!(await page.isVisible('.error-summary'))) fail('contact', 'no error summary on empty submit');
  if ((await page.evaluate(() => document.activeElement.id)) !== 'f-name') fail('contact', 'focus not on first invalid field');
  await page.fill('#f-name', 'Review Test');
  await page.fill('#f-email', 'review@example.com');
  await page.fill('#f-message', 'Hello');
  await page.click('button[type=submit]');
  const status = await page.textContent('.form-status');
  if (/sent\./i.test(status) && !/not sent/i.test(status)) fail('contact', `false success: ${status}`);
  if (!/not sent/i.test(status)) fail('contact', `missing honest not-sent state: ${status}`);
  if ((await page.inputValue('#f-message')) !== 'Hello') fail('contact', 'message cleared');

  // Direct navigation to an unknown route returns the styled 404.
  const r404 = await page.goto(BASE + 'no-such-page/', { waitUntil: 'networkidle' });
  console.log(`404 route → HTTP ${r404.status()}`);
  await ctx.close();
}

await browser.close();
const unique = [...new Set(failures)];
console.log(unique.length ? unique.join('\n') : 'All checks passed');
console.log(`${PAGES.length} pages × ${VIEWPORTS.length} viewports = ${PAGES.length * VIEWPORTS.length} renders; ${unique.length} issues`);
process.exit(unique.length ? 1 : 0);

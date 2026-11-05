#!/usr/bin/env node
// Static build for the Black Gumbo Entertainment review site.
// Reads src/content/*, copies src/static/*, writes docs/ (served by GitHub Pages).
// Every link is relative, so the same output works under the repository
// subpath on GitHub Pages and at a domain root later.
//
//   node tools/build.mjs

import { appendFile, cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, nav, disciplines, inquiryTypes } from '../src/content/site.mjs';
import { projects, kindLabel, categoryLabel, bySlug } from '../src/content/projects.mjs';
import { videos, youtubeId } from '../src/content/videos.mjs';
import { frames, frameSizes } from '../src/content/frames.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs');
const SITE_URL = 'https://squidbay.github.io/black-gumbo-entertainment/';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const join2 = (...parts) => parts.filter(Boolean).join(' · ');

// ---------- shared components ----------

function head({ rel, title, description, path }) {
  const full = title ? `${title} — ${site.name}` : site.name;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
${site.noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<link rel="icon" href="${rel}icons/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" href="${rel}icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${rel}icons/apple-touch-icon-180.png">
<link rel="manifest" href="${rel}site.webmanifest">
<meta name="theme-color" content="#221E1B">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}${path}">
<meta property="og:image" content="${SITE_URL}assets/img/og-black-gumbo.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="${rel}assets/fonts/oswald-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${rel}assets/fonts/lora-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${rel}assets/css/site.css">
<script src="${rel}assets/js/site.js" defer></script>
</head>`;
}

function header({ rel, section }) {
  const links = nav
    .map((n) => `<li><a href="${rel}${n.href}"${n.href === section ? ' aria-current="page"' : ''}>${n.label}</a></li>`)
    .join('');
  const menuLinks = [{ label: 'Home', href: '' }, ...nav]
    .map((n) => `<li><a href="${rel}${n.href}"${n.href === section ? ' aria-current="page"' : ''}>${n.label}</a></li>`)
    .join('');
  return `<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${rel}" aria-label="${esc(site.name)} — Home">
      <img class="brand-full" src="${rel}assets/logo/horizontal-gold.svg" alt="" width="560" height="132">
      <img class="brand-mark" src="${rel}assets/logo/symbol-gold.svg" alt="" width="100" height="100">
    </a>
    <nav class="primary-nav" aria-label="Main">
      <ul>${links}</ul>
    </nav>
    <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu">Menu</button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Site menu" hidden>
  <div class="mobile-menu-top wrap">
    <a class="brand" href="${rel}" aria-label="${esc(site.name)} — Home" tabindex="-1">
      <img class="brand-full" src="${rel}assets/logo/horizontal-gold.svg" alt="" width="560" height="132">
      <img class="brand-mark" src="${rel}assets/logo/symbol-gold.svg" alt="" width="100" height="100">
    </a>
    <button class="menu-close" type="button">Close</button>
  </div>
  <nav class="wrap" aria-label="Mobile">
    <ul class="mobile-menu-list">${menuLinks}</ul>
    <div class="mobile-menu-contact">
      <p class="label">Business inquiries</p>
      ${emailLine(rel)}
    </div>
  </nav>
</div>`;
}

function emailLine(rel) {
  return site.businessEmail
    ? `<p><a href="mailto:${esc(site.businessEmail)}">${esc(site.businessEmail)}</a></p>`
    : `<p><a href="${rel}contact/">Contact form</a> <span class="muted">· Business email coming soon</span></p>`;
}

function footer({ rel }) {
  const social = site.social
    .map((s) => `<li><a href="${esc(s.href)}" target="_blank" rel="noopener">${esc(s.label)}<span class="visually-hidden"> (opens in a new tab)</span></a></li>`)
    .join('');
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div class="footer-brand">
      <a href="${rel}" aria-label="${esc(site.name)} — Home"><img src="${rel}assets/logo/stacked-gold.svg" alt="" width="200" height="129"></a>
      <p class="muted">${esc(site.tagline)}</p>
    </div>
    <div>
      <h2 class="footer-heading">Explore</h2>
      <ul class="footer-links">${nav.slice(0, 4).map((n) => `<li><a href="${rel}${n.href}">${n.label}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="footer-heading">Business inquiries</h2>
      ${emailLine(rel)}
    </div>
    <div>
      <h2 class="footer-heading">Official links</h2>
      <ul class="footer-links">${social}</ul>
    </div>
  </div>
  <div class="wrap footer-base">
    <p>© ${site.year} ${esc(site.name)}</p>
    <p><a href="${rel}privacy/">Privacy</a></p>
  </div>
</footer>
</body>
</html>`;
}

function page({ rel, path, section, title, description, body, bodyClass = '' }) {
  return `${head({ rel, title, description, path })}
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${header({ rel, section })}
<main id="main" tabindex="-1">
${body}
</main>
${footer({ rel })}`;
}

// Responsive candidates for an image record.
//   { set: 'projects/x/x-v1', widths: [320, 640, 1010], webp: true }  → x-v1-320w.jpg … (+ .webp)
//   { src: 'people/x' }                                              → x-640.jpg, x.jpg (legacy pair)
function candidates(rel, image, ext) {
  if (image.set) return image.widths.map((w) => [`${rel}assets/img/${image.set}-${w}w.${ext}`, w]);
  const base = `${rel}assets/img/${image.src}`;
  return [[`${base}-640.jpg`, 640], [`${base}.jpg`, image.w]];
}
const srcset = (list) => list.map(([u, w]) => `${u} ${w}w`).join(', ');
const smallest = (rel, image) => candidates(rel, image, 'jpg')[0][0];

function img(rel, image, { sizes = '(min-width: 900px) 40vw, 100vw', cls = '', eager = false } = {}) {
  const jpg = candidates(rel, image, 'jpg');
  const tag = `<img class="${cls}" src="${jpg[jpg.length - 1][0]}" srcset="${srcset(jpg)}" sizes="${sizes}" width="${image.w}" height="${image.h}" alt="${esc(image.alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
  if (!image.webp) return tag;
  return `<picture><source type="image/webp" srcset="${srcset(candidates(rel, image, 'webp'))}" sizes="${sizes}">${tag}</picture>`;
}

const partnerPhoto = { src: 'people/jerry-and-sean', w: 1376, h: 768, alt: 'Jerry L. White Jr. and Sean Thomas in a recording studio.' };
const projectImg = (rel, p, opts = {}) => img(rel, p.image, opts);

// Media frame: complete artwork at its natural proportions inside a fixed-shape
// slot. Shape and fill come from src/content/frames.mjs, never from page CSS.
function frame(rel, image, preset, { cls = '' } = {}) {
  const f = frames[preset];
  const fit = image.fit || f.fit;
  const backdrop = fit === 'backdrop'
    ? `<img class="frame-backdrop" src="${smallest(rel, image)}" alt="" aria-hidden="true" loading="lazy" decoding="async">`
    : '';
  return `<div class="frame frame--${preset} frame--${fit}${cls ? ` ${cls}` : ''}">
    ${backdrop}${img(rel, image, { sizes: frameSizes[preset], cls: 'frame-art' })}
  </div>`;
}

// Placeholder with the same footprint and weight as a framed image.
function framePlaceholder(rel, preset, title, note = '') {
  return `<div class="frame frame--${preset} frame--placeholder" aria-hidden="true">
    <div class="frame-placeholder">
      <img src="${rel}assets/logo/symbol-gold.svg" alt="" width="100" height="100">
      <span class="ph-text"><span class="ph-title">${esc(title)}</span>${note ? `<span class="ph-note">${esc(note)}</span>` : ''}</span>
    </div>
  </div>`;
}

const projectFrame = (rel, p, preset) =>
  p.image ? frame(rel, p.image, preset) : framePlaceholder(rel, preset, p.title, 'Artwork coming soon');

const projectHref = (p) => `${p.category}/${p.slug}/`;

function card(rel, p, { headingLevel = 3 } = {}) {
  const meta = join2(categoryLabel[p.category], p.format);
  const detail = join2(p.contribution, p.status) || 'Details coming soon';
  const art = projectFrame(rel, p, 'card');
  const badge = p.video && videoReady(p.video) ? `<span class="badge">${esc(videos[p.video].label)}</span>` : '';
  const title = p.page
    ? `<a class="card-link" href="${rel}${projectHref(p)}">${esc(p.title)}</a>`
    : esc(p.title);
  return `<article class="card${p.page ? ' is-linked' : ''}">
  <div class="card-art">${art}${badge}</div>
  <p class="card-meta">${esc(meta)}</p>
  <h${headingLevel} class="card-title">${title}</h${headingLevel}>
  <p class="card-detail">${esc(detail)}</p>
</article>`;
}

function credits(list, heading = 'Credits') {
  return `<div class="credits">
  <h2 class="h-label">${esc(heading)}</h2>
  <dl class="credit-list">${list.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
</div>`;
}

function tags(items) {
  const list = items.filter(Boolean);
  return list.length ? `<ul class="tags">${list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
}

function videoReady(key) {
  const v = videos[key];
  return v && v.approved && v.status !== 'unavailable' && youtubeId(v.youtube);
}

// Media area: coming soon (poster-led), working player (loads on activation), unavailable.
function media(rel, p) {
  const v = videos[p.video];
  if (!v) return '';
  const poster = p.image
    ? projectImg(rel, p, { sizes: '(min-width: 900px) 30vw, 60vw', cls: 'media-poster' })
    : `<img class="media-poster media-mark" src="${rel}assets/logo/symbol-gold.svg" alt="" width="100" height="100">`;
  const id = youtubeId(v.youtube);
  if (v.approved && id && v.status !== 'unavailable') {
    return `<section class="media" aria-labelledby="media-h">
  <h2 class="h-label" id="media-h">Watch</h2>
  <p class="media-meta">${esc(p.title)} · ${esc(v.label)}</p>
  <div class="player" data-youtube="${esc(id)}" data-title="${esc(`${p.title} — ${v.label}`)}">
    <button type="button" class="player-start">
      <img src="https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg" alt="" loading="lazy">
      <span class="player-icon" aria-hidden="true"></span>
      <span class="player-label">Play ${esc(v.label.toLowerCase())}</span>
    </button>
  </div>
  <p class="media-note">The YouTube player loads when you press play. Sound starts only when you choose to play.
    <a href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener">Watch on YouTube<span class="visually-hidden"> (opens in a new tab)</span></a></p>
</section>`;
  }
  const unavailable = v.status === 'unavailable';
  const title = unavailable ? 'This video isn’t available right now.' : v.comingSoonTitle;
  const note = unavailable
    ? 'The poster and credits remain on this page. For a screener or more information, get in touch.'
    : v.comingSoonNote;
  return `<section class="media" aria-labelledby="media-h">
  <h2 class="h-label" id="media-h">Watch</h2>
  <div class="media-soon">
    <div class="media-soon-art">${poster}</div>
    <div class="media-soon-copy">
      <p class="soon-kicker">${esc(v.label)}</p>
      <p class="soon-title">${esc(title)}</p>
      <p class="muted">${esc(note)}</p>
      <a class="text-link" href="${rel}contact/?project=${p.slug}">Contact Black Gumbo</a>
    </div>
  </div>
</section>`;
}

function invitation(rel, { heading, line, href = 'contact/', action = 'Contact', titleCard = false }) {
  return `<section class="invitation${titleCard ? ' has-title-card' : ''}" aria-labelledby="invite-h">
  <div class="wrap invitation-inner">
    <div>
      <h2 class="h2" id="invite-h">${esc(heading)}</h2>
      ${line ? `<p class="lede">${esc(line)}</p>` : ''}
      <a class="button" href="${rel}${href}">${esc(action)}</a>
    </div>
    ${titleCard ? `<img class="title-card" src="${rel}assets/img/title-card.jpg" alt="" width="1200" height="675" loading="lazy" decoding="async">` : ''}
  </div>
</section>`;
}

const soonChip = (label) => `<span class="soon-chip"><span class="soon-dot" aria-hidden="true"></span>${esc(label)}</span>`;

// ---------- pages ----------

function homePage() {
  const rel = './';
  const f = bySlug('my-side-of-the-story');
  const trailer = videoReady(f.video)
    ? `<a class="button button-secondary" href="${rel}${projectHref(f)}#media-h">Watch Trailer</a>`
    : soonChip('Trailer coming soon');
  const selected = ['queen-nerd', 'inside-the-ringing-bell', 'butterfly-lane', 'coffee-break'].map(bySlug);
  const discCards = disciplines
    .map((d) => {
      const p = d.image && bySlug(d.image);
      const art = p ? projectFrame(rel, p, 'discipline') : framePlaceholder(rel, 'discipline', d.title, 'Tracks coming soon');
      return `<article class="discipline">
  <div class="discipline-art">${art}</div>
  <h3 class="h3"><a class="card-link" href="${rel}${d.href}">${d.title}</a></h3>
  <p>${esc(d.line)}</p>
  <span class="text-link" aria-hidden="true">${d.action}</span>
</article>`;
    })
    .join('');

  const body = `
<section class="hero" aria-labelledby="hero-title">
  <div class="wrap hero-grid">
    <div class="hero-art">${projectImg(rel, f, { eager: true, sizes: '(min-width: 900px) 46vw, (orientation: landscape) 40vw, 100vw' })}</div>
    <div class="hero-copy">
      <p class="eyebrow">Featured · ${esc(f.format)}</p>
      <p class="presented">${esc(f.presentedBy)}</p>
      <h1 class="display" id="hero-title">${esc(f.title)}</h1>
      <p class="logline">${esc(f.logline)}</p>
      <div class="actions">
        <a class="button" href="${rel}${projectHref(f)}">Explore the Film</a>
        ${trailer}
      </div>
      <p class="hero-credit"><span class="label">Starring</span> Jerry L. White Jr.</p>
    </div>
  </div>
</section>

<section class="section film-intro" aria-labelledby="intro-h">
  <div class="wrap two-col">
    <div>
      <p class="section-num">About the film</p>
      <h2 class="h2" id="intro-h">${esc(f.introHeading)}</h2>
      <p class="lede">${esc(f.logline)}</p>
      ${tags([kindLabel[f.kind], f.format])}
      <a class="text-link" href="${rel}${projectHref(f)}">Go to the project page</a>
    </div>
    ${credits(f.credits, 'Film credits')}
  </div>
</section>

<section class="section" aria-labelledby="disc-h">
  <div class="wrap">
    <p class="section-num">Three disciplines</p>
    <h2 class="h2" id="disc-h">Film, television and music</h2>
    <div class="discipline-grid">${discCards}</div>
  </div>
</section>

<section class="section section-surface" aria-labelledby="work-h">
  <div class="wrap">
    <div class="section-head">
      <h2 class="h2" id="work-h">Selected work</h2>
      <a class="text-link" href="${rel}film/">All projects</a>
    </div>
    <div class="card-grid">${selected.map((p) => card(rel, p)).join('')}</div>
  </div>
</section>

<section class="section partnership" aria-labelledby="partner-h">
  <div class="wrap two-col align-center">
    <div class="partner-art">${img(rel, partnerPhoto, { sizes: '(min-width: 900px) 50vw, 100vw' })}</div>
    <div>
      <p class="section-num">The partnership</p>
      <h2 class="h2" id="partner-h">Jerry L. White Jr. and Sean Thomas</h2>
      <p class="lede">${esc(site.intro)}</p>
      <a class="text-link" href="${rel}about/">About Black Gumbo</a>
    </div>
  </div>
</section>

${invitation(rel, {
  heading: 'Let’s talk about the next story.',
  line: 'For production, creative collaboration, distribution and music inquiries, get in touch with Black Gumbo Entertainment.',
  titleCard: true,
})}`;
  return page({
    rel,
    path: '',
    section: '',
    title: '',
    description: `${site.intro} Featuring the short film My Side of the Story.`,
    body,
    bodyClass: 'home',
  });
}

function projectPage(p) {
  const rel = '../../';
  const cat = categoryLabel[p.category];
  const v = p.video && videos[p.video];
  const actions = [
    `<a class="button" href="${rel}contact/?project=${p.slug}">Business inquiry</a>`,
    p.screener ? `<a class="button button-secondary" href="${rel}contact/?project=${p.slug}&amp;type=screener">Request a screener</a>` : '',
    v && videoReady(p.video) ? `<a class="button button-secondary" href="#media-h">Watch ${esc(v.label.toLowerCase())}</a>` : '',
  ].join('');
  const art = p.image
    ? projectImg(rel, p, { eager: true, sizes: '(min-width: 900px) 42vw, 100vw' })
    : `<div class="art-placeholder art-placeholder-lg" aria-hidden="true"><img src="${rel}assets/logo/symbol-gold.svg" alt="" width="100" height="100"><span>${esc(p.title)}</span></div>`;
  const hasDetails = p.logline || p.contribution || p.credits;
  const body = `
<div class="wrap">
  <nav class="breadcrumb" aria-label="Breadcrumb"><ol><li><a href="${rel}${p.category}/">${cat}</a></li><li aria-current="page">${esc(p.title)}</li></ol></nav>
</div>
<section class="project-hero" aria-labelledby="project-title">
  <div class="wrap hero-grid">
    <div class="hero-art${p.image && p.image.h / p.image.w > 1.2 ? ' is-tall' : ''}">${art}</div>
    <div class="hero-copy">
      <p class="eyebrow">${esc(join2(cat, p.format, p.status))}</p>
      ${p.presentedBy ? `<p class="presented">${esc(p.presentedBy)}</p>` : ''}
      <h1 class="display" id="project-title">${esc(p.title)}</h1>
      ${tags([kindLabel[p.kind], p.format, p.episodes, p.status && `Status: ${p.status}`])}
      ${p.logline ? `<h2 class="h-label">${p.category === 'film' ? 'Logline' : 'Overview'}</h2><p class="logline">${esc(p.logline)}</p>` : ''}
      ${p.contribution && !p.credits ? `<p class="contribution">${esc(p.contribution)}</p>` : ''}
      ${p.disclaimer ? `<p class="disclaimer">${esc(p.disclaimer)}</p>` : ''}
      ${hasDetails ? '' : `<p class="lede muted">Project details — format, credits and status — will be published here soon.</p>`}
      <div class="actions">${actions}</div>
    </div>
  </div>
</section>
${p.video ? `<div class="wrap section-tight">${media(rel, p)}</div>` : ''}
${p.credits ? `<section class="section-tight" aria-label="Credits"><div class="wrap">${credits(p.credits, p.category === 'film' ? 'Film credits' : 'Credited team')}</div></section>` : ''}
${related(rel, p)}
${invitation(rel, {
  heading: p.inquiryHeading || `Interested in ${p.title}?`,
  line: p.inquiryLine || 'Start a conversation with Black Gumbo Entertainment.',
  href: `contact/?project=${p.slug}`,
  action: 'Contact Black Gumbo',
})}`;
  return page({
    rel,
    path: projectHref(p),
    section: `${p.category}/`,
    title: p.title,
    description: p.logline || `${p.title} — ${cat} project from ${site.name}.`,
    body,
  });
}

function related(rel, p) {
  const list = projects
    .filter((o) => o.category === p.category && o.slug !== p.slug && o.page && o.image)
    .slice(0, 3);
  if (!list.length) return '';
  return `<section class="section" aria-labelledby="related-h">
  <div class="wrap">
    <h2 class="h2" id="related-h">More ${categoryLabel[p.category].toLowerCase()}</h2>
    <div class="card-grid card-grid-3">${list.map((o) => card(rel, o)).join('')}</div>
  </div>
</section>`;
}

function pageIntro(title, line, id = 'page-title') {
  return `<header class="page-intro">
  <div class="wrap">
    <h1 class="display" id="${id}">${esc(title)}</h1>
    <p class="lede">${esc(line)}</p>
  </div>
</header>`;
}

function featureBlock(rel, p, { cta }) {
  return `<article class="feature">
  <div class="feature-art${p.image.h / p.image.w > 1.2 ? ' is-tall' : ''}">${projectImg(rel, p, { sizes: '(min-width: 900px) 40vw, 100vw' })}</div>
  <div class="feature-copy">
    <p class="eyebrow">${esc(join2('Featured', kindLabel[p.kind], p.format, p.status))}</p>
    <h2 class="h1"><a class="card-link" href="${rel}${projectHref(p)}">${esc(p.title)}</a></h2>
    ${p.logline ? `<p class="lede">${esc(p.logline)}</p>` : ''}
    ${p.category === 'television' ? credits(p.credits, 'Credited team') : `<p class="contribution">${esc(p.contribution)}</p>`}
    <div class="actions"><span class="button" aria-hidden="true">${esc(cta)}</span></div>
  </div>
</article>`;
}

function filmPage() {
  const rel = '../';
  const f = bySlug('my-side-of-the-story');
  const portfolio = projects.filter((p) => p.category === 'film' && p.kind === 'portfolio');
  const acting = projects.filter((p) => p.kind === 'acting-credit');
  const body = `
${pageIntro('Film', 'Original short and feature work from Black Gumbo Entertainment, with selected acting credits.')}
<div class="wrap">
  <nav class="filters" aria-label="Film sections"><ul>
    <li><a href="#featured">Featured</a></li>
    <li><a href="#portfolio">Company productions and portfolio</a></li>
    <li><a href="#acting">Acting credits</a></li>
  </ul></nav>
</div>
<section class="section-tight" id="featured" aria-label="Featured film"><div class="wrap">${featureBlock(rel, f, { cta: 'View project' })}</div></section>
<section class="section" id="portfolio" aria-labelledby="portfolio-h">
  <div class="wrap">
    <h2 class="h2" id="portfolio-h">Company productions and portfolio titles</h2>
    <div class="card-grid">${portfolio.map((p) => card(rel, p)).join('')}</div>
  </div>
</section>
<section class="section section-surface" id="acting" aria-labelledby="acting-h">
  <div class="wrap">
    <h2 class="h2" id="acting-h">Acting credits</h2>
    <ul class="credit-rows">${acting.map((p) => `<li><span class="credit-title">${esc(p.title)}</span><span class="muted">${esc(p.contribution)}</span></li>`).join('')}</ul>
  </div>
</section>
${invitation(rel, { heading: 'Let’s talk about the next story.', line: 'Distribution, festival, press and collaboration conversations start here.' })}`;
  return page({ rel, path: 'film/', section: 'film/', title: 'Film', description: 'Film projects from Black Gumbo Entertainment, led by the short film My Side of the Story.', body });
}

function televisionPage() {
  const rel = '../';
  const q = bySlug('queen-nerd');
  const body = `
${pageIntro('Television', 'Series and television projects developed by Black Gumbo Entertainment.')}
<section class="section-tight" aria-label="Featured series"><div class="wrap">${featureBlock(rel, q, { cta: 'Explore the series' })}</div></section>
${invitation(rel, { heading: 'Developing or packaging a series? Let’s talk.', line: '' })}`;
  return page({ rel, path: 'television/', section: 'television/', title: 'Television', description: 'Television projects from Black Gumbo Entertainment, including the limited series Queen Nerd.', body });
}

function musicPage() {
  const rel = '../';
  const jt = bySlug('jolly-time-animation-concept');
  const body = `
${pageIntro('Music', 'Songwriting, tracks and music-led projects by Jerry L. White Jr. and Sean Thomas.')}
<section class="section-tight" aria-labelledby="tracks-h">
  <div class="wrap">
    <h2 class="h2" id="tracks-h">Selected tracks</h2>
    <div class="soon-panel">
      <img src="${rel}assets/logo/symbol-gold.svg" alt="" width="100" height="100">
      <div>
        <p class="soon-title">Selected tracks coming soon</p>
        <p class="muted">Tracks, credits and official listening links will be published here.</p>
      </div>
    </div>
  </div>
</section>
<section class="section" aria-labelledby="led-h">
  <div class="wrap">
    <h2 class="h2" id="led-h">Music-led projects</h2>
    <article class="music-project">
      <div class="music-project-art">${framePlaceholder(rel, 'wide', 'Animation concept', 'Video coming soon')}</div>
      <div>
        <p class="eyebrow">${esc(kindLabel[jt.kind])}</p>
        <h3 class="h3"><a class="card-link" href="${rel}${projectHref(jt)}">${esc(jt.title)}</a></h3>
        <p class="contribution">${esc(jt.contribution)}</p>
        <p class="disclaimer">${esc(jt.disclaimer)}</p>
      </div>
    </article>
  </div>
</section>
${invitation(rel, { heading: 'Sync, songwriting or collaboration inquiries', line: 'Talk to Black Gumbo Entertainment about music opportunities.' })}`;
  return page({ rel, path: 'music/', section: 'music/', title: 'Music', description: 'Songwriting, tracks and music-led projects from Black Gumbo Entertainment.', body });
}

function aboutPage() {
  const rel = '../';
  const partner = (name, credits) => `<article class="partner">
  <h3 class="h3">${esc(name)}</h3>
  <p class="muted">Biography coming soon.</p>
  ${credits ? `<p class="partner-credits"><span class="label">Selected work</span> ${credits}</p>` : ''}
</article>`;
  const body = `
<section class="about-hero" aria-labelledby="page-title">
  <div class="wrap two-col align-center">
    <div class="partner-art">${img(rel, partnerPhoto, { eager: true, sizes: '(min-width: 900px) 50vw, 100vw' })}</div>
    <div>
      <p class="eyebrow">About</p>
      <h1 class="h1" id="page-title">A creative partnership across film, television and music.</h1>
      <p class="lede">${esc(site.intro)}</p>
    </div>
  </div>
</section>
<section class="section" aria-labelledby="partners-h">
  <div class="wrap">
    <h2 class="h2" id="partners-h">The partners</h2>
    <div class="partner-grid">
      ${partner('Jerry L. White Jr.', `<a href="${rel}film/my-side-of-the-story/">My Side of the Story</a> · <a href="${rel}television/queen-nerd/">Queen Nerd</a>`)}
      ${partner('Sean Thomas', `<a href="${rel}music/jolly-time-animation-concept/">JOLLY TIME Popcorn — Animation Concept</a> (independent concept)`)}
    </div>
  </div>
</section>
${invitation(rel, { heading: 'Start a conversation.', line: 'For production, creative collaboration, distribution and music inquiries.' })}`;
  return page({ rel, path: 'about/', section: 'about/', title: 'About', description: site.intro, body });
}

function contactPage() {
  const rel = '../';
  const options = projects
    .filter((p) => p.page)
    .map((p) => `<option value="${p.slug}">${esc(p.title)}</option>`)
    .join('');
  const demo = !site.formEndpoint;
  const body = `
${pageIntro('Let’s talk about the next story.', 'For production, creative collaboration, distribution and music inquiries, get in touch with Black Gumbo Entertainment.')}
<section class="section-tight" aria-label="Contact">
  <div class="wrap contact-grid">
    <aside class="contact-aside">
      <h2 class="h-label">Prefer email?</h2>
      ${site.businessEmail ? `<p><a class="email" href="mailto:${esc(site.businessEmail)}">${esc(site.businessEmail)}</a></p><p class="muted">We reply from this address.</p>` : `<p class="soon-title">Business email coming soon</p><p class="muted">The official business address will be listed here.</p>`}
      <p class="notice">Please share brief context only. Do not send scripts, financial information or other sensitive files through this form; a secure route will be arranged if a project moves forward.</p>
    </aside>
    <div>
      ${demo ? `<p class="preview-banner" role="note"><strong>Review preview.</strong> This form is not connected yet, so messages are not sent.</p>` : ''}
      <form class="inquiry" novalidate data-endpoint="${esc(site.formEndpoint)}" aria-describedby="form-help">
        <div class="error-summary" tabindex="-1" hidden></div>
        <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" autocomplete="name" required></div>
        <div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required><p class="field-error" id="f-email-err" hidden></p></div>
        <div class="field"><label for="f-company">Company / role <span class="muted">(optional)</span></label><input id="f-company" name="company" autocomplete="organization"></div>
        <div class="field"><label for="f-type">Inquiry type</label><select id="f-type" name="type">${inquiryTypes.map((t) => `<option>${esc(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="f-project">Project <span class="muted">(optional)</span></label><select id="f-project" name="project"><option value="">None</option>${options}</select></div>
        <div class="field"><label for="f-message">Message</label><textarea id="f-message" name="message" rows="6" required></textarea><p class="field-error" id="f-message-err" hidden></p></div>
        <div class="form-actions">
          <button class="button" type="submit">Send inquiry</button>
          <p class="muted small" id="form-help">By sending you agree to the <a href="${rel}privacy/">privacy notice</a>.</p>
        </div>
        <div class="form-status" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>`;
  return page({ rel, path: 'contact/', section: 'contact/', title: 'Contact', description: 'Business inquiries for Black Gumbo Entertainment: production, collaboration, distribution and music.', body });
}

function privacyPage() {
  const rel = '../';
  const body = `
${pageIntro('Privacy', 'How this review preview handles your information.')}
<section class="section-tight"><div class="wrap prose">
  <p>This website is a review preview of the Black Gumbo Entertainment site.</p>
  <h2 class="h3">Contact form</h2>
  <p>${site.formEndpoint ? 'Messages sent through the contact form are delivered to Black Gumbo Entertainment and used only to reply to your inquiry.' : 'The contact form is not connected during this preview. Nothing you type is sent or stored.'}</p>
  <h2 class="h3">Video</h2>
  <p>Videos are hosted on YouTube. A YouTube player loads only after you press play, using YouTube’s privacy-enhanced mode; YouTube’s own privacy policy applies from that point.</p>
  <h2 class="h3">Fonts and analytics</h2>
  <p>Fonts are served from this website. The preview uses no analytics or advertising trackers.</p>
</div></section>`;
  return page({ rel, path: 'privacy/', section: '', title: 'Privacy', description: 'Privacy information for the Black Gumbo Entertainment website.', body });
}

function notFoundPage() {
  // GitHub Pages serves 404.html for unknown paths at any depth, so links are absolute to the repo path.
  const rel = '/black-gumbo-entertainment/';
  const body = `
<section class="section not-found"><div class="wrap">
  <img class="title-card" src="${rel}assets/img/title-card.jpg" alt="" width="1200" height="675">
  <h1 class="h1">This page isn’t here.</h1>
  <p class="lede">The page may have moved. Start from the homepage or explore the work.</p>
  <div class="actions"><a class="button" href="${rel}">Go to Home</a><a class="button button-secondary" href="${rel}film/">Film</a></div>
</div></section>`;
  return page({ rel, path: '404.html', section: '', title: 'Page not found', description: 'Page not found.', body });
}

// ---------- write ----------

async function write(path, html) {
  const file = join(OUT, path, path.endsWith('.html') ? '' : 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

await rm(OUT, { recursive: true, force: true });
await cp(join(ROOT, 'src/static'), OUT, { recursive: true });
await writeFile(join(OUT, '.nojekyll'), '');
// Frame shapes come from src/content/frames.mjs and are appended to the stylesheet.
await appendFile(
  join(OUT, 'assets/css/site.css'),
  `\n/* Generated from src/content/frames.mjs */\n${Object.entries(frames).map(([k, f]) => `.frame--${k} { --frame-ratio: ${f.ratio}; }`).join('\n')}\n`,
);
await writeFile(
  join(OUT, 'site.webmanifest'),
  JSON.stringify(
    {
      name: site.name,
      short_name: 'Black Gumbo',
      start_url: './',
      scope: './',
      icons: [
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: '#221E1B',
      background_color: '#221E1B',
      display: 'standalone',
    },
    null,
    2,
  ),
);

const pages = [
  ['', homePage()],
  ['film/', filmPage()],
  ['television/', televisionPage()],
  ['music/', musicPage()],
  ['about/', aboutPage()],
  ['contact/', contactPage()],
  ['privacy/', privacyPage()],
  ['404.html', notFoundPage()],
  ...projects.filter((p) => p.page).map((p) => [projectHref(p), projectPage(p)]),
];
for (const [path, html] of pages) await write(path, html);
console.log(`Built ${pages.length} pages into docs/`);

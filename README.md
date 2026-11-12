# Black Gumbo Entertainment — customer review site

Standalone review preview for Black Gumbo Entertainment, the creative partnership of Jerry L. White Jr. and Sean Thomas. Prepared by SquidBay.

- **Review URL:** https://squidbay.github.io/black-gumbo-entertainment/
- **Stage:** GitHub Pages review preview. Pages carry `noindex`; the site is publicly reachable, not private.
- **Foundation:** Website Plan v1.0 (Nov 4, 2026) and P1 wireframes. Colors and fonts: P2 option 05, Analog Cinema (Oswald 500 headings, Lora body; `#221E1B` / `#2D2824` grounds, `#EDE3D1` text, `#CF8B5C` copper UI accent). Logo: approved option 04 flat masters in gold `#C9A24A`.

## Layout

```
src/content/site.mjs       company, navigation, footer, contact settings (email, form endpoint, social)
src/content/projects.mjs   one record per project: card + optional project page
src/content/videos.mjs     every YouTube link on the site, in one place
src/static/                CSS, JS, fonts, logo, icons, artwork (copied into docs/)
tools/build.mjs            renders all pages into docs/
tools/check.mjs            rendered checks: 13 pages × 7 viewports + menu/form interactions
docs/                      built site, served by GitHub Pages (main branch, /docs)
```

```bash
node tools/build.mjs
```

All links are relative, so the build works under the `/black-gumbo-entertainment/` subpath and at a domain root. Each route is a directory with its own `index.html`, so direct navigation and refresh work everywhere.

## Updating video

Open `src/content/videos.mjs`, paste the YouTube URL into `youtube`, set `approved: true`, rebuild and push. Until then each project shows a poster-led "coming soon" state. The player loads only when a visitor presses play (privacy-enhanced mode; no autoplay, no automatic sound). Set `status: 'unavailable'` to show the unavailable state if a link is withdrawn. A full film is published only with Jerry and Sean's explicit approval.

## Contact

`businessEmail` and `formEndpoint` in `site.mjs` are empty, so the contact page is a clearly labelled review demonstration: it validates input and states that nothing was sent. It never shows a success message without a confirmed delivery.

## Poster artwork in this preview

Artwork comes from the SquidBay poster handoff v2 (Nov 5, 2026). Only the web exports used on the site are published: originals, review masters, editable files and review sheets stay out of this repository. Each set is served as WebP with a JPEG fallback (320w / 640w / 960w / native).

| Project | Artwork on the preview | Status |
|---|---|---|
| Queen Nerd | Faithful export **v2** (Display P3 → sRGB colour conversion, independently verified) | Ready |
| Inside The Ringing Bell | Faithful export v1, unchanged composition | Ready |
| My Side of the Story | **Review reconstruction v1** — the clipped top-right tagline is re-typeset (SOMETIMES THE TRUTH / HURTS. SOMETIMES IT HEALS.) over a small generated wall patch (x730–1110, y0–90). Face, title, starring line, kitchen and lower slogan are source pixels. Typeface is an approximation. | **Needs Jerry's approval** |
| Coffee Break | **Review reconstruction v1** — generated top band and lower tabletop/cups, title re-typeset in cream/peach. The clipped top sentence is deliberately omitted (its ending is unknown). Faces and central wording are source pixels. | **Needs Jerry's approval** |
| Butterfly Lane | Original illustrated artwork (unchanged). Its top-right and bottom-right interface marks remain. A typography-only alternative exists in the handoff but is not used without the customer's choice. | Customer choice pending |

The two reconstructions are not recovered originals and are not customer-approved finals. If Jerry declines either, point its `image` record in `src/content/projects.mjs` back at a faithful export.

## Verification record

- Automated: `node tools/check.mjs [url]` — 13 pages × 7 viewports (desktop to 320 px, phone landscape), menu focus trap, form states, 404; `node tools/frame-fixtures.mjs` for the card frames.
- Real devices (emulated hardware, actual browsers), 2026-11-11, against the deployed site: **iOS 26.5 Safari** (iPhone 17 simulator) and **Android 14 Chrome 113** (`medium_phone` AVD) — portrait, landscape and rotation; menu, scrolling and sticky header, poster framing, CTAs, and the contact form with the soft keyboard open. Fix found and shipped: the form's "Not sent" result is scrolled into view after Send (it fell below the visible area on phones).

## Content still needed from Jerry and Sean

Already supplied and not needed again: the My Side of the Story logline, credits and poster; the Queen Nerd credits and one-sheet wording; the JOLLY TIME disclaimer; the company introduction; the approved logo; the @Whitejr916 channel link. Original posters in other formats are not available and are not requested.

1. **My Side of the Story** — official YouTube trailer URL; full-film decision (public viewing vs. screener by request); confirm "Short film" and current status; year/runtime; approved synopsis (the site uses the logline only); approval of the repaired-tagline poster and the Coffee Break reconstruction, and a choice on Butterfly Lane's artwork (see above).
2. **Business contact** — public business email and the form delivery route; official social links for the company and for each partner (only @Whitejr916 is linked today).
3. **Partner bios** — short bio and role for Jerry and for Sean; an approved portrait of each; which person is which in the joint studio photo. The joint photo includes an earlier Black Gumbo logo in its top-right corner — confirm it is still the image to use.
4. **Film titles** — Inside The Ringing Bell, Butterfly Lane, Coffee Break, Low Hanging Fruit: category, format, exact credit, status, and permission to publish the artwork (Low Hanging Fruit has no artwork yet).
5. **Queen Nerd** — approved series description, confirmed status, concept teaser YouTube URL, and whether the one-sheet may be a public download.
6. **Music** — first cleared tracks (title, role, collaborators, listening link), lead artwork, and which channels are official; JOLLY TIME concept video URL.
7. **Acting credits and appearances** — role/year for The Lost Son Returns As The Duke; which premiere, screening or on-set photos may appear, with captions; whether TRUTH & Humor and Whispers of Desire belong on the site.

## Out of scope here

Production build, Cloudflare deployment, domain connection, contact delivery and the Agent website-editor integration follow customer approval of this preview. Fonts are Oswald and Lora (SIL Open Font License 1.1), self-hosted.

// Media frame presets — the single place that decides how artwork sits in a
// fixed-shape slot (cards, category tiles, placeholders).
//
// Artwork of any proportion (tall poster, square, landscape still) is always
// shown complete at its natural aspect ratio: never cropped, never stretched.
//
// ratio  frame shape, width / height.
// fit    'backdrop' — complete artwork centred, unused frame space filled with
//                     a blurred, darkened copy of the same image (decorative).
//        'plain'    — complete artwork centred on the plain surface colour.
//
// A project can override the fit for its own image with `image.fit`.
// Hero posters, project-detail posters and video players are not framed.

export const frames = {
  card: { ratio: '2 / 3', fit: 'backdrop' },       // portfolio / selected-work / related cards
  discipline: { ratio: '4 / 5', fit: 'backdrop' }, // homepage Film / Television / Music tiles
  wide: { ratio: '16 / 9', fit: 'backdrop' },      // music-led projects, landscape stills
};

// Responsive `sizes` hints per frame use.
export const frameSizes = {
  card: '(min-width: 1200px) 280px, (min-width: 760px) 30vw, 46vw',
  discipline: '(min-width: 760px) 30vw, 46vw',
  wide: '(min-width: 600px) 45vw, 100vw',
};

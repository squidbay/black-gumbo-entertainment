// Per-project records. One record = one card, and (when `page` is true) one
// project-detail page at /<category>/<slug>/.
//
// Required for a card: title, category, kind. Everything else is optional and
// renders only when supplied. Leave unconfirmed fields empty — never guess
// a format, contribution, status, year or runtime.
//
// image: { set, widths, webp } points at a responsive export set
// (assets/img/<set>-<width>w.jpg|webp); { src } is a legacy single JPEG + -640.
//
// kind: 'company-production' | 'company-development' | 'acting-credit' |
//       'independent-concept' | 'portfolio'

export const projects = [
  {
    slug: 'my-side-of-the-story',
    title: 'My Side of the Story',
    category: 'film',
    kind: 'company-production',
    format: 'Short film',
    featured: true,
    page: true,
    presentedBy: 'Presented by Black Gumbo Entertainment',
    contribution: 'Starring, written and directed by Jerry L. White Jr.',
    status: '',
    // Review reconstruction v1 (repaired top tagline) — awaiting Jerry's approval.
    image: { set: 'projects/my-side-of-the-story/my-side-of-the-story-review-v1', widths: [320, 640, 960, 1170], webp: true, w: 1170, h: 1159, alt: 'My Side of the Story — official poster. A man stands in a dim kitchen beside the title and the line “Every man has a side. This is mine.”' },
    logline:
      'After the woman he loves walks away, a man is left alone with everything he never got to say. As heartbreak turns into anger and vulnerability, he confronts the memories, unanswered questions, and emotions that remain.',
    introHeading: 'A man alone with everything he never got to say.',
    credits: [
      ['Starring', 'Jerry L. White Jr.'],
      ['Written by', 'Jerry L. White Jr.'],
      ['Directed by', 'Jerry L. White Jr.'],
      ['Produced by', 'Maxwell J. Harris (Floating Horse Films)'],
      ['Edited by', 'Patrick “Pat” McElroy'],
      ['Filming Location', 'Black Gumbo Entertainment'],
    ],
    video: 'my-side-of-the-story-trailer',
    screener: true,
    inquiryHeading: 'Interested in this film?',
    inquiryLine: 'Distribution, festival, press and screening conversations start here.',
  },
  {
    slug: 'queen-nerd',
    title: 'Queen Nerd',
    category: 'television',
    kind: 'company-development',
    format: 'Limited series',
    featured: true,
    page: true,
    contribution: 'Created and written by Jerry L. White Jr.',
    status: 'In development',
    episodes: '7 episodes (planned)',
    image: { set: 'projects/queen-nerd/queen-nerd-v2', widths: [320, 640, 960, 1170], webp: true, w: 1170, h: 1240, alt: 'Queen Nerd — series poster. A 7 episode miniseries.' },
    logline:
      'A seven-episode limited series created and written by Jerry L. White Jr. and developed by Black Gumbo Entertainment.',
    credits: [
      ['Created and written by', 'Jerry L. White Jr.'],
      ['Developed by', 'Black Gumbo Entertainment'],
      ['Inspired by', 'Tisha Vaculin'],
    ],
    video: 'queen-nerd-concept-teaser',
    inquiryHeading: 'Interested in Queen Nerd?',
    inquiryLine: 'Development, packaging and partnership conversations start here.',
  },
  {
    slug: 'inside-the-ringing-bell',
    title: 'Inside The Ringing Bell',
    category: 'film',
    kind: 'portfolio',
    page: true,
    image: { set: 'projects/inside-the-ringing-bell/inside-the-ringing-bell-v1', widths: [320, 640, 1010], webp: true, w: 1010, h: 1518, alt: 'Inside The Ringing Bell — poster. A man looks out of a train window toward a city at sunset.' },
  },
  {
    slug: 'butterfly-lane',
    title: 'Butterfly Lane',
    category: 'film',
    kind: 'portfolio',
    page: true,
    // Original illustrated artwork, kept until the customer chooses otherwise.
    image: { src: 'projects/butterfly-lane', w: 1112, h: 1650, alt: 'Butterfly Lane — poster. A bandaged woman sits in a dark armchair beneath the tagline “Beauty can be a dangerous illusion.”' },
  },
  {
    slug: 'coffee-break',
    title: 'Coffee Break',
    category: 'film',
    kind: 'portfolio',
    page: true,
    // Review reconstruction v1 (rebuilt top and tabletop, re-typeset title) — awaiting Jerry's approval.
    image: { set: 'projects/coffee-break/coffee-break-review-v1', widths: [320, 640, 960, 1170], webp: true, w: 1170, h: 1615, alt: 'Coffee Break — poster. A man and a woman sit across a café table with two cups of coffee.' },
  },
  {
    slug: 'low-hanging-fruit',
    title: 'Low Hanging Fruit',
    category: 'film',
    kind: 'portfolio',
    page: false,
  },
  {
    slug: 'the-lost-son-returns-as-the-duke',
    title: 'The Lost Son Returns As The Duke',
    category: 'film',
    kind: 'acting-credit',
    page: false,
    contribution: 'Acting credit · Jerry L. White Jr.',
  },
  {
    slug: 'jolly-time-animation-concept',
    title: 'JOLLY TIME Popcorn — Animation Concept',
    category: 'music',
    kind: 'independent-concept',
    format: 'Animation concept',
    page: true,
    contribution: 'Songwriting · Visual storytelling · Created by Jerry L. White Jr. & Sean Thomas',
    disclaimer:
      'Independent creative concept for portfolio and demonstration purposes. Not an official JOLLY TIME Popcorn production.',
    video: 'jolly-time-animation-concept',
    inquiryHeading: 'Sync, songwriting or collaboration inquiries',
    inquiryLine: 'Talk to Black Gumbo Entertainment about music-led projects.',
  },
];

export const kindLabel = {
  'company-production': 'Company production',
  'company-development': 'Company development',
  'acting-credit': 'Acting credit',
  'independent-concept': 'Independent creative concept',
  portfolio: '',
};

export const categoryLabel = { film: 'Film', television: 'Television', music: 'Music' };

export const bySlug = (slug) => projects.find((p) => p.slug === slug);

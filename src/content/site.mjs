// Global content: company, navigation, footer and contact details.
// Leave a value empty when it has not been approved; the templates show an
// honest "coming soon" state instead of a placeholder.

export const site = {
  name: 'Black Gumbo Entertainment',
  tagline: 'Original storytelling across film, television and music.',
  intro:
    'Black Gumbo Entertainment is the creative partnership of Jerry L. White Jr. and Sean Thomas, bringing together original storytelling across film, television and music.',
  // Review stage: keep every page out of search results.
  noindex: true,
  // Approved public business email. Empty until Jerry and Sean confirm it.
  businessEmail: '',
  // Contact form delivery endpoint. Empty = review demonstration (nothing is sent).
  formEndpoint: '',
  social: [
    { label: 'YouTube — @Whitejr916', href: 'https://www.youtube.com/@Whitejr916' },
  ],
  year: 2026,
};

export const nav = [
  { label: 'Film', href: 'film/' },
  { label: 'Television', href: 'television/' },
  { label: 'Music', href: 'music/' },
  { label: 'About', href: 'about/' },
  { label: 'Contact', href: 'contact/' },
];

export const disciplines = [
  {
    title: 'Film',
    line: 'Original short and feature work, led by My Side of the Story.',
    href: 'film/',
    action: 'View film',
    image: 'inside-the-ringing-bell',
  },
  {
    title: 'Television',
    line: 'Series in development, including the limited series Queen Nerd.',
    href: 'television/',
    action: 'Explore series',
    image: 'queen-nerd',
  },
  {
    title: 'Music',
    line: 'Songwriting, tracks and music-led projects with approved listening links.',
    href: 'music/',
    action: 'Listen',
    image: '',
  },
];

export const inquiryTypes = [
  'General',
  'Film & Television',
  'Music',
  'Collaboration or business opportunity',
];

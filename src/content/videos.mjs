// Central video registry. Every player on the site reads from here.
//
// To publish a video, paste its YouTube URL (watch, youtu.be or embed form)
// into `youtube` and set `approved: true`. Leave `youtube` empty to keep the
// poster-led "coming soon" state. Set `status: 'unavailable'` if a published
// link is removed or made private; the page then shows the unavailable state
// at the same size as the player.
//
// Publishing a full film requires explicit public-viewing approval from
// Jerry and Sean. Never paste an unlisted link here as a "private" screener.

export const videos = {
  'my-side-of-the-story-trailer': {
    label: 'Official trailer',
    youtube: '',
    approved: false,
    status: 'coming-soon',
    comingSoonTitle: 'Trailer coming soon',
    comingSoonNote: 'The official trailer will premiere here.',
  },
  'queen-nerd-concept-teaser': {
    label: 'Concept teaser',
    youtube: '',
    approved: false,
    status: 'coming-soon',
    comingSoonTitle: 'Concept teaser coming soon',
    comingSoonNote: 'The Queen Nerd concept teaser will be available here.',
  },
  'jolly-time-animation-concept': {
    label: 'Animation concept',
    youtube: '',
    approved: false,
    status: 'coming-soon',
    comingSoonTitle: 'Animation concept coming soon',
    comingSoonNote: 'The animation concept will be available here.',
  },
};

// Accepts https://www.youtube.com/watch?v=ID, https://youtu.be/ID,
// https://www.youtube.com/embed/ID or a bare 11-character ID.
export function youtubeId(url) {
  if (!url) return '';
  const m = String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{11}$/.test(url) ? url : '';
}

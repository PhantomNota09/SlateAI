// Content for the landing page. The films are real titles shown as ILLUSTRATIONS: the match scores
// next to them are demo numbers, not real recommendations (see shared/demoFilms.ts).

export { DEMO_FILMS as FILMS, filmById } from '../../shared/demoFilms';

export const DEMO_GENRES = ['Sci-Fi', 'Thriller', 'Drama', 'Comedy', 'Romance', 'Animation', 'Mystery', 'Action', 'Horror'];

// The 19 genres Slate asks about in onboarding (shown on the marquee).
export const MARQUEE = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
  'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western', 'TV Movie',
];

// What goes into a match, in rough order of how much it counts. Names follow the real engine;
// bar lengths are relative weights, not exact scoring numbers.
export const FACTORS = [
  { id: 'genres', label: 'Genres you love', weight: 1.0, note: 'Overlap with your favorites, and a hard no for what you avoid.' },
  { id: 'history', label: 'What you’ve watched', weight: 1.0, note: 'Your own ratings and history shape the next pick.' },
  { id: 'themes', label: 'Themes', weight: 0.75, note: 'Heists, time travel, coming-of-age: the topics you chose.' },
  { id: 'language', label: 'Language', weight: 0.62, note: 'Your preferred languages, in the order you ranked them.' },
  { id: 'quality', label: 'Quality bar', weight: 0.62, note: 'Ratings matter, and you set how picky to be.' },
  { id: 'discovery', label: 'Hidden gems & classics', weight: 0.5, note: 'A nudge toward cult favorites and under-the-radar finds.' },
  { id: 'era', label: 'Release era', weight: 0.38, note: 'New releases, a mix, or the classics.' },
  { id: 'context', label: 'Runtime & tone', weight: 0.38, note: 'How long tonight is, and what mood you’re in.' },
];

// Real wording from Slate’s match explanations, for the film shown on the “why” card.
export const SAMPLE_REASONS = [
  'Matches your love of Sci-Fi, Action',
  'Perfect genre combination!',
  'In your preferred language',
  'Exceptional 8.4 rating',
  'Features Mind-Bending',
];

// The ten reasons the app offers when you say “Not for me”.
export const DISMISS_REASONS = [
  'Not interested in this genre', 'Not in the mood for this', 'Too long', 'Too short', 'Too much violence',
  'Too mature/explicit', 'Looks boring', 'Reviews are bad', 'Too old', 'Other (specify)',
];

export const STREAK_BADGES = [
  { id: 'streak_3', name: 'Coming Attraction', days: 3, blurb: '3 days in a row' },
  { id: 'streak_7', name: 'Weekly Matinee', days: 7, blurb: 'You showed up every day this week' },
  { id: 'streak_30', name: 'Monthly Pass', days: 30, blurb: '30 days of daily film discovery' },
  { id: 'streak_100', name: 'Dedicated Cinephile', days: 100, blurb: '100 days without missing a single one' },
  { id: 'streak_365', name: 'Auteur', days: 365, blurb: 'A full year of daily film discovery' },
];

export const ALSO = [
  { title: 'Friends & leaderboard', text: 'Compare tastes and see what your friends are watching.', where: 'iPhone' },
  { title: 'Letterboxd import', text: 'Bring your history so picks are personal from day one.', where: 'iPhone' },
  { title: 'Franchise collections', text: 'Track a whole saga and see what to watch next, in order.', where: 'iPhone' },
  { title: 'Watch Later', text: 'Save a movie for another night. It’s there on every device.', where: 'iPhone + Web' },
  { title: 'Your streaming services', text: 'Choose where you watch and picks lean toward what you can stream.', where: 'iPhone + Web' },
];

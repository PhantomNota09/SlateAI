// Toy ranking for the “Tap what you love” demo. It mimics the SHAPE of Slate’s real behavior
// (genres you love lift a pick, genres you avoid remove it, every pick explains itself) but the
// numbers are illustrative, not the real engine.

export const MAX_PER_LIST = 3; // the app caps favorites and avoided genres at 3 each

export function toggleGenre(list, genre, other) {
  if (list.includes(genre)) return { list: list.filter((g) => g !== genre), other };
  const nextOther = other.filter((g) => g !== genre); // favorites and avoids are mutually exclusive
  if (list.length >= MAX_PER_LIST) return { list, other };
  return { list: [...list, genre], other: nextOther };
}

export function scoreFilm(film, loves, avoids) {
  const hidden = film.genres.some((g) => avoids.includes(g));
  const matched = film.genres.filter((g) => loves.includes(g));
  const base = 44 + Math.round((film.rating - 7) * 6);
  const score = Math.min(93, base + matched.length * 22);
  const reasons = [];
  if (matched.length > 0) reasons.push(`Matches your love of ${matched.join(', ')}`);
  reasons.push(film.rating >= 8 ? `Exceptional ${film.rating.toFixed(1)} rating` : `Highly rated (${film.rating.toFixed(1)})`);
  return { film, score, reasons, hidden, matched };
}

// Visible films first (best match first), filtered-out films last. Stable for equal scores.
export function rankFilms(films, loves, avoids) {
  const scored = films.map((f, i) => ({ ...scoreFilm(f, loves, avoids), order: i }));
  const visible = scored.filter((s) => !s.hidden).sort((a, b) => b.score - a.score || a.order - b.order);
  const hidden = scored.filter((s) => s.hidden).sort((a, b) => a.order - b.order);
  return [...visible, ...hidden].map((s, rank) => ({ ...s, rank }));
}

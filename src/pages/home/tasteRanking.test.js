import { describe, expect, it } from 'vitest';
import { FILMS, DEMO_GENRES } from './data';
import { MAX_PER_LIST, rankFilms, scoreFilm, toggleGenre } from './tasteRanking';

describe('toggleGenre (mirrors the onboarding rules)', () => {
  it('adds and removes a genre', () => {
    expect(toggleGenre([], 'Drama', []).list).toEqual(['Drama']);
    expect(toggleGenre(['Drama'], 'Drama', []).list).toEqual([]);
  });
  it('caps each list at three', () => {
    expect(toggleGenre(['Drama', 'Comedy', 'Horror'], 'Action', []).list).toEqual(['Drama', 'Comedy', 'Horror']);
    expect(MAX_PER_LIST).toBe(3);
  });
  it('keeps loves and avoids mutually exclusive', () => {
    const r = toggleGenre(['Drama'], 'Horror', ['Horror', 'Comedy']);
    expect(r.list).toEqual(['Drama', 'Horror']);
    expect(r.other).toEqual(['Comedy']);
  });
});

describe('rankFilms', () => {
  it('ranks films that match more loved genres higher', () => {
    const ranked = rankFilms(FILMS, ['Sci-Fi', 'Thriller'], []);
    expect(ranked[0].film.id).toBe('signal'); // Sci-Fi + Thriller
    expect(ranked[0].score).toBeGreaterThan(ranked[ranked.length - 1].score);
  });
  it('removes avoided genres and sends them to the end', () => {
    const ranked = rankFilms(FILMS, ['Sci-Fi'], ['Horror']);
    const bloom = ranked.find((r) => r.film.id === 'bloom');
    expect(bloom.hidden).toBe(true);
    expect(ranked[ranked.length - 1].film.id).toBe('bloom');
  });
  it('explains every visible pick, naming the genres that matched', () => {
    const top = rankFilms(FILMS, ['Romance'], [])[0];
    expect(top.reasons[0]).toMatch(/^Matches your love of .*Romance/);
    for (const r of rankFilms(FILMS, [], [])) expect(r.reasons.length).toBeGreaterThan(0);
  });
  it('keeps scores in a believable range, never 100%', () => {
    for (const a of DEMO_GENRES) for (const b of DEMO_GENRES) {
      for (const r of rankFilms(FILMS, [a, b], [])) {
        expect(r.score).toBeGreaterThanOrEqual(35);
        expect(r.score).toBeLessThanOrEqual(93);
      }
    }
  });
  it('is stable for equal scores and gives every film a unique rank', () => {
    const ranks = rankFilms(FILMS, [], []).map((r) => r.rank);
    expect(ranks).toEqual([...ranks.keys()]);
    expect(scoreFilm(FILMS[0], [], []).score).toBe(scoreFilm(FILMS[0], [], []).score);
  });
});

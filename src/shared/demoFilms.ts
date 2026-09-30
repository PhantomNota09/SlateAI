// Films used to ILLUSTRATE Slate on the marketing page and the sign-in screen. The scores and
// "matches" shown next to them are demo numbers, not real recommendations. Posters come from
// TMDB's image CDN (attribution is shown wherever they appear); the gradient hues are only a
// fallback while a poster loads or if it fails. Ratings are rounded TMDB averages.
export interface DemoFilm {
  id: string;
  title: string;
  year: number;
  runtime: number;
  genres: string[]; // drawn from the nine demo genres
  rating: number;
  poster: string; // TMDB poster_path
  hues: [number, number];
}

export const DEMO_FILMS: DemoFilm[] = [
  { id: 'inception', title: 'Inception', year: 2010, runtime: 148, genres: ['Sci-Fi', 'Action'], rating: 8.4, poster: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', hues: [212, 268] },
  { id: 'parasite', title: 'Parasite', year: 2019, runtime: 133, genres: ['Thriller', 'Comedy', 'Drama'], rating: 8.5, poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', hues: [150, 200] },
  { id: 'lalaland', title: 'La La Land', year: 2016, runtime: 128, genres: ['Romance', 'Comedy', 'Drama'], rating: 7.9, poster: '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', hues: [260, 330] },
  { id: 'getout', title: 'Get Out', year: 2017, runtime: 104, genres: ['Horror', 'Mystery', 'Thriller'], rating: 7.6, poster: '/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg', hues: [0, 20] },
  { id: 'spirited', title: 'Spirited Away', year: 2001, runtime: 125, genres: ['Animation'], rating: 8.5, poster: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', hues: [12, 350] },
  { id: 'darkknight', title: 'The Dark Knight', year: 2008, runtime: 152, genres: ['Action', 'Thriller', 'Drama'], rating: 8.5, poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', hues: [222, 250] },
  { id: 'knivesout', title: 'Knives Out', year: 2019, runtime: 131, genres: ['Mystery', 'Comedy', 'Thriller'], rating: 7.8, poster: '/pThyQovXQrw2m0s9x82twj48Jq4.jpg', hues: [38, 12] },
  { id: 'interstellar', title: 'Interstellar', year: 2014, runtime: 169, genres: ['Sci-Fi', 'Drama'], rating: 8.4, poster: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', hues: [200, 230] },
];

export const filmById = (id: string): DemoFilm => {
  const film = DEMO_FILMS.find((f) => f.id === id);
  if (!film) throw new Error(`Unknown demo film: ${id}`);
  return film;
};

export const TMDB_IMG = 'https://image.tmdb.org/t/p';

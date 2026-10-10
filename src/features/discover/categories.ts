// Discover home rows (iOS DiscoverCategory). `path` is the allowlisted TMDb list behind each row.
export type CategoryId = "trending" | "topRated" | "nowPlaying" | "upcoming";

export interface Category {
  id: CategoryId;
  title: string;
  subtitle: string;
  path: string;
}

// Display order matters: a film shown in an earlier row is skipped in later ones.
export const CATEGORIES: readonly Category[] = [
  { id: "trending", title: "Trending This Week", subtitle: "What everyone's watching", path: "/trending/movie/week" },
  { id: "topRated", title: "Top Rated Classics", subtitle: "Timeless masterpieces", path: "/movie/top_rated" },
  { id: "nowPlaying", title: "Now in Theaters", subtitle: "Currently showing", path: "/movie/now_playing" },
  { id: "upcoming", title: "Coming Soon", subtitle: "Mark your calendar", path: "/movie/upcoming" },
];

export const categoryById = (id: string | undefined): Category | undefined => CATEGORIES.find((c) => c.id === id);

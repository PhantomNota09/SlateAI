import type { Provider } from "./hooks/useStreamingOptions";

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Streaming services whose name contains every word typed, ignoring case and accents, so
// "prime vid" finds "Amazon Prime Video" and "canal" finds "Canal+". Order is kept (popularity).
export function filterProviders(providers: readonly Provider[], query: string): Provider[] {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...providers];
  return providers.filter((p) => {
    const name = plain(p.name);
    return words.every((w) => name.includes(w));
  });
}

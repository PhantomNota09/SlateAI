import { SelectTile } from "../../../core/components/SelectTile";
import { GENRES } from "../../../core/models/genres";
import { MAX_GENRES } from "../data";
import { toggleGenre } from "../onboardingLogic";
import { StepFrame } from "./StepFrame";

// Steps 2 and 3. Favorites and avoided genres exclude each other and are capped at 3 each.
export function GenresStep({
  mode,
  selected,
  excluded,
  onChange,
}: {
  mode: "favorite" | "avoid";
  selected: number[];
  excluded: number[];
  onChange: (ids: number[]) => void;
}) {
  const isFavorite = mode === "favorite";
  const atMax = selected.length >= MAX_GENRES;

  return (
    <StepFrame
      title={isFavorite ? "Pick your favorite genres" : "Any genres you want to avoid?"}
      subtitle={isFavorite ? undefined : "Optional — we'll keep these out of your recommendations."}
      status={
        <span className={selected.length >= 1 ? "is-good" : undefined}>
          {selected.length}/{MAX_GENRES} selected{!isFavorite && " (optional)"}
          {isFavorite && selected.length === 0 && <span className="is-warn"> · Select at least 1 genre</span>}
        </span>
      }
    >
      <div className="grid grid--genres" role="group" aria-label={isFavorite ? "Favorite genres" : "Genres to avoid"}>
        {GENRES.filter((g) => !excluded.includes(g.id)).map((g) => (
          <SelectTile
            key={g.id}
            label={g.name}
            checked={selected.includes(g.id)}
            disabled={!selected.includes(g.id) && atMax}
            onToggle={() => onChange(toggleGenre(selected, g.id))}
          />
        ))}
      </div>
    </StepFrame>
  );
}

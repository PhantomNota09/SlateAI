import { useState } from "react";
import { SelectTile } from "../../../core/components/SelectTile";
import { Spinner } from "../../../core/components/Spinner";
import { TextField } from "../../../core/components/TextField";
import { StepFrame } from "../../onboarding/components/StepFrame";
import { useStreamingOptions } from "../hooks/useStreamingOptions";
import { filterProviders } from "../providerSearch";

// Region + streaming services (iOS Preferences "Your Region" / "Streaming Services"). Leaving every
// service unselected means "All Streaming Services": recommendations aren't filtered.
export function StreamingSection({
  region,
  services,
  onRegion,
  onServices,
}: {
  region: string;
  services: number[];
  onRegion: (code: string) => void;
  onServices: (ids: number[]) => void;
}) {
  const { regions, providers, loading, failed } = useStreamingOptions(region);
  const [query, setQuery] = useState("");
  const shown = filterProviders(providers, query);
  const regionOptions = regions.some((r) => r.code === region) ? regions : [{ code: region, name: region }, ...regions];

  const toggle = (id: number) => onServices(services.includes(id) ? services.filter((s) => s !== id) : [...services, id]);

  return (
    <StepFrame
      title="Where do you watch?"
      subtitle="Pick the services you have and we'll prioritize movies you can stream. Select none to see everything."
      status={services.length > 0 ? `${services.length} selected` : "All streaming services"}
    >
      <label className="prefs-field">
        <span>Your region</span>
        <select value={region} onChange={(e) => {
            setQuery("");
            onRegion(e.target.value);
          }}>
          {regionOptions.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
      </label>

      {loading && (
        <div className="prefs-loading">
          <Spinner />
        </div>
      )}
      {failed && !loading && <p className="onb-step__hint">Couldn't load streaming services for this region. Try again in a moment.</p>}
      {!loading && !failed && providers.length === 0 && <p className="onb-step__hint">No streaming services are listed for this region.</p>}

      {providers.length > 8 && (
        <TextField
          label="Search services"
          type="search"
          placeholder="Netflix, Prime Video, Disney…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      )}
      {providers.length > 0 && shown.length === 0 && <p className="onb-step__hint">No services match “{query.trim()}”.</p>}

      {shown.length > 0 && (
        <div className="grid grid--genres prefs-providers" role="group" aria-label="Streaming services">
          {shown.map((p) => (
            <SelectTile
              key={p.id}
              label={p.name}
              checked={services.includes(p.id)}
              onToggle={() => toggle(p.id)}
            />
          ))}
        </div>
      )}
      <p className="onb-step__hint">Streaming availability data provided by JustWatch.</p>
    </StepFrame>
  );
}

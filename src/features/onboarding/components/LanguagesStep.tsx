import { useState } from "react";
import { Spinner } from "../../../core/components/Spinner";
import { FALLBACK_LANGUAGES, MAX_LANGUAGES } from "../data";
import { useLanguages } from "../hooks/useLanguages";
import { toggleLanguage } from "../onboardingLogic";
import { StepFrame } from "./StepFrame";

const MAX_RESULTS = 6;

// Search-to-add picker with numbered chips, like LanguageSearchPicker.swift. Order matters:
// the first language is the most preferred (spec §2 `preferredLanguages`).
export function LanguagesStep({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  const { languages, loading } = useLanguages();
  const [query, setQuery] = useState("");
  const atMax = selected.length >= MAX_LANGUAGES;

  const q = query.trim().toLowerCase();
  const results = q
    ? languages
        .filter(
          (l) =>
            !selected.includes(l.code) &&
            (l.name.toLowerCase().includes(q) || (l.nativeName ?? "").toLowerCase().includes(q)),
        )
        .slice(0, MAX_RESULTS)
    : [];
  const nameOf = (code: string) => languages.find((l) => l.code === code)?.name ?? code.toUpperCase();

  return (
    <StepFrame
      title="Which languages do you watch movies in?"
      subtitle="Your first choice is treated as your most preferred."
      status={
        <span className={selected.length >= 1 ? "is-good" : undefined}>
          {selected.length}/{MAX_LANGUAGES} selected
          {selected.length === 0 && <span className="is-warn"> · Select at least 1 language</span>}
        </span>
      }
    >
      <div className="lang-search">
        <div className="lang-search__input">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          {atMax ? (
            <span className="lang-search__max">Maximum {MAX_LANGUAGES} languages selected</span>
          ) : (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search to add a language…"
              aria-label="Search languages"
              autoComplete="off"
              autoFocus
            />
          )}
          {loading && <Spinner size="sm" />}
        </div>

        {results.length > 0 && (
          <ul className="lang-search__results" aria-label="Matching languages">
            {results.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(toggleLanguage(selected, l.code));
                    setQuery("");
                  }}
                >
                  <span>
                    <strong>{l.name}</strong>
                    {l.nativeName && l.nativeName !== l.name && <small>{l.nativeName}</small>}
                  </span>
                  <span aria-hidden="true">+</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {q && results.length === 0 && <p className="lang-search__empty">No languages found for “{query}”.</p>}
      </div>

      {selected.length > 0 ? (
        <div className="chips" aria-label="Selected languages">
          {selected.map((code, i) => (
            <span className="chip" key={code}>
              <span className="chip__rank">{i + 1}</span>
              {nameOf(code)}
              <button type="button" onClick={() => onChange(toggleLanguage(selected, code))} aria-label={`Remove ${nameOf(code)}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="onb-step__hint">Search above, or pick from the popular choices below.</p>
      )}

      {!atMax && (
        <div className="suggestions">
          <p className="suggestions__label">Popular</p>
          <div className="suggestions__list">
            {FALLBACK_LANGUAGES.filter((l) => !selected.includes(l.code)).map((l) => (
              <button type="button" key={l.code} onClick={() => onChange(toggleLanguage(selected, l.code))}>
                <span aria-hidden="true">+</span> {l.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </StepFrame>
  );
}

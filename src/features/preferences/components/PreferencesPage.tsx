import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "../../../core/components/AppShell";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { savePreferenceChanges } from "../../../core/services/firestore";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { GenresStep } from "../../onboarding/components/GenresStep";
import { LanguagesStep } from "../../onboarding/components/LanguagesStep";
import { ReleaseStep } from "../../onboarding/components/ReleaseStep";
import { RuntimeStep } from "../../onboarding/components/RuntimeStep";
import { StyleStep } from "../../onboarding/components/StyleStep";
import { ThemesStep } from "../../onboarding/components/ThemesStep";
import { applyRelease, applyRuntime } from "../../onboarding/onboardingLogic";
import { changedFields, draftProblem, preferencesDraftFrom, type PreferencesDraft } from "../preferencesLogic";
import { StreamingSection } from "./StreamingSection";
import "../../onboarding/components/Onboarding.css";
import "./Preferences.css";
import { track } from "../../../core/analytics/analytics";

export function PreferencesPage() {
  return (
    <ProtectedRoute>
      <Preferences />
    </ProtectedRoute>
  );
}

const SECTIONS = [
  { id: "languages", label: "Languages" },
  { id: "favorites", label: "Favorite genres" },
  { id: "avoid", label: "Genres to avoid" },
  { id: "release", label: "Release dates" },
  { id: "style", label: "Style & tone" },
  { id: "runtime", label: "Runtime" },
  { id: "themes", label: "Themes" },
  { id: "streaming", label: "Streaming" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function Preferences() {
  usePageTitle("Preferences");
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();

  // The baseline is what's saved; the draft is what's on screen.
  const [saved, setSaved] = useState<PreferencesDraft>(() => preferencesDraftFrom(profile.preferences));
  const [draft, setDraft] = useState<PreferencesDraft>(saved);
  const [section, setSection] = useState<SectionId>("languages");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changes = changedFields(saved, draft);
  const dirty = Object.keys(changes).length > 0;
  const problem = draftProblem(draft);

  const update = useCallback((fn: (d: PreferencesDraft) => PreferencesDraft) => {
    setError(null);
    setDraft(fn);
  }, []);

  // Closing the tab with unsaved edits asks first.
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  async function save() {
    if (!dirty || problem) return;
    setSaving(true);
    setError(null);
    try {
      await savePreferenceChanges(user!.uid, changes);
      track({ name: "preferences_saved", params: { fields_changed: Object.keys(changes).length } });
      setSaved(draft);
      toast("success", "Preferences saved. Your recommendations will use them.");
      void refreshProfile().catch(() => undefined);
    } catch (err) {
      console.error("Failed to save preferences", err);
      setError("We couldn't save your changes. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="prefs">
        <header className="prefs__head">
          <h1>Preferences</h1>
          <p>Tune what Slate recommends. Changes apply the next time your feed loads.</p>
        </header>

        <div className="prefs__layout">
          <nav className="prefs__nav" aria-label="Preference sections">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={section === s.id ? "is-active" : undefined}
                aria-current={section === s.id ? "true" : undefined}
                onClick={() => setSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="prefs__panel">
            {section === "languages" && (
              <LanguagesStep selected={draft.preferredLanguages} onChange={(preferredLanguages) => update((d) => ({ ...d, preferredLanguages }))} />
            )}
            {section === "favorites" && (
              <GenresStep mode="favorite" selected={draft.topGenres} excluded={draft.avoidGenres} onChange={(topGenres) => update((d) => ({ ...d, topGenres }))} />
            )}
            {section === "avoid" && (
              <GenresStep mode="avoid" selected={draft.avoidGenres} excluded={draft.topGenres} onChange={(avoidGenres) => update((d) => ({ ...d, avoidGenres }))} />
            )}
            {section === "release" && <ReleaseStep value={draft.releasePreference} onChange={(v) => update((d) => ({ ...d, ...applyRelease(d, v) }))} />}
            {section === "style" && (
              <StyleStep
                story={draft.storyPreference}
                tone={draft.tonePreference}
                pacing={draft.pacingPreference}
                onStory={(storyPreference) => update((d) => ({ ...d, storyPreference }))}
                onTone={(tonePreference) => update((d) => ({ ...d, tonePreference }))}
                onPacing={(pacingPreference) => update((d) => ({ ...d, pacingPreference }))}
              />
            )}
            {section === "runtime" && <RuntimeStep value={draft.runtimePreference} onChange={(v) => update((d) => ({ ...d, ...applyRuntime(d, v) }))} />}
            {section === "themes" && <ThemesStep selected={draft.favoriteThemes} onChange={(favoriteThemes) => update((d) => ({ ...d, favoriteThemes }))} />}
            {section === "streaming" && (
              <StreamingSection
                region={draft.region}
                services={draft.preferredStreamingServices}
                // Services differ by region, so changing region starts the selection over.
                onRegion={(region) => update((d) => (region === d.region ? d : { ...d, region, preferredStreamingServices: region === saved.region ? saved.preferredStreamingServices : [] }))}
                onServices={(preferredStreamingServices) => update((d) => ({ ...d, preferredStreamingServices }))}
              />
            )}
          </div>
        </div>
      </div>

      <div className="prefs__bar" data-visible={dirty || undefined}>
        <div className="prefs__bar-inner">
          <span className="prefs__bar-text">{error ? <Alert>{error}</Alert> : problem && dirty ? problem : "You have unsaved changes"}</span>
          <Button variant="ghost" onClick={() => { setDraft(saved); setError(null); }} disabled={saving}>
            Discard
          </Button>
          <Button onClick={() => void save()} loading={saving} disabled={!dirty || !!problem}>
            Save changes
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

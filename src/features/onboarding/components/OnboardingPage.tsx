import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { Alert } from "../../../core/components/Alert";
import { BrandMark } from "../../../core/components/BrandMark";
import { Button } from "../../../core/components/Button";
import { ArrowLeftIcon, ArrowRightIcon } from "../../../core/components/icons";
import { ProgressBar } from "../../../core/components/ProgressBar";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { auth } from "../../../core/services/firebase";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { TOTAL_STEPS } from "../data";
import { useOnboarding } from "../hooks/useOnboarding";
import { applyRelease, applyRuntime } from "../onboardingLogic";
import { GenresStep } from "./GenresStep";
import { LanguagesStep } from "./LanguagesStep";
import { ReleaseStep } from "./ReleaseStep";
import { RuntimeStep } from "./RuntimeStep";
import { StyleStep } from "./StyleStep";
import { ThemesStep } from "./ThemesStep";
import "./Onboarding.css";

export function OnboardingPage() {
  return (
    <ProtectedRoute allowIncompleteOnboarding onboardedRedirect="/app/welcome">
      <OnboardingFlow />
    </ProtectedRoute>
  );
}

function OnboardingFlow() {
  usePageTitle("Set up your taste");
  const { user, profile, refreshProfile } = useAuth();
  // ProtectedRoute guarantees a signed-in user; once onboarding completes, refreshing the
  // profile makes it redirect to /app.
  const { draft, step, saving, error, isLastStep, canContinue, update, next, back } = useOnboarding(
    user!.uid,
    profile.preferences,
    refreshProfile,
  );

  // Move focus to the new step's heading so keyboard and screen-reader users land at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.querySelector<HTMLElement>(".onb-step__title")?.focus({ preventScroll: true });
  }, [step]);

  return (
    <div className="onboarding">
      <header className="onboarding__bar">
        <div className="onboarding__bar-inner">
          <BrandMark />
          <div className="onboarding__bar-right">
            <span className="onboarding__count" aria-live="polite">
              Step {step} of {TOTAL_STEPS}
            </span>
            <button type="button" className="onboarding__signout" onClick={() => void signOut(auth)}>
              Sign out
            </button>
          </div>
        </div>
        <ProgressBar value={step} max={TOTAL_STEPS} label="Onboarding progress" />
      </header>

      <main className="onboarding__main">
        {step === 1 && (
          <LanguagesStep selected={draft.preferredLanguages} onChange={(preferredLanguages) => update({ preferredLanguages })} />
        )}
        {step === 2 && (
          <GenresStep
            mode="favorite"
            selected={draft.topGenres}
            excluded={draft.avoidGenres}
            onChange={(topGenres) => update({ topGenres })}
          />
        )}
        {step === 3 && (
          <GenresStep
            mode="avoid"
            selected={draft.avoidGenres}
            excluded={draft.topGenres}
            onChange={(avoidGenres) => update({ avoidGenres })}
          />
        )}
        {step === 4 && (
          <ReleaseStep value={draft.releasePreference} onChange={(v) => update((d) => applyRelease(d, v))} />
        )}
        {step === 5 && (
          <StyleStep
            story={draft.storyPreference}
            tone={draft.tonePreference}
            pacing={draft.pacingPreference}
            onStory={(storyPreference) => update({ storyPreference })}
            onTone={(tonePreference) => update({ tonePreference })}
            onPacing={(pacingPreference) => update({ pacingPreference })}
          />
        )}
        {step === 6 && (
          <RuntimeStep value={draft.runtimePreference} onChange={(v) => update((d) => applyRuntime(d, v))} />
        )}
        {step === 7 && (
          <ThemesStep selected={draft.favoriteThemes} onChange={(favoriteThemes) => update({ favoriteThemes })} />
        )}
      </main>

      <footer className="onboarding__footer">
        <div className="onboarding__footer-inner">
          {error && <Alert>{error}</Alert>}
          <div className="onboarding__actions">
            <Button
              variant="ghost"
              className="onboarding__back"
              onClick={() => void back()}
              disabled={step === 1 || saving}
              aria-label="Back"
              icon={<ArrowLeftIcon />}
            >
              Back
            </Button>
            <Button className="onboarding__next" onClick={() => void next()} loading={saving} disabled={!canContinue && !saving}>
              {isLastStep ? "Complete setup" : "Continue"} {!isLastStep && <ArrowRightIcon />}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

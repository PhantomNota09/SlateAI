import { useCallback, useState } from "react";
import { saveOnboardingProgress, type OnboardingFields } from "../../../core/services/firestore";
import { TOTAL_STEPS } from "../data";
import { canProceed, clampStep, draftFrom } from "../onboardingLogic";
import type { UserPreferences } from "../../../core/models/UserPreferences";
import { track } from "../../../core/analytics/analytics";

// State machine for /app/onboarding — parallel to OnboardingViewModel.swift. Progress is
// saved on every step change (resume works across devices) with a partial update of only
// the onboarding-owned fields.
export function useOnboarding(
  uid: string,
  preferences: Partial<UserPreferences> | null,
  onFinished: () => Promise<void> | void,
) {
  const [draft, setDraft] = useState<OnboardingFields>(() => draftFrom(preferences));
  const [step, setStep] = useState(() => clampStep(preferences?.onboardingStep));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((patch: Partial<OnboardingFields> | ((d: OnboardingFields) => OnboardingFields)) => {
    setError(null);
    setDraft((d) => (typeof patch === "function" ? patch(d) : { ...d, ...patch }));
  }, []);

  async function goTo(nextStep: number, options: { complete?: boolean } = {}) {
    setSaving(true);
    setError(null);
    try {
      await saveOnboardingProgress(uid, draft, nextStep, options);
      if (options.complete) {
        track({ name: "onboarding_complete", params: {} });
        await onFinished();
      } else {
        track({ name: "onboarding_step", params: { step: nextStep } });
        setStep(nextStep);
      }
    } catch {
      setError("We couldn't save your choices. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const isLastStep = step === TOTAL_STEPS;

  return {
    draft,
    step,
    saving,
    error,
    isLastStep,
    canContinue: canProceed(step, draft) && !saving,
    update,
    next: () => (isLastStep ? goTo(TOTAL_STEPS, { complete: true }) : goTo(step + 1)),
    back: () => (step > 1 ? goTo(step - 1) : Promise.resolve()),
  };
}

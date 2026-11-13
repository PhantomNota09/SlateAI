import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { useAuth } from "../context/AuthContext";

// Single place that decides where a signed-in user belongs (iOS root routing):
// signed out -> sign in; no username -> choose username; not onboarded -> onboarding.
export function ProtectedRoute({
  children,
  allowIncompleteOnboarding = false,
  onboardedRedirect = "/app",
}: {
  children: ReactNode;
  allowIncompleteOnboarding?: boolean;
  // Where a user who has finished onboarding is sent from an onboarding-only page.
  onboardedRedirect?: string;
}) {
  const { user, profile, profileError, loading, refreshProfile } = useAuth();

  if (loading) return <LoadingState />;
  if (!user) return <Navigate to="/app/sign-in" replace />;
  if (profileError) {
    return (
      <ErrorState
        title="Couldn't load your account"
        message="Check your connection and try again. Your account and data are safe."
        onRetry={() => void refreshProfile()}
      />
    );
  }
  if (profile.status !== "ready") return <Navigate to="/app/choose-username" replace />;
  if (!profile.isOnboarded && !allowIncompleteOnboarding) return <Navigate to="/app/onboarding" replace />;
  if (profile.isOnboarded && allowIncompleteOnboarding) return <Navigate to={onboardedRedirect} replace />;

  return <>{children}</>;
}

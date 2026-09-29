import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { ErrorState, LoadingState } from "../../../core/components/FullPageState";
import { ArrowRightIcon, AtIcon } from "../../../core/components/icons";
import { TextField } from "../../../core/components/TextField";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { auth } from "../../../core/services/firebase";
import { claimUsername } from "../../../core/services/firestore";
import { useAuth } from "../context/AuthContext";
import { USERNAME_ISSUE_MESSAGES, USERNAME_TAKEN_MESSAGE, usernameIssue } from "../validation";
import { AuthLayout } from "./AuthLayout";

// Same gate as iOS `needsUsernameSetup`: every account needs a username before it can
// use the app. Accounts that already have one never reach this page.
export function ChooseUsernamePage() {
  usePageTitle("Choose a username");
  const { user, profile, profileError, loading, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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
  if (profile.status === "ready") return <Navigate to="/app" replace />;

  const issue = usernameIssue(username);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || issue) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await claimUsername({
        uid: user.uid,
        name: user.displayName ?? username,
        username,
      });
      if (result === "username-taken") {
        setError(USERNAME_TAKEN_MESSAGE);
        return;
      }
      await refreshProfile();
      navigate("/app", { replace: true });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading">
        <h1>Choose a username</h1>
        <p>Pick a unique username to finish setting up your account.</p>
      </div>

      {error && <Alert>{error}</Alert>}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Username"
          icon={<AtIcon />}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
          onBlur={() => setTouched(true)}
          error={touched && username && issue ? USERNAME_ISSUE_MESSAGES[issue] : null}
          hint="3–20 characters: letters, numbers, underscores."
          autoFocus
        />
        <Button type="submit" loading={submitting} disabled={!!issue}>
          Continue <ArrowRightIcon />
        </Button>
      </form>

      <p className="auth-footer">
        Signed in as {user.email ?? "your account"}.{" "}
        <a href="/app/sign-in" onClick={(e) => { e.preventDefault(); void signOut(auth); }}>
          Use a different account
        </a>
      </p>
    </AuthLayout>
  );
}

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { Checkbox } from "../../../core/components/Checkbox";
import { Divider } from "../../../core/components/Divider";
import { GoogleIcon } from "../../../core/components/GoogleIcon";
import { ArrowRightIcon, LockIcon, MailIcon } from "../../../core/components/icons";
import { TextField } from "../../../core/components/TextField";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { useSignIn } from "../hooks/useSignIn";
import { isValidEmail } from "../validation";
import { AuthLayout } from "./AuthLayout";
import { track } from "../../../core/analytics/analytics";

export function SignInPage() {
  usePageTitle("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  const { signInWithEmail, signInWithGoogle, submitting, error } = useSignIn();
  const navigate = useNavigate();

  const emailValid = isValidEmail(email);
  const canSubmit = emailValid && password.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      await signInWithEmail(email, password, remember);
      track({ name: "login", params: { method: "email" } });
      navigate("/app");
    } catch {
      // error state already set by useSignIn
    }
  }

  async function handleGoogle() {
    try {
      if ((await signInWithGoogle(remember)) === "ok") {
        track({ name: "login", params: { method: "google" } });
        navigate("/app");
      }
    } catch {
      // error state already set by useSignIn
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading">
        <h1>Welcome back</h1>
        <p>Sign in to continue your movie journey.</p>
      </div>

      {error && <Alert>{error}</Alert>}

      <Button variant="ghost" icon={<GoogleIcon />} onClick={handleGoogle} disabled={submitting}>
        Continue with Google
      </Button>

      <Divider>or sign in with email</Divider>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          icon={<MailIcon />}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          error={emailTouched && email && !emailValid ? "Enter a valid email address." : null}
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          revealable
          icon={<LockIcon />}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="auth-row">
          <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
            Remember me
          </Checkbox>
          <Link to="/app/forgot-password" className="auth-link">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          Sign in <ArrowRightIcon />
        </Button>
      </form>

      <p className="auth-footer">
        Don't have an account? <Link to="/app/sign-up">Sign up</Link>
      </p>
    </AuthLayout>
  );
}

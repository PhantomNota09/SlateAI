import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { Checkbox } from "../../../core/components/Checkbox";
import { Divider } from "../../../core/components/Divider";
import { GoogleIcon } from "../../../core/components/GoogleIcon";
import { ArrowRightIcon, AtIcon, LockIcon, MailIcon, UserIcon } from "../../../core/components/icons";
import { PasswordStrength } from "../../../core/components/PasswordStrength";
import { TextField } from "../../../core/components/TextField";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { useSignUp, type SignUpOutcome } from "../hooks/useSignUp";
import { checkPassword, isValidEmail, USERNAME_ISSUE_MESSAGES, usernameIssue } from "../validation";
import { AuthLayout } from "./AuthLayout";

const TERMS_REQUIRED_MESSAGE = "Please agree to the Terms of Service and Privacy Policy to continue.";

export function SignUpPage() {
  usePageTitle("Create account");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [touched, setTouched] = useState({ username: false, email: false });
  const { signUpWithEmail, signUpWithGoogle, submitting, error } = useSignUp();
  const navigate = useNavigate();

  const issue = usernameIssue(username);
  const emailValid = isValidEmail(email);
  const passwordValid = checkPassword(password).isValid;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit =
    name.trim().length > 0 && !issue && emailValid && passwordValid && passwordsMatch && agreed;

  function finish(outcome: SignUpOutcome) {
    navigate(outcome === "ready" ? "/app" : "/app/choose-username");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      finish(await signUpWithEmail({ name, email, username, password }));
    } catch {
      // error state already set by useSignUp
    }
  }

  async function handleGoogle() {
    if (!agreed) {
      setTermsError(true);
      return;
    }
    try {
      finish(await signUpWithGoogle());
    } catch {
      // error state already set by useSignUp
    }
  }

  return (
    <AuthLayout>
      <div className="auth-heading">
        <h1>Create your account</h1>
        <p>Join thousands finding their perfect movie.</p>
      </div>

      {error && <Alert>{error}</Alert>}
      {termsError && !agreed && <Alert>{TERMS_REQUIRED_MESSAGE}</Alert>}

      <Button variant="ghost" icon={<GoogleIcon />} onClick={handleGoogle} disabled={submitting}>
        Sign up with Google
      </Button>

      <Divider>or sign up with email</Divider>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full name"
          icon={<UserIcon />}
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
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
          onBlur={() => setTouched((t) => ({ ...t, username: true }))}
          error={touched.username && username && issue ? USERNAME_ISSUE_MESSAGES[issue] : null}
          hint="3–20 characters. Availability is confirmed when you create your account."
        />
        <TextField
          label="Email"
          type="email"
          icon={<MailIcon />}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email && email && !emailValid ? "Enter a valid email address." : null}
        />
        <TextField
          label="Password"
          type="password"
          revealable
          icon={<LockIcon />}
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {password && <PasswordStrength password={password} />}
        <TextField
          label="Confirm password"
          type="password"
          revealable
          icon={<LockIcon />}
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          status={passwordsMatch ? "valid" : null}
          error={confirmPassword && !passwordsMatch ? "Passwords don't match." : null}
        />

        <Checkbox
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            if (e.target.checked) setTermsError(false);
          }}
        >
          I agree to the{" "}
          <a className="auth-terms" href="/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="auth-terms" href="/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
          .
        </Checkbox>

        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          Create account <ArrowRightIcon />
        </Button>
      </form>

      <p className="auth-footer">
        Already have an account? <Link to="/app/sign-in">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

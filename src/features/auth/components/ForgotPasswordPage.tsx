import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { ArrowLeftIcon, MailIcon } from "../../../core/components/icons";
import { TextField } from "../../../core/components/TextField";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { isValidEmail } from "../validation";
import { AuthLayout } from "./AuthLayout";

export function ForgotPasswordPage() {
  usePageTitle("Reset password");
  const [email, setEmail] = useState("");
  const { sendReset, sent, submitting, error } = useForgotPassword();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isValidEmail(email)) await sendReset(email);
  }

  return (
    <AuthLayout>
      <Link to="/app/sign-in" className="auth-back">
        <ArrowLeftIcon /> Back to sign in
      </Link>

      <div className="auth-heading">
        <h1>Reset your password</h1>
        <p>Enter your email and we'll send you a link to choose a new password.</p>
      </div>

      {error && <Alert>{error}</Alert>}
      {sent && (
        <Alert tone="success">
          If an account exists for {email.trim()}, a reset link is on its way. Check your inbox and spam folder.
        </Alert>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          icon={<MailIcon />}
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <Button type="submit" loading={submitting} disabled={!isValidEmail(email)}>
          {sent ? "Resend link" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}

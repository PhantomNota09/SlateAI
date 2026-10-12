import { useState } from "react";
import { AppShell } from "../../../core/components/AppShell";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { PasswordStrength } from "../../../core/components/PasswordStrength";
import { TextField } from "../../../core/components/TextField";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { hasPasswordSignIn } from "../../../core/services/account";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { nameProblem, useAccount } from "../hooks/useAccount";
import "./Account.css";

export function AccountPage() {
  return (
    <ProtectedRoute>
      <Account />
    </ProtectedRoute>
  );
}

function Account() {
  usePageTitle("Account");
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const { savingName, savingPassword, passwordError, saveName, savePassword } = useAccount(user!.uid, toast, refreshProfile);
  const prefs = profile.preferences;

  const [name, setName] = useState(prefs?.name ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const nameChanged = name.trim() !== (prefs?.name ?? "");
  const problem = name.length > 0 || nameChanged ? nameProblem(name) : null;

  return (
    <AppShell>
      <main className="acct">
        <header className="acct__head">
          <h1>Account</h1>
          <p>Manage how you appear to friends and how you sign in.</p>
        </header>

        <section className="acct__card" aria-labelledby="acct-profile">
          <h2 id="acct-profile">Profile</h2>
          <dl className="acct__facts">
            <div><dt>Email</dt><dd>{prefs?.email || user?.email || "—"}</dd></div>
            <div><dt>Username</dt><dd>@{prefs?.username ?? ""}</dd></div>
          </dl>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveName(name);
            }}
          >
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={problem} autoComplete="name" maxLength={80} />
            <Button type="submit" loading={savingName} disabled={!nameChanged || !!nameProblem(name)}>Save name</Button>
          </form>
        </section>

        <section className="acct__card" aria-labelledby="acct-password">
          <h2 id="acct-password">Password</h2>
          {hasPasswordSignIn(user) ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void savePassword(current, next).then((ok) => {
                  if (ok) {
                    setCurrent("");
                    setNext("");
                  }
                });
              }}
            >
              {passwordError && <Alert>{passwordError}</Alert>}
              <TextField label="Current password" type="password" revealable value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
              <TextField label="New password" type="password" revealable value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
              {next && <PasswordStrength password={next} />}
              <Button type="submit" loading={savingPassword} disabled={!current || !next}>Change password</Button>
            </form>
          ) : (
            <p className="acct__note">You sign in with Google or Apple, so there's no Slate password to change.</p>
          )}
        </section>
      </main>
    </AppShell>
  );
}

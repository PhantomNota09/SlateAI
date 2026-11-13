import { useState } from "react";
import { AppShell } from "../../../core/components/AppShell";
import { Alert } from "../../../core/components/Alert";
import { Button } from "../../../core/components/Button";
import { PasswordStrength } from "../../../core/components/PasswordStrength";
import { TextField } from "../../../core/components/TextField";
import { useToast } from "../../../core/components/Toast";
import { usePageTitle } from "../../../core/hooks/usePageTitle";
import { hasPasswordSignIn, providerOf } from "../../../core/services/account";
import { ProtectedRoute } from "../../auth/components/ProtectedRoute";
import { useAuth } from "../../auth/context/AuthContext";
import { nameProblem, useAccount } from "../hooks/useAccount";
import { useDeleteAccount } from "../hooks/useDeleteAccount";
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
  const del = useDeleteAccount(user!, toast);
  const [confirming, setConfirming] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
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

        <section className="acct__card acct__card--danger" aria-labelledby="acct-delete">
          <h2 id="acct-delete">Delete account</h2>
          <p className="acct__note">
            Permanently deletes your Slate account and everything in it: your ratings, Watch Later, history, friends and imported
            Letterboxd films. Your username is released. This can't be undone.
          </p>
          {!confirming ? (
            <Button variant="ghost" className="acct__danger-btn" onClick={() => setConfirming(true)}>Delete my account</Button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void del.remove(hasPasswordSignIn(user) ? deletePassword : undefined);
              }}
            >
              {del.error && <Alert>{del.error}</Alert>}
              {providerOf(user) === "other" ? (
                <p className="acct__note">Your account signs in with a method the web app can't confirm. Delete it from the Slate app instead.</p>
              ) : (
                <>
                  {hasPasswordSignIn(user) ? (
                    <TextField label="Confirm with your password" type="password" revealable value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} autoComplete="current-password" data-autofocus />
                  ) : (
                    <p className="acct__note">You'll be asked to confirm with Google first.</p>
                  )}
                  <div className="acct__row">
                    <Button type="submit" className="acct__danger-btn acct__danger-btn--solid" loading={del.deleting} disabled={hasPasswordSignIn(user) && !deletePassword}>
                      Permanently delete
                    </Button>
                    <Button type="button" variant="ghost" disabled={del.deleting} onClick={() => { setConfirming(false); setDeletePassword(""); }}>Cancel</Button>
                  </div>
                </>
              )}
            </form>
          )}
        </section>
      </main>
    </AppShell>
  );
}

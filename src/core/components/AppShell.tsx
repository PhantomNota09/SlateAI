import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../../features/auth/context/AuthContext";
import { useWatchLaterCount } from "../../features/watchLater/context/WatchLaterCountContext";
import { useImportProgress } from "../../features/letterboxd/context/LetterboxdImportContext";
import { useIncomingRequestCount } from "../../features/friends/hooks/useFriends";
import { AppFooter } from "./AppFooter";
import { NavSearch } from "./NavSearch";
import { BrandMark } from "./BrandMark";
import { ProfileAvatar } from "./ProfileAvatar";
import "./components.css";

// Signed-in chrome for every /app screen: brand, primary navigation, user menu.
export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = useAuth();
  const requestCount = useIncomingRequestCount(user?.uid);
  const importProgress = useImportProgress();
  const watchLaterCount = useWatchLaterCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = profile.preferences?.name ?? user?.displayName ?? "";
  const email = user?.email ?? user?.providerData.find((p) => p.email)?.email ?? "";

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const active = ({ isActive }: { isActive: boolean }) => (isActive ? "is-active" : undefined);
  const count = (n: number) => n > 0 && <span className="shell__count">{n > 99 ? "99+" : n}</span>;
  // The main tabs. Everything else lives in the account menu (avatar).
  const links = (onNavigate?: () => void) => (
    <>
      <NavLink to="/app/recommendations" className={active} onClick={onNavigate}>For You</NavLink>
      <NavLink to="/app/discover" className={active} onClick={onNavigate}>Discover</NavLink>
      <NavLink to="/app/collections" className={active} onClick={onNavigate}>Collections</NavLink>
      <NavLink to="/app/watch-later" className={active} onClick={onNavigate}>Watch Later{count(watchLaterCount ?? 0)}</NavLink>
      <NavLink to="/app/friends" className={active} onClick={onNavigate}>Friends{count(requestCount)}</NavLink>
    </>
  );

  return (
    <div className="shell">
      <header className="shell__bar">
        <div className="shell__bar-inner">
          <Link to="/app" className="shell__brand" aria-label="Slate home">
            <BrandMark />
          </Link>

          <nav className="shell__nav" aria-label="Primary">
            {links()}
          </nav>

          <button
            type="button"
            className="shell__burger"
            onClick={() => setSheetOpen((o) => !o)}
            aria-expanded={sheetOpen}
            aria-controls="shell-sheet"
            aria-label={sheetOpen ? "Close menu" : "Open menu"}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {sheetOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>

          <NavSearch />

          <div className="shell__user" ref={menuRef}>
            <button
              type="button"
              className="shell__avatar"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
            >
              <ProfileAvatar name={name} seed={user?.uid ?? email} photoUrl={profile.preferences?.avatarURL || user?.photoURL} />
              {importProgress && <span className="shell__avatar-dot" aria-hidden="true" />}
            </button>
            {menuOpen && (
              <div className="shell__menu" role="menu">
                <div className="shell__menu-who">
                  <strong>{name || "Your account"}</strong>
                  <span>{email}</span>
                </div>
                <div className="shell__menu-links" onClick={() => setMenuOpen(false)}>
                  <NavLink to="/app/profile" end role="menuitem" className={active}>Profile</NavLink>
                  <NavLink to="/app/profile/history" role="menuitem" className={active}>History</NavLink>
                  <NavLink to="/app/preferences" role="menuitem" className={active}>Preferences</NavLink>
                  <NavLink to="/app/account" role="menuitem" className={active}>Account</NavLink>
                  <NavLink to="/app/insights" role="menuitem" className={active}>Insights</NavLink>
                  <NavLink to="/app/letterboxd" role="menuitem" className={active}>
                    Letterboxd
                    {importProgress && (
                      <span className="shell__count" aria-label={`Import running: ${importProgress.current} of ${importProgress.total}`}>
                        {Math.floor((importProgress.current / Math.max(1, importProgress.total)) * 100)}%
                      </span>
                    )}
                  </NavLink>
                </div>
                <div className="shell__menu-sep" role="separator" />
                <button type="button" role="menuitem" onClick={() => void signOut(auth)}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {sheetOpen && (
        <nav id="shell-sheet" className="shell__sheet" aria-label="Menu">
          {links(() => setSheetOpen(false))}
        </nav>
      )}
      <div className="shell__page">{children}</div>
      <AppFooter />
    </div>
  );
}

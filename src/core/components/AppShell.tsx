import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../../features/auth/context/AuthContext";
import { BrandMark } from "./BrandMark";
import { ProfileAvatar } from "./ProfileAvatar";
import "./components.css";

// Signed-in chrome for every /app screen: brand, primary navigation, user menu.
export function AppShell({
  children,
  watchLaterCount,
}: {
  children: ReactNode;
  watchLaterCount?: number;
}) {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = profile.preferences?.name ?? user?.displayName ?? "";
  const email = user?.email ?? user?.providerData.find((p) => p.email)?.email ?? "";

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

  return (
    <div className="shell">
      <header className="shell__bar">
        <div className="shell__bar-inner">
          <Link to="/app" className="shell__brand" aria-label="Slate AI home">
            <BrandMark />
          </Link>

          <nav className="shell__nav" aria-label="Primary">
            <NavLink to="/app/recommendations" className={({ isActive }) => (isActive ? "is-active" : undefined)}>
              For You
            </NavLink>
            <NavLink to="/app/watch-later" className={({ isActive }) => (isActive ? "is-active" : undefined)}>
              Watch Later
              {!!watchLaterCount && <span className="shell__count">{watchLaterCount > 99 ? "99+" : watchLaterCount}</span>}
            </NavLink>
            <NavLink to="/app/profile" className={({ isActive }) => (isActive ? "is-active" : undefined)}>
              Profile
            </NavLink>
          </nav>

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
            </button>
            {menuOpen && (
              <div className="shell__menu" role="menu">
                <div className="shell__menu-who">
                  <strong>{name || "Your account"}</strong>
                  <span>{email}</span>
                </div>
                <button type="button" role="menuitem" onClick={() => void signOut(auth)}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

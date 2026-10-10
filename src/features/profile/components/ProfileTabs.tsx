import { NavLink } from "react-router-dom";

// Overview | History, shared by both profile screens.
export function ProfileTabs() {
  return (
    <nav className="profile-tabs" aria-label="Profile sections">
      <NavLink to="/app/profile" end className={({ isActive }) => (isActive ? "is-active" : undefined)}>
        Overview
      </NavLink>
      <NavLink to="/app/profile/history" className={({ isActive }) => (isActive ? "is-active" : undefined)}>
        History
      </NavLink>
    </nav>
  );
}

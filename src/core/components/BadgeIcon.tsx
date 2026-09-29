import type { BadgeIconKey } from "../models/badges";

// Stroke icons standing in for the SF Symbols the iOS badge catalog uses.
const PATHS: Record<BadgeIconKey, string> = {
  flame: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",
  ticket: "M4 6h16a1 1 0 0 1 1 1v3a2 2 0 0 0 0 4v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a2 2 0 0 0 0-4V7a1 1 0 0 1 1-1ZM14 6v12",
  film: "M4 4h16v16H4zM8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a2 2 0 0 0 2 4M16 6h3a2 2 0 0 1-2 4M12 13v4M8 20h8M10 17h4",
  star: "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8L12 2.5Z",
  clapper: "M4 10h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9ZM4 10l1.5-5 15 3-.8 2M9 6.5 7.5 9.8M14 7.5l-1.5 3.3",
  stack: "M7 7h13v11H7zM4 10v10h13M10 7v11M17 7v11",
  archive: "M3 5h18v4H3zM5 9v10h14V9M10 13h4",
  import: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8v8M8.5 12.5 12 16l3.5-3.5",
  friends: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19c0-3 2.5-5 6-5s6 2 6 5M17 10a2.5 2.5 0 1 0 0-5M17.5 14c2.5.3 4 2 4 5",
};

export function BadgeIcon({ icon, size = 28 }: { icon: BadgeIconKey; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[icon]} />
    </svg>
  );
}

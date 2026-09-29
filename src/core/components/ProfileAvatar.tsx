import "./components.css";

// Gradient circle keyed off the user's initials (iOS ProfileAvatar); shows the photo when
// avatarURL is set.
const HUES = [152, 172, 200, 226, 262, 320, 24, 46];

function hueFor(text: string): number {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[hash % HUES.length];
}

export function initialsOf(name: string, fallback: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const text = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? fallback).slice(0, 2);
  return text.toUpperCase() || "?";
}

export function ProfileAvatar({
  name,
  seed,
  photoUrl,
  size = 36,
}: {
  name: string;
  seed: string;
  photoUrl?: string | null;
  size?: number;
}) {
  const hue = hueFor(seed || name);
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${hue} 65% 45%), hsl(${(hue + 40) % 360} 70% 32%))`,
      }}
      aria-hidden="true"
    >
      {photoUrl ? <img src={photoUrl} alt="" referrerPolicy="no-referrer" /> : initialsOf(name, seed)}
    </span>
  );
}

import { useState } from "react";
import { shareLink } from "../share/share";
import type { ShareSurface } from "../analytics/analytics";
import { Button } from "./Button";

interface Props {
  path: string;
  surface: ShareSurface;
  contentType: "stats" | "movie" | "badge" | "profile";
  title: string;
  text: string;
  label?: string;
  variant?: "primary" | "ghost";
}

// Shares through the browser's share sheet, or copies the link where there isn't one.
export function ShareButton({ label = "Share", variant = "ghost", ...input }: Props) {
  const [note, setNote] = useState("");
  const onClick = async () => {
    const result = await shareLink(input);
    setNote(result === "copied" ? "Link copied" : result === "failed" ? "Couldn't copy the link" : "");
  };
  return (
    <>
      <Button variant={variant} onClick={() => void onClick()}>
        {label}
      </Button>
      <span role="status" className="sr-only">{note}</span>
      {note && <small aria-hidden="true">{note}</small>}
    </>
  );
}

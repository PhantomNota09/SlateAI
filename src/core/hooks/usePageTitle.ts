import { useEffect } from "react";

// The marketing pages own <title> for "/"; /app screens set their own and restore on leave.
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Slate`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

import { useEffect } from "react";
import { absoluteUrl } from "../config/site";

interface Meta {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

function setTag(selector: string, create: () => HTMLElement, attr: string, value: string): () => void {
  let el = document.head.querySelector<HTMLElement>(selector);
  const existed = !!el;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  const previous = el.getAttribute(attr);
  el.setAttribute(attr, value);
  return () => {
    if (!existed) el?.remove();
    else if (previous !== null) el?.setAttribute(attr, previous);
  };
}

const meta = (key: "name" | "property", name: string) => () => {
  const el = document.createElement("meta");
  el.setAttribute(key, name);
  return el;
};

// Unique title, description and canonical URL per route. The canonical is built from SITE_URL, so
// it follows the site to a custom domain. (Share-preview crawlers don't run JS; see index.html
// for the defaults they read.)
export function useDocumentMeta({ title, description, path, noindex = false }: Meta): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const url = absoluteUrl(path);
    const undo = [
      setTag('meta[name="description"]', meta("name", "description"), "content", description),
      setTag('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }), "href", url),
      setTag('meta[property="og:title"]', meta("property", "og:title"), "content", title),
      setTag('meta[property="og:description"]', meta("property", "og:description"), "content", description),
      setTag('meta[property="og:url"]', meta("property", "og:url"), "content", url),
      setTag('meta[name="twitter:title"]', meta("name", "twitter:title"), "content", title),
      setTag('meta[name="twitter:description"]', meta("name", "twitter:description"), "content", description),
      ...(noindex ? [setTag('meta[name="robots"]', meta("name", "robots"), "content", "noindex")] : []),
    ];
    return () => {
      document.title = previousTitle;
      undo.forEach((fn) => fn());
    };
  }, [title, description, path, noindex]);
}

// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SITE_URL } from "../config/site";
import { useDocumentMeta } from "./useDocumentMeta";

function Probe(props: { path: string }) {
  useDocumentMeta({ title: "Terms | Slate", description: "The terms.", path: props.path });
  return null;
}

describe("useDocumentMeta", () => {
  it("sets title, description and a canonical URL built from SITE_URL, and cleans up", () => {
    const { unmount } = render(<Probe path="/terms" />);
    expect(document.title).toBe("Terms | Slate");
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("The terms.");
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(`${SITE_URL}/terms`);
    unmount();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});

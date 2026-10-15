// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollRow } from "./ScrollRow";

const scrollBy = vi.fn();

// jsdom does no layout, so give the row a size: 1000px wide window onto 3000px of posters.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(3000);
  HTMLElement.prototype.scrollBy = scrollBy as unknown as typeof HTMLElement.prototype.scrollBy;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  scrollBy.mockClear();
});

const row = () => document.querySelector(".disc__scroller") as HTMLElement;

describe("ScrollRow", () => {
  it("starts at the left edge: only the right arrow shows, and it pages forward", () => {
    render(<ScrollRow><span>poster</span></ScrollRow>);
    expect(screen.queryByRole("button", { name: "Scroll left" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Scroll right" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 850, behavior: "smooth" });
  });

  it("shows both arrows mid-row, and only the left one at the far end", () => {
    render(<ScrollRow><span>poster</span></ScrollRow>);
    row().scrollLeft = 800;
    fireEvent.scroll(row());
    expect(screen.getByRole("button", { name: "Scroll left" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Scroll right" })).toBeTruthy();

    row().scrollLeft = 2000; // 2000 + 1000 = 3000: the end
    fireEvent.scroll(row());
    expect(screen.queryByRole("button", { name: "Scroll right" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Scroll left" }));
    expect(scrollBy).toHaveBeenCalledWith({ left: -850, behavior: "smooth" });
  });

  it("shows no arrows when everything already fits", () => {
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
    render(<ScrollRow><span>poster</span></ScrollRow>);
    expect(screen.queryByRole("button", { name: /Scroll/ })).toBeNull();
  });
});

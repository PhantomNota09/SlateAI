// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Movie } from "../../../core/models/Movie";
import type { MovieDetail } from "../../../core/models/MovieDetail";
import { MovieHero } from "./MovieHero";

const movie = { id: 1, title: "Heat", posterPath: "/p.jpg", backdropPath: "/b.jpg" } as Movie;
afterEach(cleanup);

describe("MovieHero", () => {
  it("shows a single play button (no text label) that opens the trailer", () => {
    const onPlay = vi.fn();
    render(<MovieHero movie={movie} detail={{ trailerKey: "abc", backdropPath: null } as MovieDetail} onPlayTrailer={onPlay} />);
    const button = screen.getByRole("button", { name: "Play trailer for Heat" });
    expect(button.textContent).toBe("");
    fireEvent.click(button);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it("shows no play button when there is no trailer", () => {
    render(<MovieHero movie={movie} detail={{ trailerKey: null, backdropPath: null } as MovieDetail} onPlayTrailer={() => undefined} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

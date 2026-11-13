// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const providers = ["Netflix", "Amazon Prime Video", "Disney Plus", "Hulu", "Apple TV", "Max", "Peacock", "Paramount Plus", "MUBI", "Crunchyroll"].map((name, i) => ({ id: i + 1, name, logoPath: null }));
vi.mock("../hooks/useStreamingOptions", () => ({
  useStreamingOptions: () => ({ regions: [{ code: "US", name: "United States" }], providers, loading: false, failed: false }),
}));

import { StreamingSection } from "./StreamingSection";

const setup = (services: number[] = [], onServices = vi.fn()) => {
  render(<StreamingSection region="US" services={services} onRegion={() => undefined} onServices={onServices} />);
  return onServices;
};
const tiles = () => screen.getAllByRole("checkbox").map((c) => c.closest("label")!.textContent);
afterEach(cleanup);

describe("StreamingSection search", () => {
  it("lists every service until you type", () => {
    setup();
    expect(tiles()).toHaveLength(10);
  });

  it("narrows the list as you type, and says so when nothing matches", () => {
    setup();
    fireEvent.change(screen.getByLabelText("Search services"), { target: { value: "plus" } });
    expect(tiles()).toEqual(["Disney Plus", "Paramount Plus"]);
    fireEvent.change(screen.getByLabelText("Search services"), { target: { value: "zzzz" } });
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByText(/No services match/)).toBeTruthy();
  });

  it("selects from the filtered list without losing earlier picks", () => {
    const onServices = setup([1]);
    fireEvent.change(screen.getByLabelText("Search services"), { target: { value: "mubi" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "MUBI" }));
    expect(onServices).toHaveBeenCalledWith([1, 9]);
  });

  it("keeps counting picks that the search is hiding", () => {
    setup([1, 2]);
    fireEvent.change(screen.getByLabelText("Search services"), { target: { value: "hulu" } });
    expect(screen.getByText("2 selected")).toBeTruthy();
  });
});

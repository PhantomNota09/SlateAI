import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

const EDGE = 4; // px of slack when deciding whether more is left to scroll to

const prefersReducedMotion = () => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A horizontally scrolling row with left / right arrows (hidden on touch devices, where swiping does
// the job). Each arrow only shows when there is more to see in that direction.
export function ScrollRow({ children }: { children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const measure = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > EDGE);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - EDGE);
  }, []);

  useEffect(() => {
    measure();
    const el = scroller.current;
    if (!el) return;
    window.addEventListener("resize", measure);
    // Posters load and rows get filtered after mount, so watch the row's size too.
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [measure, children]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <div className="disc__rowwrap">
      <div className="disc__scroller" ref={scroller} onScroll={measure}>
        {children}
      </div>
      {canLeft && (
        <button type="button" className="disc__arrow disc__arrow--left" onClick={() => page(-1)} aria-label="Scroll left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
        </button>
      )}
      {canRight && (
        <button type="button" className="disc__arrow disc__arrow--right" onClick={() => page(1)} aria-label="Scroll right">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      )}
    </div>
  );
}

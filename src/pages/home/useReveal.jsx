import { createElement, useEffect, useRef, useState } from 'react';

// Adds `is-in` once the element scrolls into view (and keeps it). With reduced motion, or no
// IntersectionObserver, content is simply visible from the start.
export function useReveal(threshold = 0.18) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

export function Reveal({ as = 'div', className = '', delay = 0, children, ...rest }) {
  const [ref, seen] = useReveal();
  return createElement(
    as,
    { ref, className: `lp-reveal ${seen ? 'is-in' : ''} ${className}`.trim(), style: { '--d': `${delay}ms` }, ...rest },
    children,
  );
}

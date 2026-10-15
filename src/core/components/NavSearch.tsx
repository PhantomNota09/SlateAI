import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./components.css";

const DISCOVER = "/app/discover";
const TYPING_PAUSE_MS = 250;

// Netflix-style search in the top bar: a magnifier beside the account avatar that opens an input.
// The query lives in the URL (/app/discover?q=…), so results are on Discover, Back works, and a
// results page can be shared. Navigation waits for a pause in typing because moving to Discover
// from another screen re-mounts the bar.
export function NavSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const onDiscover = location.pathname === DISCOVER;
  const urlQuery = onDiscover ? new URLSearchParams(location.search).get("q") ?? "" : "";

  const [open, setOpen] = useState(urlQuery !== "");
  const [value, setValue] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const sent = useRef(urlQuery); // the last query this component put in the URL

  // The URL changed some other way (a tab click, Back): follow it.
  useEffect(() => {
    if (urlQuery !== sent.current) {
      sent.current = urlQuery;
      setValue(urlQuery);
      if (urlQuery === "") setOpen(false);
    }
  }, [urlQuery]);

  useEffect(() => {
    if (!open) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [open]);

  const go = (raw: string) => {
    const q = raw.trim();
    if (q === sent.current) return;
    sent.current = q;
    navigate({ pathname: DISCOVER, search: q ? `?q=${encodeURIComponent(q)}` : "" }, { replace: onDiscover });
  };

  useEffect(() => {
    if (value.trim() === sent.current) return;
    const timer = setTimeout(() => go(value), TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const close = () => {
    setValue("");
    setOpen(false);
    if (sent.current !== "") go("");
  };

  return (
    <form
      className={`shell__search${open ? " is-open" : ""}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
    >
      {open ? (
        <>
          <svg className="shell__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            aria-label="Search movies"
            placeholder="Search movies"
            value={value}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && close()}
            onBlur={() => value.trim() === "" && close()}
          />
          {value !== "" && (
            <button type="button" className="shell__search-clear" aria-label="Clear search" onMouseDown={(e) => e.preventDefault()} onClick={() => { setValue(""); inputRef.current?.focus(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          )}
        </>
      ) : (
        <button type="button" className="shell__search-toggle" aria-label="Search" onClick={() => setOpen(true)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      )}
    </form>
  );
}

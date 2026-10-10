import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { commitLetterboxdMovies, loadLetterboxdIds, updateLetterboxdMetadata } from "../../../core/services/letterboxd";
import { useAuth } from "../../auth/context/AuthContext";
import { clearCheckpoint, readCheckpoint, signatureOf, writeCheckpoint } from "../checkpoint";
import { CSVParseError, parseLetterboxdCSV, type LetterboxdCSVEntry } from "../csvParser";
import { runImport, type ImportResult } from "../importRunner";
import { searchMovie } from "../tmdbSearch";

export interface Summary {
  added: number;
  skipped: number;
  failed: string[];
  processed: number;
  total: number;
  cancelled: boolean;
}

export type ImportState =
  | { step: "idle"; error?: string }
  | { step: "ready"; fileName: string; entries: LetterboxdCSVEntry[]; resumeFrom: number; signature: string }
  | { step: "importing"; current: number; total: number; cancelling: boolean }
  | { step: "done"; summary: Summary }
  | { step: "failed"; message: string };

interface ImportApi {
  state: ImportState;
  choose: (file: File) => Promise<void>;
  start: () => Promise<void>;
  restart: () => void; // from the first film, ignoring any saved progress
  cancel: () => void;
  reset: () => void;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const Ctx = createContext<ImportApi | null>(null);

// Owns the Letterboxd import for the whole signed-in app, so it keeps running while you move between
// pages. Matches are saved in batches as they come in, and progress is remembered per file, so even
// closing the tab loses nothing: choose the same file again and it carries on.
export function LetterboxdImportProvider({ children }: { children: ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const uid = user?.uid ?? "";
  const [state, setState] = useState<ImportState>({ step: "idle" });
  const stateRef = useRef(state);
  stateRef.current = state;
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const refreshRef = useRef(refreshProfile);
  refreshRef.current = refreshProfile;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort(); // signing out or leaving the app section: stop cleanly, progress is saved
    };
  }, []);

  // Signing out (or into another account) ends any run and clears the page.
  useEffect(() => {
    return () => {
      abort.current?.abort();
      setState({ step: "idle" });
    };
  }, [uid]);

  // Closing the tab mid-import asks first.
  const importing = state.step === "importing";
  useEffect(() => {
    if (!importing) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [importing]);

  const choose = useCallback(
    async (file: File) => {
      if (stateRef.current.step === "importing") return;
      if (file.size > MAX_FILE_BYTES) {
        setState({ step: "idle", error: "That file is too large to be a Letterboxd ratings export." });
        return;
      }
      try {
        const entries = parseLetterboxdCSV(await file.text());
        const signature = signatureOf(file.name, file.size, entries.length);
        const saved = readCheckpoint(uid, signature);
        setState({ step: "ready", fileName: file.name, entries, signature, resumeFrom: saved < entries.length ? saved : 0 });
      } catch (err) {
        setState({ step: "idle", error: err instanceof CSVParseError ? err.message : "We couldn't read that file. Make sure it's a CSV." });
      }
    },
    [uid],
  );

  const run = useCallback(
    async (from: number) => {
      const current = stateRef.current;
      if (current.step !== "ready") return;
      const { entries, signature } = current;
      const controller = new AbortController();
      abort.current = controller;
      setState({ step: "importing", current: from, total: entries.length, cancelling: false });

      let existing: Set<number>;
      let result: ImportResult;
      let savedCount = 0;
      let saveFailed = false;
      try {
        existing = await loadLetterboxdIds(uid);
        result = await runImport({
          entries,
          startAt: from,
          existingIds: existing,
          signal: controller.signal,
          search: (title, year) => searchMovie(title, year, controller.signal),
          onProgress: (done, total) => mounted.current && setState((s) => (s.step === "importing" ? { ...s, current: done, total } : s)),
          onMatches: async (batch, processed) => {
            try {
              await commitLetterboxdMovies(uid, batch);
            } catch (err) {
              saveFailed = true;
              throw err;
            }
            savedCount += batch.length;
            writeCheckpoint(uid, signature, processed);
          },
        });
      } catch (err) {
        console.error("Letterboxd import failed", err);
        if (mounted.current) {
          setState({
            step: "failed",
            message: saveFailed
              ? `We matched your movies but couldn't save them to your account${savedCount > 0 ? ` after saving ${savedCount.toLocaleString()}` : ""}. Choose the same file again to carry on.`
              : "The import couldn't run. Check your connection and try again. Nothing was changed.",
          });
        }
        return;
      }

      if (result.added.length > 0) {
        await updateLetterboxdMetadata(uid, existing.size + result.added.length).catch((err) => console.warn("Letterboxd metadata not updated", err));
        void refreshRef.current().catch(() => undefined);
      }
      // Finished files start fresh next time; an interrupted one remembers where it stopped.
      if (result.cancelled) writeCheckpoint(uid, signature, result.processed);
      else clearCheckpoint(uid);

      if (mounted.current) {
        setState({
          step: "done",
          summary: { added: result.added.length, skipped: result.skipped, failed: result.failed, processed: result.processed, total: entries.length, cancelled: result.cancelled },
        });
      }
    },
    [uid],
  );

  const start = useCallback(() => {
    const s = stateRef.current;
    return run(s.step === "ready" ? s.resumeFrom : 0);
  }, [run]);
  const restart = useCallback(() => void run(0), [run]);
  const cancel = useCallback(() => {
    abort.current?.abort();
    setState((s) => (s.step === "importing" ? { ...s, cancelling: true } : s));
  }, []);
  const reset = useCallback(() => {
    if (stateRef.current.step !== "importing") setState({ step: "idle" });
  }, []);

  const api = useMemo<ImportApi>(() => ({ state, choose, start, restart, cancel, reset }), [state, choose, start, restart, cancel, reset]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useLetterboxdImport(): ImportApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useLetterboxdImport must be used within LetterboxdImportProvider");
  return api;
}

// For the nav pill: null when nothing is running (or outside the provider, as in tests).
export function useImportProgress(): { current: number; total: number } | null {
  const api = useContext(Ctx);
  return api?.state.step === "importing" ? { current: api.state.current, total: api.state.total } : null;
}

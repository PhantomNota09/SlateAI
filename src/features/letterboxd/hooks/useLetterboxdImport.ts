import { useCallback, useEffect, useRef, useState } from "react";
import { commitLetterboxdMovies, loadLetterboxdIds, updateLetterboxdMetadata } from "../../../core/services/letterboxd";
import { CSVParseError, parseLetterboxdCSV, type LetterboxdCSVEntry } from "../csvParser";
import { runImport, type ImportResult } from "../importRunner";
import { searchMovie } from "../tmdbSearch";

export type ImportState =
  | { step: "idle"; error?: string }
  | { step: "ready"; fileName: string; entries: LetterboxdCSVEntry[] }
  | { step: "importing"; current: number; total: number; cancelling: boolean }
  | { step: "done"; summary: Summary }
  | { step: "failed"; message: string };

export interface Summary {
  added: number;
  skipped: number;
  failed: string[];
  processed: number;
  total: number;
  cancelled: boolean;
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Drives /app/letterboxd: choose ratings.csv → check it → import → summary. Leaving the page
// cancels the run but still saves everything matched so far (as iOS does when cancelled).
export function useLetterboxdImport(uid: string, onImported: () => void) {
  const [state, setState] = useState<ImportState>({ step: "idle" });
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const onImportedRef = useRef(onImported);
  onImportedRef.current = onImported;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);

  const choose = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setState({ step: "idle", error: "That file is too large to be a Letterboxd ratings export." });
      return;
    }
    try {
      const entries = parseLetterboxdCSV(await file.text());
      setState({ step: "ready", fileName: file.name, entries });
    } catch (err) {
      setState({ step: "idle", error: err instanceof CSVParseError ? err.message : "We couldn't read that file. Make sure it's a CSV." });
    }
  }, []);

  const reset = useCallback(() => setState({ step: "idle" }), []);

  const start = useCallback(async () => {
    if (state.step !== "ready") return;
    const { entries } = state;
    const controller = new AbortController();
    abort.current = controller;
    setState({ step: "importing", current: 0, total: entries.length, cancelling: false });

    let result: ImportResult;
    let existing: Set<number>;
    try {
      existing = await loadLetterboxdIds(uid);
      result = await runImport({
        entries,
        existingIds: existing,
        signal: controller.signal,
        search: (title, year) => searchMovie(title, year, controller.signal),
        onProgress: (current, total) => mounted.current && setState((s) => (s.step === "importing" ? { ...s, current, total } : s)),
      });
    } catch (err) {
      console.error("Letterboxd import failed", err);
      if (mounted.current) setState({ step: "failed", message: "The import couldn't run. Check your connection and try again — nothing was changed." });
      return;
    }

    try {
      if (result.added.length > 0) {
        await commitLetterboxdMovies(uid, result.added);
        await updateLetterboxdMetadata(uid, existing.size + result.added.length).catch((err) => console.warn("Letterboxd metadata not updated", err));
        onImportedRef.current();
      }
    } catch (err) {
      console.error("Saving Letterboxd movies failed", err);
      if (mounted.current) setState({ step: "failed", message: "We matched your movies but couldn't save them to your account. Please try again." });
      return;
    }
    if (mounted.current) {
      setState({
        step: "done",
        summary: { added: result.added.length, skipped: result.skipped, failed: result.failed, processed: result.processed, total: entries.length, cancelled: result.cancelled },
      });
    }
  }, [state, uid]);

  const cancel = useCallback(() => {
    abort.current?.abort();
    setState((s) => (s.step === "importing" ? { ...s, cancelling: true } : s));
  }, []);

  return { state, choose, start, cancel, reset };
}

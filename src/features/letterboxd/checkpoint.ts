// Remembers how far an import of a given file got, so reopening the same file after closing the tab
// carries on from there. Kept in this browser only; every failure is swallowed (private mode etc.).
const key = (uid: string) => `slate.letterboxd-import.${uid}`;

export function signatureOf(fileName: string, size: number, rows: number): string {
  return `${fileName}|${size}|${rows}`;
}

export function readCheckpoint(uid: string, signature: string): number {
  try {
    const v = JSON.parse(localStorage.getItem(key(uid)) ?? "null") as { sig?: unknown; processed?: unknown } | null;
    return v?.sig === signature && Number.isInteger(v.processed) && (v.processed as number) > 0 ? (v.processed as number) : 0;
  } catch {
    return 0;
  }
}

export function writeCheckpoint(uid: string, signature: string, processed: number): void {
  try {
    localStorage.setItem(key(uid), JSON.stringify({ sig: signature, processed }));
  } catch {
    /* not persisted */
  }
}

export function clearCheckpoint(uid: string): void {
  try {
    localStorage.removeItem(key(uid));
  } catch {
    /* ignore */
  }
}

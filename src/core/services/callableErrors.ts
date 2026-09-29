// Maps Firebase callable errors (spec §3 "Errors") to something the UI can show. Kept free of
// Firebase imports so it is trivial to test.
export type FailureKind = "unavailable" | "rate-limited" | "unauthenticated" | "other";

export interface CallableFailure {
  kind: FailureKind;
  message: string;
  retryAfterSeconds?: number;
}

export function describeCallableError(err: unknown): CallableFailure {
  const e = err as { code?: unknown; details?: { retryAfterSeconds?: unknown } } | null;
  const code = typeof e?.code === "string" ? e.code.replace(/^functions\//, "") : "";

  if (code === "unavailable") {
    return { kind: "unavailable", message: "Recommendations are temporarily unavailable. Please try again in a moment." };
  }
  if (code === "resource-exhausted") {
    const secs = e?.details?.retryAfterSeconds;
    const retryAfterSeconds = typeof secs === "number" && secs > 0 ? Math.ceil(secs) : undefined;
    return {
      kind: "rate-limited",
      retryAfterSeconds,
      message: retryAfterSeconds
        ? `You're moving fast. Please try again in ${retryAfterSeconds} second${retryAfterSeconds === 1 ? "" : "s"}.`
        : "You're moving fast. Please try again in a moment.",
    };
  }
  if (code === "unauthenticated") {
    return { kind: "unauthenticated", message: "Your session expired. Please sign in again." };
  }
  return { kind: "other", message: "We couldn't load your recommendations." };
}

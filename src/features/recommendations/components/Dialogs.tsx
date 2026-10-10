import { useState } from "react";
import { Button } from "../../../core/components/Button";
import { HalfStarPicker } from "../../../core/components/HalfStarPicker";
import { Modal } from "../../../core/components/Modal";
import { OptionCard } from "../../../core/components/OptionCard";
import type { MovieRef } from "../../../core/models/Movie";
import type { DismissalReason } from "../../../core/models/UserPreferences";

// "Already Watched?" dialog (RecommendationRatingSheet).
export function RatingDialog({
  movie,
  onClose,
  onRate,
}: {
  movie: MovieRef | null;
  onClose: () => void;
  onRate: (movie: MovieRef, rating: number) => void;
}) {
  return (
    <Modal open={!!movie} onClose={onClose} title="How would you rate it?">
      {movie && <RatingBody movie={movie} onRate={(r) => { onRate(movie, r); onClose(); }} />}
    </Modal>
  );
}

function RatingBody({ movie, onRate }: { movie: MovieRef; onRate: (rating: number) => void }) {
  const [rating, setRating] = useState(0);
  return (
    <>
      <p className="dialog__movie">{movie.title}</p>
      <HalfStarPicker value={rating} onChange={setRating} />
      <p className="dialog__hint" aria-live="polite">
        {rating > 0 ? `${rating.toFixed(1)} out of 5` : "Tap a star — half stars work too"}
      </p>
      <Button disabled={rating === 0} onClick={() => onRate(rating)}>
        {rating > 0 ? `Rate ${rating.toFixed(1)}/5.0` : "Select a rating"}
      </Button>
    </>
  );
}

// The 10 dismissal reasons iOS offers — every DismissalReason except "Already watched it",
// which has its own button (DismissalOptionsSheet).
export const DISMISS_REASONS: readonly DismissalReason[] = [
  "Not interested in this genre",
  "Not in the mood for this",
  "Too long",
  "Too short",
  "Too much violence",
  "Too mature/explicit",
  "Looks boring",
  "Reviews are bad",
  "Too old",
  "Other (specify)",
];

export function DismissDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: DismissalReason) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Why not interested?">
      <DismissBody onConfirm={(r) => { onConfirm(r); onClose(); }} />
    </Modal>
  );
}

function DismissBody({ onConfirm }: { onConfirm: (reason: DismissalReason) => void }) {
  const [reason, setReason] = useState<DismissalReason | null>(null);
  return (
    <>
      <p className="dialog__hint">Help us improve your recommendations.</p>
      <div className="stack stack--tight" role="radiogroup" aria-label="Reason">
        {DISMISS_REASONS.map((r) => (
          <OptionCard key={r} compact name="dismiss-reason" title={r} checked={reason === r} onSelect={() => setReason(r)} />
        ))}
      </div>
      <Button disabled={!reason} onClick={() => reason && onConfirm(reason)}>
        {reason ? "Confirm" : "Select a reason"}
      </Button>
    </>
  );
}

export function TrailerDialog({ open, onClose, title, videoKey }: { open: boolean; onClose: () => void; title: string; videoKey: string | null }) {
  return (
    <Modal open={open} onClose={onClose} title={`${title} — trailer`} size="lg" hideTitle>
      {videoKey && (
        <div className="trailer">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
    </Modal>
  );
}

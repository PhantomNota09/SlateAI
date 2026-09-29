import { useEffect, useId, useRef, type ReactNode } from "react";
import "./components.css";

// Native <dialog>: focus trap, Escape to close and inert background come from the browser.
// Children mount only while open, so each open starts from fresh state.
export function Modal({
  open,
  onClose,
  title,
  children,
  variant = "dialog",
  size = "md",
  hideTitle,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "dialog" | "drawer";
  size?: "md" | "lg";
  hideTitle?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Start keyboard focus on the dialog's main control when it declares one.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={["modal", `modal--${variant}`, `modal--${size}`].join(" ")}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // click on the backdrop
      }}
    >
      {open && (
        <div className="modal__panel">
          <header className="modal__header">
            <h2 id={titleId} className={hideTitle ? "sr-only" : "modal__title"}>
              {title}
            </h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          <div className="modal__body">{children}</div>
        </div>
      )}
    </dialog>
  );
}

import type { ReactNode } from "react";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import "./components.css";

export function LoadingState() {
  return (
    <div className="page-state">
      <Spinner />
    </div>
  );
}

// LoadingStateView / EmptyStateView equivalents from the iOS component inventory.
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  action,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="page-state">
      <div className="page-state__card" role="alert">
        <h1>{title}</h1>
        <p>{message}</p>
        {onRetry && <Button onClick={onRetry}>Try again</Button>}
        {action}
      </div>
    </div>
  );
}

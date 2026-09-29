import type { ReactNode } from "react";

export function StepFrame({
  title,
  subtitle,
  status,
  children,
}: {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="onb-step">
      <header className="onb-step__header">
        <h1 className="onb-step__title" tabIndex={-1}>
          {title}
        </h1>
        {subtitle && <p className="onb-step__subtitle">{subtitle}</p>}
        {status && <p className="onb-step__status">{status}</p>}
      </header>
      <div className="onb-step__body">{children}</div>
    </section>
  );
}

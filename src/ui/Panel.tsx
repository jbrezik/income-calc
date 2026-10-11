import type { ReactNode } from "react";

type Props = {
  title: string;
  icon?: string;
  /** Shown next to the title while collapsed. */
  summary?: ReactNode;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
};

/** Collapsible card. */
export function Panel({ title, icon, summary, open, onToggle, children }: Props) {
  return (
    <details className="card shadow-sm panel" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary className="card-header bg-transparent">
        <i className="bi bi-chevron-right chevron" aria-hidden />
        {icon && <i className={`bi ${icon} text-primary`} aria-hidden />}
        <h2 className="h5 mb-0">{title}</h2>
        {!open && summary && <span className="text-body-secondary panel-summary">{summary}</span>}
      </summary>
      <div className="card-body">{children}</div>
    </details>
  );
}

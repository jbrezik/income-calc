import type { ReactNode } from "react";

type Props = {
  title: string;
  /** Shown next to the title while collapsed. */
  summary?: ReactNode;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
};

/** Collapsible card. */
export function Panel({ title, summary, open, onToggle, children }: Props) {
  return (
    <details className="card panel" open={open} onToggle={(e) => onToggle(e.currentTarget.open)}>
      <summary>
        <h2>{title}</h2>
        {!open && summary && <span className="panel-summary">{summary}</span>}
      </summary>
      {children}
    </details>
  );
}

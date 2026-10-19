import type { ReactNode } from "react";

export interface BarRow {
  key: string;
  label: ReactNode;
  value: number;
  /** Text at the bar tip; defaults to the formatted value. */
  valueLabel: string;
  /** Secondary text under the label. */
  note?: ReactNode;
  /** CSS color for the bar; defaults to the single-series color. */
  color?: string;
}

/** Horizontal bars with the value at each tip — every bar is labeled, so no tooltip is needed. */
export function BarList({ rows, label }: { rows: BarRow[]; label: string }) {
  const max = Math.max(...rows.map((r) => r.value), 0) || 1;
  return (
    <ul className="barlist" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} className="barlist-row">
          <div className="barlist-label">
            {r.label}
            {r.note && <span className="barlist-note">{r.note}</span>}
          </div>
          <div className="barlist-track">
            <span
              className="barlist-bar"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? "var(--series-1)" }}
            />
            <span className="barlist-value num">{r.valueLabel}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

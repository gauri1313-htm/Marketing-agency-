import { useState, type ReactNode } from "react";
import { Icon } from "../Icon";

export interface TableView {
  columns: string[];
  rows: (string | number)[][];
  /** Indexes of columns that hold numbers (right-aligned). */
  numeric?: number[];
}

export function ChartCard({
  title,
  subtitle,
  table,
  children,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
  table?: TableView;
  children: ReactNode;
  className?: string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`chart-card${className ? ` ${className}` : ""}`} aria-label={title}>
      <header className="chart-head">
        <div>
          <h2 className="chart-title">{title}</h2>
          {subtitle && <p className="chart-sub">{subtitle}</p>}
        </div>
        {table && (
          <button
            type="button"
            className="btn btn-ghost btn-sm icon-btn"
            onClick={() => setAsTable((v) => !v)}
            aria-pressed={asTable}
            aria-label={asTable ? `Show ${title} as a chart` : `Show ${title} as a table`}
            title={asTable ? "Show chart" : "Show table"}
          >
            <Icon name={asTable ? "chart" : "table"} size={16} />
          </button>
        )}
      </header>
      {asTable && table ? (
        <div className="chart-table-wrap">
          <table className="chart-table">
            <thead>
              <tr>
                {table.columns.map((c, i) => (
                  <th key={c} scope="col" className={table.numeric?.includes(i) ? "is-num" : undefined}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((cell, ci) => (
                    <td key={ci} className={table.numeric?.includes(ci) ? "is-num num" : undefined}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

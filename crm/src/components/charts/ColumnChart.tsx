import { useState } from "react";
import { columnPath, niceTicks, useWidth } from "./chartUtils";

export interface Datum {
  label: string;
  value: number;
  /** Shown in the tooltip under the value. */
  detail?: string;
}

const HEIGHT = 200;
const PAD = { top: 22, right: 8, bottom: 26, left: 44 };

/** Single-series column chart. The latest column is direct-labeled; the rest read from the axis or tooltip. */
export function ColumnChart({
  data,
  format,
  axisFormat = format,
  label,
}: {
  data: Datum[];
  format: (n: number) => string;
  axisFormat?: (n: number) => string;
  label: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.value), 0);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const last = data.length - 1;

  return (
    <div className="chart" ref={ref}>
      {width > 0 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? "axis-line" : "grid-line"} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tick">
                {axisFormat(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const h = plotH - (y(d.value) - PAD.top);
            return (
              <g
                key={d.label}
                className={`col${active === i ? " is-active" : ""}`}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${d.label}: ${format(d.value)}${d.detail ? `, ${d.detail}` : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                {/* Hit target spans the whole band, larger than the mark. */}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} fill="transparent" />
                <path d={columnPath(cx - barW / 2, y(d.value), barW, h)} className="col-mark" />
                {i === last && active === null && (
                  <text x={cx} y={y(d.value) - 6} textAnchor="middle" className="direct-label">
                    {format(d.value)}
                  </text>
                )}
                <text x={cx} y={HEIGHT - 8} textAnchor="middle" className="tick">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {active !== null && width > 0 && (
        <div
          className="tooltip"
          style={{
            left: Math.min(Math.max(PAD.left + band * active + band / 2, 70), width - 70),
            top: y(data[active].value) - 8,
          }}
        >
          <span className="tooltip-label">{data[active].label}</span>
          <span className="tooltip-value num">{format(data[active].value)}</span>
          {data[active].detail && <span className="tooltip-detail">{data[active].detail}</span>}
        </div>
      )}
    </div>
  );
}

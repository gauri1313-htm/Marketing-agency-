import { useState, type PointerEvent } from "react";
import { niceTicks, useWidth } from "./chartUtils";
import type { Datum } from "./ColumnChart";

const HEIGHT = 220;
const PAD = { top: 24, right: 16, bottom: 26, left: 52 };

/** Single-series line with an area wash, crosshair tooltip and a labeled endpoint. */
export function LineChart({
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
  const step = data.length > 1 ? plotW / (data.length - 1) : 0;
  const x = (i: number) => PAD.left + step * i;
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join("");
  const area = `${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const last = data.length - 1;
  const shown = active ?? last;

  const onMove = (e: PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round((e.clientX - box.left) / (step || 1));
    setActive(Math.max(0, Math.min(last, i)));
  };

  // Show every other month label when space is tight.
  const labelEvery = plotW / data.length < 38 ? 2 : 1;

  return (
    <div
      className="chart"
      ref={ref}
      tabIndex={0}
      aria-label={`${label}. Use the left and right arrow keys to read each month.`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setActive((a) => Math.min(last, (a ?? last) + 1));
        else if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? last) - 1));
        else return;
        e.preventDefault();
      }}
      onBlur={() => setActive(null)}
    >
      {width > 0 && data.length > 1 && (
        <svg width={width} height={HEIGHT} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className={t === 0 ? "axis-line" : "grid-line"} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tick">
                {axisFormat(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % labelEvery === (last % labelEvery) ? (
              <text key={d.label + i} x={x(i)} y={HEIGHT - 8} textAnchor="middle" className="tick">
                {d.label}
              </text>
            ) : null,
          )}
          <path d={area} className="line-area" />
          <path d={line} className="line-mark" />
          {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} className="crosshair" />}
          <circle cx={x(shown)} cy={y(data[shown].value)} r={4.5} className="line-dot" />
          {active === null && (
            <text x={x(last)} y={y(data[last].value) - 12} textAnchor="end" className="direct-label">
              {format(data[last].value)}
            </text>
          )}
          <rect
            x={PAD.left - step / 2}
            y={PAD.top}
            width={plotW + step}
            height={plotH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setActive(null)}
          />
        </svg>
      )}
      {active !== null && width > 0 && (
        <div
          className="tooltip"
          style={{ left: Math.min(Math.max(x(active), 70), width - 70), top: y(data[active].value) - 12 }}
        >
          <span className="tooltip-label">{data[active].label}</span>
          <span className="tooltip-value num">{format(data[active].value)}</span>
          {data[active].detail && <span className="tooltip-detail">{data[active].detail}</span>}
        </div>
      )}
    </div>
  );
}

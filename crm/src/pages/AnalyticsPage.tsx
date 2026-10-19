import { useMemo, useState } from "react";
import { BarList } from "../components/charts/BarList";
import { ChartCard } from "../components/charts/ChartCard";
import { ColumnChart } from "../components/charts/ColumnChart";
import { LineChart } from "../components/charts/LineChart";
import { StageDot } from "../components/StagePill";
import { useLeads } from "../data/LeadsProvider";
import { OPEN_STAGES, OWNERS, STAGE_LABEL, type Lead } from "../data/types";
import { byOwner, byService, bySource, byStage, monthly, summarize } from "../lib/analytics";
import { formatMoney, formatMoneyCompact, formatNumber, formatPercent, parseDate } from "../lib/format";
import "../styles/analytics.css";

const PERIODS = [
  { id: "all", label: "All time", days: Infinity },
  { id: "365", label: "Last 12 months", days: 365 },
  { id: "90", label: "Last 90 days", days: 90 },
  { id: "30", label: "Last 30 days", days: 30 },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

export function AnalyticsPage() {
  const { leads } = useLeads();
  const [owner, setOwner] = useState<"all" | Lead["owner"]>("all");
  const [period, setPeriod] = useState<PeriodId>("all");

  const byOwnerScope = useMemo(() => (owner === "all" ? leads : leads.filter((l) => l.owner === owner)), [leads, owner]);
  const scoped = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)!.days;
    if (!Number.isFinite(days)) return byOwnerScope;
    const cutoff = Date.now() - days * 86_400_000;
    return byOwnerScope.filter((l) => parseDate(l.createdAt).getTime() >= cutoff);
  }, [byOwnerScope, period]);

  const s = useMemo(() => summarize(scoped), [scoped]);
  const stages = useMemo(() => byStage(scoped), [scoped]);
  const months = useMemo(() => monthly(byOwnerScope), [byOwnerScope]);
  const sources = useMemo(() => bySource(scoped).sort((a, b) => b.total - a.total), [scoped]);
  const services = useMemo(() => byService(scoped).sort((a, b) => b.wonValue + b.openValue - (a.wonValue + a.openValue)), [scoped]);
  const team = useMemo(() => byOwner(scoped).sort((a, b) => b.wonValue - a.wonValue), [scoped]);
  const newDelta = s.newThisMonth - s.newLastMonth;
  const periodLabel = PERIODS.find((p) => p.id === period)!.label.toLowerCase();

  const funnel = stages.filter((r) => (OPEN_STAGES as readonly string[]).includes(r.stage));
  const closed = stages.filter((r) => r.stage === "won" || r.stage === "lost");

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-lede">
            How the agency's pipeline is performing, {owner === "all" ? "across the whole team" : `for ${owner}`},{" "}
            {periodLabel === "all time" ? "for every lead on record" : `for leads added in the ${periodLabel}`}.
          </p>
        </div>
        <div className="page-actions">
          <label className="visually-hidden" htmlFor="an-period">
            Period
          </label>
          <select id="an-period" className="select" value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)}>
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <label className="visually-hidden" htmlFor="an-owner">
            Owner
          </label>
          <select id="an-owner" className="select" value={owner} onChange={(e) => setOwner(e.target.value as typeof owner)}>
            <option value="all">Whole team</option>
            {OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </header>

      <section className="kpis" aria-label="Key numbers">
        <div className="kpi kpi-hero">
          <p className="kpi-label">Monthly revenue signed</p>
          <p className="kpi-value">{formatMoney(s.wonValue)}</p>
          <p className="kpi-note">
            from {formatNumber(s.wonCount)} won {s.wonCount === 1 ? "client" : "clients"}
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Weighted forecast</p>
          <p className="kpi-value">{formatMoneyCompact(s.weightedForecast)}</p>
          <p className="kpi-note">of {formatMoneyCompact(s.openValue)} open a month</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Win rate</p>
          <p className="kpi-value">{formatPercent(s.winRate)}</p>
          <p className="kpi-note">
            {s.wonCount} won, {s.lostCount} lost
          </p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Average retainer</p>
          <p className="kpi-value">{formatMoneyCompact(s.avgDealSize)}</p>
          <p className="kpi-note">per won client, monthly</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">Days to close</p>
          <p className="kpi-value">{s.avgDaysToClose}</p>
          <p className="kpi-note">average, first touch to signed</p>
        </div>
        <div className="kpi">
          <p className="kpi-label">New leads this month</p>
          <p className="kpi-value">{s.newThisMonth}</p>
          <p className={`kpi-note${newDelta > 0 ? " is-up" : newDelta < 0 ? " is-down" : ""}`}>
            {newDelta === 0 ? "Same as" : `${newDelta > 0 ? "▲" : "▼"} ${Math.abs(newDelta)} vs`} last month
          </p>
        </div>
      </section>

      <div className="an-grid">
        <ChartCard
          title="Open pipeline by stage"
          subtitle={`${s.openCount} open deals worth ${formatMoney(s.openValue)} a month`}
          table={{
            columns: ["Stage", "Deals", "Monthly value"],
            rows: stages.map((r) => [STAGE_LABEL[r.stage], r.count, formatMoney(r.value)]),
            numeric: [1, 2],
          }}
        >
          <BarList
            label="Open deals by stage"
            rows={funnel.map((r) => ({
              key: r.stage,
              label: (
                <>
                  <StageDot stage={r.stage} /> {STAGE_LABEL[r.stage]}
                </>
              ),
              value: r.count,
              valueLabel: `${r.count}`,
              note: `${formatMoneyCompact(r.value)}/mo`,
              color: `var(--stage-${r.stage})`,
            }))}
          />
          <p className="chart-foot">
            Closed: <strong>{closed[0].count} won</strong> ({formatMoneyCompact(closed[0].value)}/mo),{" "}
            <strong>{closed[1].count} lost</strong> ({formatMoneyCompact(closed[1].value)}/mo).
          </p>
        </ChartCard>

        <ChartCard
          title="New leads per month"
          subtitle="Last 12 months"
          table={{
            columns: ["Month", "New leads"],
            rows: months.map((m) => [m.label, m.newLeads]),
            numeric: [1],
          }}
        >
          <ColumnChart
            label="New leads per month, last 12 months"
            data={months.map((m) => ({ label: m.label, value: m.newLeads }))}
            format={(n) => `${n} ${n === 1 ? "lead" : "leads"}`}
            axisFormat={(n) => formatNumber(n)}
          />
        </ChartCard>

        <ChartCard
          className="span-2"
          title="New monthly revenue signed"
          subtitle="Retainer value of deals won each month, last 12 months"
          table={{
            columns: ["Month", "Deals won", "New monthly revenue"],
            rows: months.map((m) => [m.label, m.wonCount, formatMoney(m.wonValue)]),
            numeric: [1, 2],
          }}
        >
          <LineChart
            label="New monthly revenue signed per month"
            data={months.map((m) => ({
              label: m.label,
              value: m.wonValue,
              detail: `${m.wonCount} ${m.wonCount === 1 ? "deal" : "deals"} won`,
            }))}
            format={formatMoney}
            axisFormat={formatMoneyCompact}
          />
        </ChartCard>

        <ChartCard
          title="Where leads come from"
          subtitle="Leads per source, with how often closed deals were won"
          table={{
            columns: ["Source", "Leads", "Won", "Lost", "Win rate", "Monthly revenue won"],
            rows: sources.map((r) => [r.key, r.total, r.won, r.lost, r.winRate === null ? "—" : formatPercent(r.winRate), formatMoney(r.wonValue)]),
            numeric: [1, 2, 3, 4, 5],
          }}
        >
          <BarList
            label="Leads per source"
            rows={sources.map((r) => ({
              key: r.key,
              label: r.key,
              value: r.total,
              valueLabel: `${r.total}`,
              note: r.winRate === null ? "No closed deals yet" : `${formatPercent(r.winRate)} win rate`,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Service mix"
          subtitle="Monthly value won plus open, by service"
          table={{
            columns: ["Service", "Won monthly", "Open monthly", "Leads"],
            rows: services.map((r) => [r.key, formatMoney(r.wonValue), formatMoney(r.openValue), r.total]),
            numeric: [1, 2, 3],
          }}
        >
          <BarList
            label="Monthly value by service"
            rows={services.map((r) => ({
              key: r.key,
              label: r.key,
              value: r.wonValue + r.openValue,
              valueLabel: formatMoneyCompact(r.wonValue + r.openValue),
              note: `${formatMoneyCompact(r.wonValue)} won, ${formatMoneyCompact(r.openValue)} open`,
            }))}
          />
        </ChartCard>

        <section className="chart-card span-2" aria-labelledby="team-title">
          <header className="chart-head">
            <div>
              <h2 id="team-title" className="chart-title">
                Team performance
              </h2>
              <p className="chart-sub">Ranked by monthly revenue signed</p>
            </div>
          </header>
          <div className="chart-table-wrap">
            <table className="chart-table team-table">
              <thead>
                <tr>
                  <th scope="col">Owner</th>
                  <th scope="col" className="is-num">Open deals</th>
                  <th scope="col" className="is-num">Open monthly</th>
                  <th scope="col" className="is-num">Won</th>
                  <th scope="col" className="is-num">Win rate</th>
                  <th scope="col" className="is-num">Monthly revenue signed</th>
                </tr>
              </thead>
              <tbody>
                {team.map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.key}</th>
                    <td className="is-num num">{r.open}</td>
                    <td className="is-num num">{formatMoney(r.openValue)}</td>
                    <td className="is-num num">{r.won}</td>
                    <td className="is-num num">{r.winRate === null ? "—" : formatPercent(r.winRate)}</td>
                    <td className="is-num num strong">{formatMoney(r.wonValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

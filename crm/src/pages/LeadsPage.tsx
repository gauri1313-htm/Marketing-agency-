import { useMemo, useState } from "react";
import { Icon } from "../components/Icon";
import { StagePill } from "../components/StagePill";
import { useLeads } from "../data/LeadsProvider";
import { OWNERS, SOURCES, STAGES, STAGE_LABEL, isOpen, type Lead } from "../data/types";
import { summarize } from "../lib/analytics";
import { downloadCsv, leadsToCsv } from "../lib/csv";
import { describeFollowUp, formatDate, formatMoney, todayISO } from "../lib/format";
import { useLeadDrawer } from "../lib/useLeadDrawer";
import "../styles/leads.css";

type SortKey = "company" | "stage" | "value" | "owner" | "nextFollowUp" | "createdAt";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const STAGE_ORDER = Object.fromEntries(STAGES.map((s, i) => [s, i])) as Record<Lead["stage"], number>;

function compare(a: Lead, b: Lead, key: SortKey): number {
  switch (key) {
    case "company":
      return a.company.localeCompare(b.company);
    case "owner":
      return a.owner.localeCompare(b.owner);
    case "stage":
      return STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
    case "value":
      return a.value - b.value;
    case "createdAt":
      return a.createdAt.localeCompare(b.createdAt);
    case "nextFollowUp":
      // Leads without a follow-up always sink to the bottom.
      if (!a.nextFollowUp) return b.nextFollowUp ? 1 : 0;
      if (!b.nextFollowUp) return -1;
      return a.nextFollowUp.localeCompare(b.nextFollowUp);
  }
}

export function LeadsPage() {
  const { leads } = useLeads();
  const { openLead, openNew } = useLeadDrawer();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"all" | "open" | Lead["stage"]>("all");
  const [owner, setOwner] = useState<"all" | Lead["owner"]>("all");
  const [source, setSource] = useState<"all" | Lead["source"]>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState<Sort>({ key: "createdAt", dir: "desc" });

  const summary = useMemo(() => summarize(leads), [leads]);
  const today = todayISO();

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = leads.filter((l) => {
      if (stage === "open" ? !isOpen(l.stage) : stage !== "all" && l.stage !== stage) return false;
      if (owner !== "all" && l.owner !== owner) return false;
      if (source !== "all" && l.source !== source) return false;
      if (overdueOnly && !(isOpen(l.stage) && l.nextFollowUp && l.nextFollowUp < today)) return false;
      if (q && !`${l.company} ${l.contactName} ${l.email} ${l.industry}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const c = compare(a, b, sort.key);
      // Keep blanks at the bottom regardless of direction.
      return sort.key === "nextFollowUp" && (!a.nextFollowUp || !b.nextFollowUp) ? c : c * dir;
    });
  }, [leads, query, stage, owner, source, overdueOnly, sort, today]);

  const filtersActive = query || stage !== "all" || owner !== "all" || source !== "all" || overdueOnly;
  const clearFilters = () => {
    setQuery("");
    setStage("all");
    setOwner("all");
    setSource("all");
    setOverdueOnly(false);
  };

  const header = (key: SortKey, label: string, className?: string) => {
    const active = sort.key === key;
    return (
      <th scope="col" className={className} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
        <button
          type="button"
          className={`th-sort${active ? " is-active" : ""}`}
          onClick={() =>
            setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : s.key === key ? "asc" : key === "value" || key === "createdAt" ? "desc" : "asc" }))
          }
        >
          {label}
          <span className="th-caret" aria-hidden="true">
            {active ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>
      </th>
    );
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-lede">
            <strong>{summary.openCount} open leads</strong> worth <strong>{formatMoney(summary.openValue)}</strong> a month.{" "}
            {summary.overdueCount > 0 ? (
              <button type="button" className="link-btn" onClick={() => setOverdueOnly(true)}>
                {summary.overdueCount} follow-ups are overdue.
              </button>
            ) : (
              "Every follow-up is on schedule."
            )}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn" onClick={() => downloadCsv(`growth-leads-${today}.csv`, leadsToCsv(rows))}>
            <Icon name="download" size={16} /> Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} /> Add lead
          </button>
        </div>
      </header>

      <div className="toolbar" role="search">
        <div className="search">
          <Icon name="search" size={16} />
          <label className="visually-hidden" htmlFor="lead-search">
            Search leads
          </label>
          <input
            id="lead-search"
            className="input"
            type="search"
            placeholder="Search company, contact or industry"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="visually-hidden" htmlFor="filter-stage">
          Stage
        </label>
        <select id="filter-stage" className="select" value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}>
          <option value="all">All stages</option>
          <option value="open">Open stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <label className="visually-hidden" htmlFor="filter-owner">
          Owner
        </label>
        <select id="filter-owner" className="select" value={owner} onChange={(e) => setOwner(e.target.value as typeof owner)}>
          <option value="all">All owners</option>
          {OWNERS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <label className="visually-hidden" htmlFor="filter-source">
          Source
        </label>
        <select id="filter-source" className="select" value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
          <option value="all">All sources</option>
          {SOURCES.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
          Overdue follow-ups
        </label>
        <p className="toolbar-count" aria-live="polite">
          {rows.length === leads.length ? `${leads.length} leads` : `${rows.length} of ${leads.length} leads`}
          {filtersActive && (
            <button type="button" className="link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </p>
      </div>

      <div className="table-wrap">
        <table className="leads-table">
          <thead>
            <tr>
              {header("company", "Company")}
              {header("stage", "Stage")}
              {header("value", "Monthly value", "is-num")}
              <th scope="col" className="col-service">
                Service
              </th>
              {header("owner", "Owner", "col-owner")}
              {header("nextFollowUp", "Follow-up")}
              {header("createdAt", "Added", "col-added")}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const follow = l.nextFollowUp && isOpen(l.stage) ? describeFollowUp(l.nextFollowUp) : null;
              return (
                <tr key={l.id} onClick={() => openLead(l.id)}>
                  <td>
                    <button
                      type="button"
                      className="row-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLead(l.id);
                      }}
                    >
                      {l.company}
                    </button>
                    <span className="cell-sub">
                      {l.contactName}
                      {l.industry && `, ${l.industry}`}
                    </span>
                  </td>
                  <td>
                    <StagePill stage={l.stage} />
                  </td>
                  <td className="is-num num">{formatMoney(l.value)}</td>
                  <td className="col-service">
                    {l.service}
                    <span className="cell-sub">via {l.source}</span>
                  </td>
                  <td className="col-owner">{l.owner}</td>
                  <td className={follow?.overdue ? "is-overdue" : undefined}>
                    {follow ? (
                      <>
                        {follow.overdue && <Icon name="alert" size={14} />} {follow.label}
                      </>
                    ) : (
                      <span className="cell-sub">—</span>
                    )}
                  </td>
                  <td className="col-added num">{formatDate(l.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty">
            {leads.length === 0 ? (
              <>
                <p className="empty-title">No leads yet</p>
                <p>Add your first lead to start tracking it through the pipeline.</p>
                <button type="button" className="btn btn-primary" onClick={openNew}>
                  <Icon name="plus" size={16} /> Add lead
                </button>
              </>
            ) : (
              <>
                <p className="empty-title">No leads match these filters</p>
                <p>Try a different search, or clear the filters to see everything.</p>
                <button type="button" className="btn" onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

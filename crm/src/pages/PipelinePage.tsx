import { useEffect, useMemo, useState, type DragEvent, type KeyboardEvent } from "react";
import { Icon } from "../components/Icon";
import { StageDot } from "../components/StagePill";
import { useLeads } from "../data/LeadsProvider";
import { OWNERS, STAGES, STAGE_LABEL, STAGE_PROBABILITY, isOpen, type Lead, type Stage } from "../data/types";
import { summarize } from "../lib/analytics";
import { describeFollowUp, formatMoney, formatMoneyCompact, initials, parseDate } from "../lib/format";
import { useLeadDrawer } from "../lib/useLeadDrawer";
import "../styles/pipeline.css";

/** Won and lost columns only show recent outcomes so the board stays about live work. */
const CLOSED_WINDOW_DAYS = 90;

export function PipelinePage() {
  const { leads, moveLead } = useLeads();
  const { openLead, openNew } = useLeadDrawer();
  const [owner, setOwner] = useState<"all" | Lead["owner"]>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);
  const [justMoved, setJustMoved] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const scoped = useMemo(() => (owner === "all" ? leads : leads.filter((l) => l.owner === owner)), [leads, owner]);
  const summary = useMemo(() => summarize(scoped), [scoped]);

  const columns = useMemo(() => {
    const cutoff = Date.now() - CLOSED_WINDOW_DAYS * 86_400_000;
    return STAGES.map((stage) => {
      const items = scoped
        .filter((l) => l.stage === stage)
        .filter((l) => isOpen(stage) || parseDate(l.closedAt ?? l.stageChangedAt).getTime() >= cutoff)
        .sort((a, b) => b.stageChangedAt.localeCompare(a.stageChangedAt));
      const value = items.reduce((s, l) => s + l.value, 0);
      return { stage, items, value };
    });
  }, [scoped]);

  useEffect(() => {
    if (!justMoved) return;
    const t = window.setTimeout(() => setJustMoved(null), 1200);
    return () => window.clearTimeout(t);
  }, [justMoved]);

  const move = (lead: Lead, stage: Stage) => {
    if (lead.stage === stage) return;
    moveLead(lead.id, stage);
    setJustMoved(lead.id);
    setAnnouncement(`${lead.company} moved to ${STAGE_LABEL[stage]}.`);
  };

  const onDrop = (e: DragEvent, stage: Stage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    const lead = leads.find((l) => l.id === id);
    if (lead) move(lead, stage);
    setDragId(null);
    setOverStage(null);
  };

  const onCardKey = (e: KeyboardEvent, lead: Lead) => {
    if (!e.altKey || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    e.preventDefault();
    const i = STAGES.indexOf(lead.stage) + (e.key === "ArrowRight" ? 1 : -1);
    if (i < 0 || i >= STAGES.length) return;
    move(lead, STAGES[i]);
    // Keep focus on the card after it re-renders in its new column.
    requestAnimationFrame(() => document.getElementById(`card-${lead.id}`)?.focus());
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <p className="page-lede">
            <strong>{formatMoney(summary.weightedForecast)}</strong> a month in weighted forecast across{" "}
            <strong>{summary.openCount} open deals</strong>. Drag a card to change its stage, or focus it and press Alt with
            the arrow keys.
          </p>
        </div>
        <div className="page-actions">
          <label className="visually-hidden" htmlFor="pipe-owner">
            Owner
          </label>
          <select id="pipe-owner" className="select" value={owner} onChange={(e) => setOwner(e.target.value as typeof owner)}>
            <option value="all">Everyone's deals</option>
            {OWNERS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Icon name="plus" size={16} /> Add lead
          </button>
        </div>
      </header>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <div className="board" role="list" aria-label="Pipeline stages">
        {columns.map(({ stage, items, value }) => (
          <section
            key={stage}
            role="listitem"
            aria-labelledby={`col-${stage}`}
            className={`column${overStage === stage ? " is-over" : ""}${isOpen(stage) ? "" : " is-closed"}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overStage !== stage) setOverStage(stage);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStage(null);
            }}
            onDrop={(e) => onDrop(e, stage)}
          >
            <header className="column-head">
              <h2 id={`col-${stage}`} className="column-title">
                <StageDot stage={stage} />
                {STAGE_LABEL[stage]}
                <span className="column-count num">{items.length}</span>
              </h2>
              <p className="column-value num">
                {formatMoneyCompact(value)}
                <span>/mo</span>
                {isOpen(stage) && <span className="column-prob"> at {Math.round(STAGE_PROBABILITY[stage] * 100)}%</span>}
                {!isOpen(stage) && <span className="column-prob"> last {CLOSED_WINDOW_DAYS} days</span>}
              </p>
            </header>
            <ul className="column-cards">
              {items.map((lead) => {
                const follow = lead.nextFollowUp && isOpen(lead.stage) ? describeFollowUp(lead.nextFollowUp) : null;
                return (
                  <li key={lead.id}>
                    <article
                      id={`card-${lead.id}`}
                      className={`card${dragId === lead.id ? " is-dragging" : ""}${justMoved === lead.id ? " just-moved" : ""}`}
                      draggable
                      tabIndex={0}
                      aria-label={`${lead.company}, ${formatMoney(lead.value)} a month, ${STAGE_LABEL[lead.stage]}`}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", lead.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(lead.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      onClick={() => openLead(lead.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") openLead(lead.id);
                        else onCardKey(e, lead);
                      }}
                    >
                      <div className="card-top">
                        <h3 className="card-company">{lead.company}</h3>
                        <span className="card-value num">{formatMoneyCompact(lead.value)}</span>
                      </div>
                      <p className="card-service">{lead.service}</p>
                      <div className="card-foot">
                        <span className="avatar" title={lead.owner} aria-label={`Owner ${lead.owner}`}>
                          {initials(lead.owner)}
                        </span>
                        {follow && (
                          <span className={`card-follow${follow.overdue ? " is-overdue" : ""}`}>
                            <Icon name={follow.overdue ? "alert" : "clock"} size={13} />
                            {follow.label}
                          </span>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
            {items.length === 0 && <p className="column-empty">Drop a lead here</p>}
          </section>
        ))}
      </div>
    </>
  );
}

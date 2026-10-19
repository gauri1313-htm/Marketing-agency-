import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLeads } from "../data/LeadsProvider";
import { STAGES, STAGE_LABEL, STAGE_PROBABILITY, isOpen, type ActivityType, type Lead } from "../data/types";
import { describeFollowUp, formatDate, formatDateTime, formatMoney } from "../lib/format";
import { useLeadDrawer } from "../lib/useLeadDrawer";
import { Icon } from "./Icon";
import { LeadForm } from "./LeadForm";
import "../styles/drawer.css";

export function LeadDrawer() {
  const { current, close, openLead } = useLeadDrawer();
  const { getLead, addLead, updateLead } = useLeads();
  const ref = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState(false);

  const isNew = current === "new";
  const lead = current && !isNew ? getLead(current) : undefined;
  const open = isNew || !!lead;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => setEditing(false), [current]);

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onClose={close}
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget) close();
      }}
    >
      {open && (
        <div className="drawer-panel">
          <header className="drawer-head">
            <div>
              <h2 id="drawer-title" className="drawer-title">
                {isNew ? "New lead" : editing ? `Edit ${lead!.company}` : lead!.company}
              </h2>
              {lead && !editing && (
                <p className="drawer-sub">
                  {lead.contactName}
                  {lead.industry ? `, ${lead.industry}` : ""}
                </p>
              )}
            </div>
            <button type="button" className="btn btn-ghost btn-sm icon-btn" onClick={close} aria-label="Close">
              <Icon name="close" />
            </button>
          </header>
          <div className="drawer-body">
            {isNew ? (
              <LeadForm
                onCancel={close}
                onSubmit={(input) => {
                  const id = addLead(input);
                  openLead(id);
                }}
              />
            ) : editing ? (
              <LeadForm
                lead={lead}
                onCancel={() => setEditing(false)}
                onSubmit={(input) => {
                  updateLead(lead!.id, input);
                  setEditing(false);
                }}
              />
            ) : (
              <LeadDetail lead={lead!} onEdit={() => setEditing(true)} onDeleted={close} />
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

const ACTIVITY_LABEL: Record<ActivityType, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  stage: "Stage change",
};

function LeadDetail({ lead, onEdit, onDeleted }: { lead: Lead; onEdit: () => void; onDeleted: () => void }) {
  const { moveLead, logActivity, deleteLead } = useLeads();
  const [type, setType] = useState<Exclude<ActivityType, "stage">>("note");
  const [text, setText] = useState("");
  const followUp = lead.nextFollowUp ? describeFollowUp(lead.nextFollowUp) : null;

  const submitActivity = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    logActivity(lead.id, type, text.trim());
    setText("");
  };

  const onDelete = () => {
    if (window.confirm(`Delete ${lead.company}? This can't be undone.`)) {
      deleteLead(lead.id);
      onDeleted();
    }
  };

  return (
    <div className="lead-detail">
      <section className="detail-deal" aria-label="Deal">
        <div>
          <p className="detail-value num">{formatMoney(lead.value)}</p>
          <p className="detail-value-note">
            per month
            {isOpen(lead.stage) && <>, {formatMoney(Math.round(lead.value * STAGE_PROBABILITY[lead.stage]))} weighted</>}
          </p>
        </div>
        <label className="detail-stage">
          <span>Stage</span>
          <select className="select" value={lead.stage} onChange={(e) => moveLead(lead.id, e.target.value as Lead["stage"])}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </section>

      <dl className="detail-facts">
        <div>
          <dt>In this stage since</dt>
          <dd>{formatDate(lead.stageChangedAt)}</dd>
        </div>
        <div>
          <dt>Next follow-up</dt>
          <dd className={followUp?.overdue ? "is-overdue" : undefined}>
            {lead.nextFollowUp ? (
              <>
                {formatDate(lead.nextFollowUp)}
                <span className="detail-aside">{followUp!.label}</span>
              </>
            ) : (
              <span className="detail-aside">None scheduled</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Service</dt>
          <dd>{lead.service}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{lead.source}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{lead.owner}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(lead.createdAt)}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{lead.email ? <a href={`mailto:${lead.email}`}>{lead.email}</a> : <span className="detail-aside">Not added</span>}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{lead.phone ? <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a> : <span className="detail-aside">Not added</span>}</dd>
        </div>
      </dl>

      <div className="detail-actions">
        <button type="button" className="btn btn-sm" onClick={onEdit}>
          <Icon name="edit" size={15} /> Edit details
        </button>
        <button type="button" className="btn btn-sm btn-danger" onClick={onDelete}>
          <Icon name="trash" size={15} /> Delete lead
        </button>
      </div>

      <section className="activity" aria-labelledby="activity-title">
        <h3 id="activity-title" className="section-title">
          Activity
        </h3>
        <form className="activity-form" onSubmit={submitActivity}>
          <label className="visually-hidden" htmlFor="activity-type">
            Activity type
          </label>
          <select id="activity-type" className="select" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
          <label className="visually-hidden" htmlFor="activity-text">
            What happened
          </label>
          <textarea
            id="activity-text"
            className="textarea"
            placeholder="What happened? e.g. Sent pricing for a three-month TikTok pilot."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitActivity(e);
            }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>
            Log activity
          </button>
        </form>
        <ol className="timeline">
          {lead.activities.map((a) => (
            <li key={a.id} className={`timeline-item timeline-item--${a.type}`}>
              <div className="timeline-meta">
                <span className="timeline-type">{ACTIVITY_LABEL[a.type]}</span>
                <time dateTime={a.at}>{formatDateTime(a.at)}</time>
              </div>
              <p>{a.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

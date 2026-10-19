import { parseDate, todayISO } from "./format";
import {
  OWNERS,
  SERVICES,
  SOURCES,
  STAGES,
  STAGE_PROBABILITY,
  isOpen,
  type Lead,
  type Owner,
  type Service,
  type Source,
  type Stage,
} from "../data/types";

const DAY = 86_400_000;

export interface Summary {
  openCount: number;
  /** Sum of monthly retainers across open deals. */
  openValue: number;
  /** Open value weighted by stage probability. */
  weightedForecast: number;
  wonCount: number;
  lostCount: number;
  /** Monthly recurring revenue from all won deals. */
  wonValue: number;
  winRate: number;
  avgDealSize: number;
  avgDaysToClose: number;
  overdueCount: number;
  newThisMonth: number;
  newLastMonth: number;
}

export function summarize(leads: Lead[], now = new Date()): Summary {
  const today = todayISO(now);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

  let openCount = 0, openValue = 0, weightedForecast = 0, wonCount = 0, lostCount = 0, wonValue = 0;
  let closeDays = 0, overdueCount = 0, newThisMonth = 0, newLastMonth = 0;

  for (const lead of leads) {
    const created = parseDate(lead.createdAt).getTime();
    if (created >= thisMonth) newThisMonth++;
    else if (created >= lastMonth) newLastMonth++;

    if (isOpen(lead.stage)) {
      openCount++;
      openValue += lead.value;
      weightedForecast += lead.value * STAGE_PROBABILITY[lead.stage];
      if (lead.nextFollowUp && lead.nextFollowUp < today) overdueCount++;
    } else if (lead.stage === "won") {
      wonCount++;
      wonValue += lead.value;
      const closed = parseDate(lead.closedAt ?? lead.stageChangedAt).getTime();
      closeDays += Math.max(0, (closed - created) / DAY);
    } else {
      lostCount++;
    }
  }

  return {
    openCount,
    openValue,
    weightedForecast: Math.round(weightedForecast),
    wonCount,
    lostCount,
    wonValue,
    winRate: wonCount + lostCount ? wonCount / (wonCount + lostCount) : 0,
    avgDealSize: wonCount ? Math.round(wonValue / wonCount) : 0,
    avgDaysToClose: wonCount ? Math.round(closeDays / wonCount) : 0,
    overdueCount,
    newThisMonth,
    newLastMonth,
  };
}

export interface StageRow {
  stage: Stage;
  count: number;
  value: number;
}

export function byStage(leads: Lead[]): StageRow[] {
  return STAGES.map((stage) => {
    const inStage = leads.filter((l) => l.stage === stage);
    return { stage, count: inStage.length, value: inStage.reduce((s, l) => s + l.value, 0) };
  });
}

export interface MonthRow {
  /** yyyy-mm */
  key: string;
  label: string;
  newLeads: number;
  wonCount: number;
  /** New MRR signed in the month. */
  wonValue: number;
}

export function monthly(leads: Lead[], now = new Date(), months = 12): MonthRow[] {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const rows: MonthRow[] = [];
  const index = new Map<string, MonthRow>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = { key, label: fmt.format(d), newLeads: 0, wonCount: 0, wonValue: 0 };
    rows.push(row);
    index.set(key, row);
  }
  const monthKey = (iso: string) => {
    const d = parseDate(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  for (const lead of leads) {
    const created = index.get(monthKey(lead.createdAt));
    if (created) created.newLeads++;
    if (lead.stage === "won") {
      const closed = index.get(monthKey(lead.closedAt ?? lead.stageChangedAt));
      if (closed) {
        closed.wonCount++;
        closed.wonValue += lead.value;
      }
    }
  }
  return rows;
}

export interface GroupRow<K extends string> {
  key: K;
  total: number;
  open: number;
  openValue: number;
  won: number;
  lost: number;
  wonValue: number;
  winRate: number | null;
}

function groupBy<K extends string>(leads: Lead[], keys: readonly K[], pick: (l: Lead) => K): GroupRow<K>[] {
  const rows = new Map<K, GroupRow<K>>(
    keys.map((key) => [key, { key, total: 0, open: 0, openValue: 0, won: 0, lost: 0, wonValue: 0, winRate: null }]),
  );
  for (const lead of leads) {
    const row = rows.get(pick(lead));
    if (!row) continue;
    row.total++;
    if (isOpen(lead.stage)) {
      row.open++;
      row.openValue += lead.value;
    } else if (lead.stage === "won") {
      row.won++;
      row.wonValue += lead.value;
    } else {
      row.lost++;
    }
  }
  for (const row of rows.values()) {
    row.winRate = row.won + row.lost ? row.won / (row.won + row.lost) : null;
  }
  return [...rows.values()];
}

export const bySource = (leads: Lead[]) => groupBy<Source>(leads, SOURCES, (l) => l.source);
export const byOwner = (leads: Lead[]) => groupBy<Owner>(leads, OWNERS, (l) => l.owner);
export const byService = (leads: Lead[]) => groupBy<Service>(leads, SERVICES, (l) => l.service);

import { STAGE_LABEL, type Lead } from "../data/types";

const COLUMNS: [string, (l: Lead) => string | number][] = [
  ["Company", (l) => l.company],
  ["Contact", (l) => l.contactName],
  ["Email", (l) => l.email],
  ["Phone", (l) => l.phone],
  ["Industry", (l) => l.industry],
  ["Stage", (l) => STAGE_LABEL[l.stage]],
  ["Monthly value (USD)", (l) => l.value],
  ["Service", (l) => l.service],
  ["Source", (l) => l.source],
  ["Owner", (l) => l.owner],
  ["Next follow-up", (l) => l.nextFollowUp ?? ""],
  ["Created", (l) => l.createdAt.slice(0, 10)],
];

const escape = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function leadsToCsv(leads: Lead[]) {
  const head = COLUMNS.map(([h]) => h).join(",");
  const rows = leads.map((l) => COLUMNS.map(([, get]) => escape(get(l))).join(","));
  return [head, ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

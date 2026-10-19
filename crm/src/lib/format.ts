const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const num = new Intl.NumberFormat("en-US");
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const longDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatMoney = (n: number) => usd.format(n);
export const formatMoneyCompact = (n: number) => (Math.abs(n) < 1000 ? usd.format(n) : usdCompact.format(n));
export const formatNumber = (n: number) => num.format(n);
export const formatPercent = (n: number) => `${Math.round(n * 100)}%`;

/** Parse an ISO string or yyyy-mm-dd (as a local date, not UTC midnight). */
export function parseDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

export function formatDate(value: string, now = new Date()) {
  const d = parseDate(value);
  return d.getFullYear() === now.getFullYear() ? shortDate.format(d) : longDate.format(d);
}

export const formatDateTime = (value: string) => dateTime.format(parseDate(value));

export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "in 3 days", "today", "2 days overdue" — for follow-up dates. */
export function describeFollowUp(date: string, now = new Date()) {
  const day = 86_400_000;
  const target = parseDate(date);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - start.getTime()) / day);
  if (diff === 0) return { label: "Today", overdue: false };
  if (diff === 1) return { label: "Tomorrow", overdue: false };
  if (diff > 1) return { label: `In ${diff} days`, overdue: false };
  return { label: diff === -1 ? "1 day overdue" : `${-diff} days overdue`, overdue: true };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

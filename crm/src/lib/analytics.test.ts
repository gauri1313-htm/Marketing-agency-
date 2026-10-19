import { describe, expect, it } from "vitest";
import { generateSeedLeads } from "../data/seed";
import type { Lead } from "../data/types";
import { bySource, byStage, monthly, summarize } from "./analytics";

const NOW = new Date(2026, 9, 19, 12);

function lead(overrides: Partial<Lead>): Lead {
  return {
    id: Math.random().toString(36),
    company: "Acme",
    contactName: "A B",
    email: "",
    phone: "",
    industry: "",
    source: "Website",
    service: "Paid social",
    owner: "Marcus Bell",
    stage: "new",
    value: 1000,
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
    stageChangedAt: "2026-10-01T10:00:00.000Z",
    activities: [],
    ...overrides,
  };
}

describe("summarize", () => {
  it("weights open value by stage probability and computes win rate", () => {
    const s = summarize(
      [
        lead({ stage: "qualified", value: 1000 }), // 40%
        lead({ stage: "negotiation", value: 2000 }), // 80%
        lead({ stage: "won", value: 3000, createdAt: "2026-09-01T00:00:00Z", closedAt: "2026-09-11T00:00:00Z" }),
        lead({ stage: "lost", value: 500 }),
      ],
      NOW,
    );
    expect(s.openCount).toBe(2);
    expect(s.openValue).toBe(3000);
    expect(s.weightedForecast).toBe(400 + 1600);
    expect(s.wonValue).toBe(3000);
    expect(s.winRate).toBe(0.5);
    expect(s.avgDaysToClose).toBe(10);
  });

  it("counts overdue follow-ups only on open leads", () => {
    const s = summarize(
      [
        lead({ stage: "contacted", nextFollowUp: "2026-10-10" }),
        lead({ stage: "contacted", nextFollowUp: "2026-10-25" }),
        lead({ stage: "won", nextFollowUp: "2026-10-01" }),
      ],
      NOW,
    );
    expect(s.overdueCount).toBe(1);
  });

  it("handles an empty list", () => {
    const s = summarize([], NOW);
    expect(s.winRate).toBe(0);
    expect(s.avgDealSize).toBe(0);
  });
});

describe("groupings", () => {
  it("byStage covers every stage", () => {
    const rows = byStage([lead({ stage: "proposal", value: 700 })]);
    expect(rows).toHaveLength(7);
    expect(rows.find((r) => r.stage === "proposal")).toEqual({ stage: "proposal", count: 1, value: 700 });
  });

  it("bySource reports null win rate when nothing has closed", () => {
    const rows = bySource([lead({ source: "Event" })]);
    expect(rows.find((r) => r.key === "Event")!.winRate).toBeNull();
  });

  it("monthly buckets the last 12 months and attributes wins to the close month", () => {
    const rows = monthly(
      [lead({ stage: "won", value: 2500, createdAt: "2026-08-03T12:00:00Z", closedAt: "2026-10-05T12:00:00Z" })],
      NOW,
    );
    expect(rows).toHaveLength(12);
    expect(rows.at(-1)!.key).toBe("2026-10");
    expect(rows.at(-1)!.wonValue).toBe(2500);
    expect(rows.find((r) => r.key === "2026-08")!.newLeads).toBe(1);
  });
});

describe("seed data", () => {
  it("is deterministic and covers every stage", () => {
    const a = generateSeedLeads(NOW);
    const b = generateSeedLeads(NOW);
    expect(a).toEqual(b);
    const stages = new Set(a.map((l) => l.stage));
    expect(stages.size).toBe(7);
  });
});

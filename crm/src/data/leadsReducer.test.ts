import { describe, expect, it } from "vitest";
import { leadsReducer } from "./leadsReducer";
import type { LeadInput } from "./types";

const input: LeadInput = {
  company: "Bramble Bakery",
  contactName: "Ruby Walsh",
  email: "ruby@bramble.com",
  phone: "",
  industry: "Food & beverage",
  source: "Referral",
  service: "Content production",
  owner: "Sofia Alvarez",
  stage: "new",
  value: 3000,
};

describe("leadsReducer", () => {
  const added = leadsReducer([], { type: "add", input, id: "l1", now: "2026-10-01T00:00:00.000Z" });

  it("adds a lead with a creation activity", () => {
    expect(added).toHaveLength(1);
    expect(added[0].activities[0].text).toBe("Lead created.");
  });

  it("moving a lead logs the stage change and stamps closedAt on won", () => {
    const moved = leadsReducer(added, { type: "move", id: "l1", stage: "won", now: "2026-10-05T00:00:00.000Z" });
    expect(moved[0].stage).toBe("won");
    expect(moved[0].closedAt).toBe("2026-10-05T00:00:00.000Z");
    expect(moved[0].activities[0].text).toBe("Moved from New to Won.");
  });

  it("moving to the same stage is a no-op", () => {
    const same = leadsReducer(added, { type: "move", id: "l1", stage: "new", now: "2026-10-05T00:00:00.000Z" });
    expect(same[0]).toBe(added[0]);
  });

  it("reopening a closed lead clears closedAt", () => {
    const won = leadsReducer(added, { type: "move", id: "l1", stage: "won", now: "2026-10-05T00:00:00.000Z" });
    const reopened = leadsReducer(won, { type: "move", id: "l1", stage: "negotiation", now: "2026-10-06T00:00:00.000Z" });
    expect(reopened[0].closedAt).toBeUndefined();
  });

  it("update applies field edits and a stage change together", () => {
    const updated = leadsReducer(added, {
      type: "update",
      id: "l1",
      input: { ...input, value: 4500, stage: "qualified" },
      now: "2026-10-02T00:00:00.000Z",
    });
    expect(updated[0].value).toBe(4500);
    expect(updated[0].stage).toBe("qualified");
    expect(updated[0].activities).toHaveLength(2);
  });

  it("logs activities newest first and deletes leads", () => {
    const logged = leadsReducer(added, { type: "log", id: "l1", activity: { type: "call", text: "Intro call" }, now: "2026-10-03T00:00:00.000Z" });
    expect(logged[0].activities[0].text).toBe("Intro call");
    expect(leadsReducer(logged, { type: "delete", id: "l1" })).toHaveLength(0);
  });
});

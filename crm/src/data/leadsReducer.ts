import { STAGE_LABEL, type ActivityType, type Lead, type LeadInput, type Stage } from "./types";

export type LeadAction =
  | { type: "add"; input: LeadInput; now: string; id: string }
  | { type: "update"; id: string; input: LeadInput; now: string }
  | { type: "delete"; id: string }
  | { type: "move"; id: string; stage: Stage; now: string }
  | { type: "log"; id: string; activity: { type: ActivityType; text: string }; now: string }
  | { type: "replace"; leads: Lead[] };

const activityId = (now: string) => `act-${now}-${Math.random().toString(36).slice(2, 8)}`;

function withStage(lead: Lead, stage: Stage, now: string): Lead {
  if (lead.stage === stage) return lead;
  const closed = stage === "won" || stage === "lost";
  return {
    ...lead,
    stage,
    stageChangedAt: now,
    updatedAt: now,
    closedAt: closed ? now : undefined,
    nextFollowUp: closed ? undefined : lead.nextFollowUp,
    activities: [
      {
        id: activityId(now),
        type: "stage",
        text: `Moved from ${STAGE_LABEL[lead.stage]} to ${STAGE_LABEL[stage]}.`,
        at: now,
      },
      ...lead.activities,
    ],
  };
}

export function leadsReducer(state: Lead[], action: LeadAction): Lead[] {
  switch (action.type) {
    case "add": {
      const lead: Lead = {
        ...action.input,
        id: action.id,
        createdAt: action.now,
        updatedAt: action.now,
        stageChangedAt: action.now,
        closedAt:
          action.input.stage === "won" || action.input.stage === "lost" ? action.now : undefined,
        activities: [{ id: activityId(action.now), type: "note", text: "Lead created.", at: action.now }],
      };
      return [lead, ...state];
    }
    case "update":
      return state.map((lead) => {
        if (lead.id !== action.id) return lead;
        const { stage, ...rest } = action.input;
        return withStage({ ...lead, ...rest, updatedAt: action.now }, stage, action.now);
      });
    case "delete":
      return state.filter((lead) => lead.id !== action.id);
    case "move":
      return state.map((lead) => (lead.id === action.id ? withStage(lead, action.stage, action.now) : lead));
    case "log":
      return state.map((lead) =>
        lead.id === action.id
          ? {
              ...lead,
              updatedAt: action.now,
              activities: [{ id: activityId(action.now), at: action.now, ...action.activity }, ...lead.activities],
            }
          : lead,
      );
    case "replace":
      return action.leads;
  }
}

export const STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;
export type Stage = (typeof STAGES)[number];

export const OPEN_STAGES = ["new", "contacted", "qualified", "proposal", "negotiation"] as const;
export type OpenStage = (typeof OPEN_STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal sent",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

/** Likelihood a deal in this stage signs, used for the weighted forecast. */
export const STAGE_PROBABILITY: Record<Stage, number> = {
  new: 0.1,
  contacted: 0.2,
  qualified: 0.4,
  proposal: 0.6,
  negotiation: 0.8,
  won: 1,
  lost: 0,
};

export const SOURCES = [
  "Referral",
  "Website",
  "Instagram",
  "LinkedIn",
  "Cold outreach",
  "Event",
] as const;
export type Source = (typeof SOURCES)[number];

export const SERVICES = [
  "Paid social",
  "Content production",
  "Influencer campaigns",
  "Community management",
  "Social strategy",
] as const;
export type Service = (typeof SERVICES)[number];

export const OWNERS = ["Priya Natarajan", "Marcus Bell", "Sofia Alvarez", "Daniel Okafor"] as const;
export type Owner = (typeof OWNERS)[number];

export type ActivityType = "note" | "call" | "email" | "meeting" | "stage";

export interface Activity {
  id: string;
  type: ActivityType;
  text: string;
  /** ISO timestamp */
  at: string;
}

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  source: Source;
  service: Service;
  owner: Owner;
  stage: Stage;
  /** Monthly retainer value in USD. */
  value: number;
  createdAt: string;
  updatedAt: string;
  stageChangedAt: string;
  /** Set when the lead reaches won or lost. */
  closedAt?: string;
  /** ISO date (yyyy-mm-dd) of the next planned touchpoint. */
  nextFollowUp?: string;
  activities: Activity[];
}

export type LeadInput = Omit<
  Lead,
  "id" | "createdAt" | "updatedAt" | "stageChangedAt" | "closedAt" | "activities"
>;

export const isOpen = (stage: Stage): stage is OpenStage =>
  (OPEN_STAGES as readonly string[]).includes(stage);

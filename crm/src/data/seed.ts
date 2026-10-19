import {
  OWNERS,
  SERVICES,
  STAGE_LABEL,
  type Activity,
  type Lead,
  type Source,
  type Stage,
} from "./types";

/** Small deterministic PRNG so demo data is identical across reloads and tests. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMPANIES: [string, string][] = [
  ["Northwind Coffee Roasters", "Food & beverage"],
  ["Lumen Skincare", "Beauty"],
  ["Basecamp Outfitters", "Retail"],
  ["Halcyon Fitness Studios", "Fitness"],
  ["Pebble & Pine Home", "Home goods"],
  ["Orbit Mobility", "Technology"],
  ["Saltwater Swimwear", "Fashion"],
  ["Greenleaf Grocers", "Food & beverage"],
  ["Copperline Brewing", "Food & beverage"],
  ["Atlas Dental Group", "Healthcare"],
  ["Meridian Hotels", "Hospitality"],
  ["Fable Bookshop", "Retail"],
  ["Kinfolk Pet Supply", "Retail"],
  ["Veritas Legal", "Professional services"],
  ["Bramble Bakery", "Food & beverage"],
  ["Nimbus Software", "Technology"],
  ["Tidewater Yoga", "Fitness"],
  ["Crescent Jewelry", "Fashion"],
  ["Summit Realty", "Real estate"],
  ["Juniper Wellness Clinic", "Healthcare"],
  ["Ironwood Furniture", "Home goods"],
  ["Lantern Candle Co.", "Home goods"],
  ["Riverstone Dental", "Healthcare"],
  ["Paloma Cantina", "Hospitality"],
  ["Quill Stationery", "Retail"],
  ["Helix Biotech", "Technology"],
  ["Wildflower Florals", "Retail"],
  ["Cobalt Cycles", "Retail"],
  ["Harbor Light Realty", "Real estate"],
  ["Aurora Hair Lounge", "Beauty"],
  ["Granite Peak Climbing", "Fitness"],
  ["Mosaic Tile Works", "Home goods"],
  ["Velvet Room Cocktails", "Hospitality"],
  ["Sparrow Kids Clothing", "Fashion"],
  ["Evergreen Financial", "Professional services"],
  ["Tandem Coworking", "Real estate"],
  ["Marigold Spa", "Beauty"],
  ["Driftwood Surf School", "Fitness"],
  ["Pinnacle Auto Detailing", "Automotive"],
  ["Foxglove Tea House", "Food & beverage"],
  ["Ember Pizza Co.", "Food & beverage"],
  ["Cascade Water Co.", "Food & beverage"],
  ["Sterling Watch Repair", "Retail"],
  ["Nova Dance Academy", "Education"],
  ["Brightpath Tutoring", "Education"],
  ["Redwood Architects", "Professional services"],
  ["Sage & Stone Interiors", "Home goods"],
  ["Lighthouse Vet Clinic", "Healthcare"],
  ["Polar Ice Cream Bar", "Food & beverage"],
  ["Kestrel Drones", "Technology"],
  ["Willow Bridal", "Fashion"],
  ["Thistle Organic Farm", "Food & beverage"],
  ["Prism Eyewear", "Fashion"],
  ["Vantage Physio", "Healthcare"],
  ["Cedar Lane Winery", "Food & beverage"],
  ["Hearth Mortgage", "Professional services"],
  ["Maple Street Market", "Retail"],
  ["Sola Solar Install", "Home goods"],
  ["Echo Audio Labs", "Technology"],
  ["Rosewood Boutique Hotel", "Hospitality"],
  ["Indigo Denim Co.", "Fashion"],
  ["Zephyr Kite Supply", "Retail"],
  ["Bluebird Daycare", "Education"],
  ["Gilded Fork Catering", "Hospitality"],
  ["Ridgeline Roofing", "Home goods"],
  ["Opal Nail Studio", "Beauty"],
  ["Monarch Pilates", "Fitness"],
  ["Anchor Insurance", "Professional services"],
];

const FIRST = ["Ava", "Liam", "Maya", "Noah", "Elena", "Jonah", "Chloe", "Ethan", "Zara", "Owen", "Isla", "Mateo", "Hana", "Leo", "Nadia", "Caleb", "Ruby", "Arjun", "Grace", "Felix"];
const LAST = ["Chen", "Martinez", "Patel", "Johnson", "Kim", "Nguyen", "Brooks", "Rossi", "Hughes", "Silva", "Kowalski", "Reyes", "Okoye", "Larsen", "Murphy", "Tanaka", "Dubois", "Ahmed", "Walsh", "Fischer"];

const DAY = 86_400_000;
const SOURCE_WEIGHTS: Record<Source, number> = {
  Referral: 4,
  Website: 5,
  Instagram: 4,
  LinkedIn: 3,
  "Cold outreach": 3,
  Event: 2,
};
/** Some sources close better than others, which gives the analytics something to say. */
const SOURCE_WIN_BIAS: Record<Source, number> = {
  Referral: 0.25,
  Website: 0.05,
  Instagram: 0,
  LinkedIn: 0.05,
  "Cold outreach": -0.15,
  Event: 0.1,
};

const NOTES = [
  "Wants to grow Instagram following ahead of a spring launch.",
  "Current agency isn't posting consistently; frustrated with reporting.",
  "Interested in a TikTok pilot before committing to a full retainer.",
  "Budget approval sits with the CFO — follow up after their quarterly review.",
  "Asked for case studies from similar brands in their industry.",
  "Prefers short weekly check-ins over monthly reports.",
  "Has an in-house designer; needs strategy and paid media only.",
  "Running a product launch in eight weeks; timing is tight.",
];

export function generateSeedLeads(now: Date = new Date(), count = 68): Lead[] {
  const rand = mulberry32(20261019);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const weighted = <K extends string>(weights: Record<K, number>): K => {
    const entries = Object.entries(weights) as [K, number][];
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [k, w] of entries) {
      r -= w;
      if (r <= 0) return k;
    }
    return entries[entries.length - 1][0];
  };
  const today = now.getTime();
  const leads: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const [company, industry] = COMPANIES[i % COMPANIES.length];
    const first = pick(FIRST);
    const last = pick(LAST);
    const source = weighted(SOURCE_WEIGHTS);
    const service = pick(SERVICES);
    const owner = pick(OWNERS);
    // Skew creation toward recent months so the trend line climbs.
    const ageDays = Math.floor(Math.pow(rand(), 1.4) * 360) + 1;
    const created = today - ageDays * DAY;
    const value = Math.round((1500 + rand() * 8500) / 250) * 250;

    // Older leads are more likely to have resolved.
    const maturity = Math.min(1, ageDays / 75);
    let stage: Stage;
    const r = rand();
    if (r < maturity * 0.75) {
      stage = rand() < 0.45 + SOURCE_WIN_BIAS[source] ? "won" : "lost";
    } else {
      stage = pick(["new", "contacted", "qualified", "proposal", "negotiation"] as const);
      if (ageDays < 7) stage = rand() < 0.7 ? "new" : "contacted";
    }

    // Deals typically take two to ten weeks to resolve.
    const daysInPipe = Math.max(1, Math.min(ageDays - 1, Math.floor(14 + rand() * 56)));
    const stageChanged = Math.min(today - DAY, created + daysInPipe * DAY);
    const closed = stage === "won" || stage === "lost" ? stageChanged : undefined;

    const activities: Activity[] = [
      { id: `a${i}-0`, type: "note", text: `Lead created from ${source.toLowerCase()}.`, at: new Date(created).toISOString() },
    ];
    const touches = 1 + Math.floor(rand() * 3);
    for (let t = 1; t <= touches; t++) {
      const at = created + ((stageChanged - created) * t) / (touches + 1);
      const type = pick(["call", "email", "meeting", "note"] as const);
      const text =
        type === "note" ? pick(NOTES)
        : type === "call" ? `Intro call with ${first}. ${pick(NOTES)}`
        : type === "email" ? `Sent ${pick(["capabilities deck", "pricing overview", "case studies", "proposal draft"])} to ${first}.`
        : `Strategy meeting with ${first} and team.`;
      activities.push({ id: `a${i}-${t}`, type, text, at: new Date(at).toISOString() });
    }
    if (stage !== "new") {
      activities.push({
        id: `a${i}-s`,
        type: "stage",
        text: `Moved to ${STAGE_LABEL[stage]}.`,
        at: new Date(stageChanged).toISOString(),
      });
    }

    let nextFollowUp: string | undefined;
    if (stage !== "won" && stage !== "lost") {
      // A few are deliberately overdue so the "needs attention" view has content.
      const offset = Math.floor(rand() * 18) - 4;
      nextFollowUp = new Date(today + offset * DAY).toISOString().slice(0, 10);
    }

    leads.push({
      id: `lead-${String(i + 1).padStart(3, "0")}`,
      company,
      contactName: `${first} ${last}`,
      email: `${first.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
      phone: `(${200 + Math.floor(rand() * 700)}) 555-${String(Math.floor(rand() * 10000)).padStart(4, "0")}`,
      industry,
      source,
      service,
      owner,
      stage,
      value,
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(stageChanged).toISOString(),
      stageChangedAt: new Date(stageChanged).toISOString(),
      closedAt: closed ? new Date(closed).toISOString() : undefined,
      nextFollowUp,
      activities: activities.sort((a, b) => b.at.localeCompare(a.at)),
    });
  }
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

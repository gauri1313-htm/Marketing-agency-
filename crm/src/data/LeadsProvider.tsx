import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { leadsReducer } from "./leadsReducer";
import { generateSeedLeads } from "./seed";
import type { ActivityType, Lead, LeadInput, Stage } from "./types";

/**
 * Persistence lives behind this one module. Leads are kept in localStorage for now;
 * when the app gets a backend, swap `load`/`save` for API calls and the pages stay the same.
 */
const STORAGE_KEY = "growth-crm:leads:v1";

function load(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Lead[];
    }
  } catch {
    // Storage blocked or corrupted: fall through to demo data.
  }
  return generateSeedLeads();
}

function save(leads: Lead[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch {
    // Non-fatal: the session still works in memory.
  }
}

interface LeadsApi {
  leads: Lead[];
  getLead: (id: string) => Lead | undefined;
  addLead: (input: LeadInput) => string;
  updateLead: (id: string, input: LeadInput) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, stage: Stage) => void;
  logActivity: (id: string, type: ActivityType, text: string) => void;
  resetDemoData: () => void;
}

const LeadsContext = createContext<LeadsApi | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, dispatch] = useReducer(leadsReducer, undefined, load);

  useEffect(() => save(leads), [leads]);

  const now = () => new Date().toISOString();

  const addLead = useCallback((input: LeadInput) => {
    const id = `lead-${Date.now().toString(36)}`;
    dispatch({ type: "add", input, id, now: now() });
    return id;
  }, []);

  const api = useMemo<LeadsApi>(
    () => ({
      leads,
      getLead: (id) => leads.find((l) => l.id === id),
      addLead,
      updateLead: (id, input) => dispatch({ type: "update", id, input, now: now() }),
      deleteLead: (id) => dispatch({ type: "delete", id }),
      moveLead: (id, stage) => dispatch({ type: "move", id, stage, now: now() }),
      logActivity: (id, type, text) => dispatch({ type: "log", id, activity: { type, text }, now: now() }),
      resetDemoData: () => dispatch({ type: "replace", leads: generateSeedLeads() }),
    }),
    [leads, addLead],
  );

  return <LeadsContext.Provider value={api}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used inside <LeadsProvider>");
  return ctx;
}

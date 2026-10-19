import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/** The lead drawer is driven by `?lead=<id>` (or `?lead=new`) so any view can deep-link to a lead. */
export function useLeadDrawer() {
  const [params, setParams] = useSearchParams();
  const current = params.get("lead");

  const set = useCallback(
    (value: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set("lead", value);
          else next.delete("lead");
          return next;
        },
        { replace: value === null },
      ),
    [setParams],
  );

  return {
    current,
    openLead: useCallback((id: string) => set(id), [set]),
    openNew: useCallback(() => set("new"), [set]),
    close: useCallback(() => set(null), [set]),
  };
}

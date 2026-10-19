import { NavLink, Outlet } from "react-router-dom";
import { useLeads } from "../data/LeadsProvider";
import { useTheme } from "../lib/useTheme";
import { Icon, type IconName } from "./Icon";
import { LeadDrawer } from "./LeadDrawer";
import "../styles/layout.css";

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: "/leads", label: "Leads", icon: "leads" },
  { to: "/pipeline", label: "Pipeline", icon: "pipeline" },
  { to: "/analytics", label: "Analytics", icon: "analytics" },
];

export function Layout() {
  const { theme, toggle } = useTheme();
  const { resetDemoData } = useLeads();

  const onReset = () => {
    if (window.confirm("Replace all leads with the demo data set? Your changes will be lost.")) resetDemoData();
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <rect width="32" height="32" rx="7" fill="var(--signal)" />
              <path d="M8 22 L14 15 L18 18 L24 10" stroke="var(--on-signal)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="brand-name">
            Growth <span className="brand-sub">CRM</span>
          </span>
        </div>
        <nav aria-label="Main">
          <ul className="nav">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}>
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={toggle}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReset}>
            <Icon name="reset" size={16} />
            Reset demo data
          </button>
        </div>
      </aside>
      <main className="main" id="main">
        <Outlet />
      </main>
      <LeadDrawer />
    </div>
  );
}

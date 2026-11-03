import { memo, useMemo, type KeyboardEvent, type ReactNode } from "react";
import { PAGE_PERMISSIONS, useAppActions, useAppState, useSessionTimer } from "../context/AppContext";
import { stats } from "../data/mockData";

interface Props {
  active: string;
  onNav: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

/* ───────────── Nav config: labels and icons as data, one <svg> wrapper ───────────── */

const NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "incidents", label: "Incidents" },
  { id: "riskmap", label: "Risk Map" },
  { id: "analytics", label: "Analytics" },
  { id: "alerts", label: "Alerts" },
  { id: "ml", label: "ML Insights" },
  { id: "audit", label: "Audit Trail" },
  { id: "users", label: "User Management" },
  { id: "settings", label: "Settings" },
] as const;

type NavId = (typeof NAV)[number]["id"];

const ICON_PATHS: Record<NavId, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  incidents: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  riskmap: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  analytics: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  alerts: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
  ml: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  audit: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
};

function Icon({ children, size = 16, sw = 1.8 }: { children: ReactNode; size?: number; sw?: number }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw}>
      {children}
    </svg>
  );
}

/* ───────────── Pieces ───────────── */

/** Lives in its own component so the per-second countdown re-renders only this, not the whole sidebar. */
const SessionWarning = memo(function SessionWarning() {
  const seconds = useSessionTimer();
  if (seconds >= 5 * 60) return null;
  return (
    <div role="timer" className="mx-3 mb-2 bg-amber/10 border border-amber/20 rounded-lg px-3 py-2">
      <p className="text-amber text-xs font-mono">
        Session expires in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </p>
    </div>
  );
});

function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Sign out" title="Sign out"
            className="text-text-muted hover:text-red transition-colors shrink-0">
      <Icon size={14} sw={2}>
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
      </Icon>
    </button>
  );
}

/* ───────────── Sidebar ───────────── */

export default function Sidebar({ active, onNav, collapsed, onToggle }: Props) {
  const { user, alerts, newAlertCount } = useAppState();
  const { setShowLogoutModal, clearNewAlertCount } = useAppActions();

  const role = user?.role;
  const items = useMemo(() => {
    const allowed = role ? PAGE_PERMISSIONS[role] ?? [] : [];
    // shortcut = position in the full list, which matches the Alt+1…9 handler in App.tsx
    return NAV.map((n, i) => ({ ...n, shortcut: i + 1 })).filter((n) => allowed.includes(n.id));
  }, [role]);

  const activeAlerts = useMemo(() => alerts.filter((a) => a.status === "Active").length, [alerts]);

  if (!user) return null;

  /** Arrow keys move between nav buttons, as people expect in a menu. */
  function onNavKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    buttons[(i + (e.key === "ArrowDown" ? 1 : buttons.length - 1)) % buttons.length].focus();
  }

  return (
    <aside
      aria-label="Sidebar"
      className={`flex flex-col h-screen bg-surface border-r border-border transition-[width] duration-300 shrink-0 ${collapsed ? "w-16" : "w-55"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center shrink-0 text-cyan">
          <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke="currentColor" strokeWidth="1.5"
                  fill="currentColor" fillOpacity="0.1" strokeLinejoin="round" />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-white tracking-widest uppercase text-sm whitespace-nowrap">
            Sentinel<span className="text-cyan">X</span>
          </span>
        )}
        <button onClick={onToggle} aria-expanded={!collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="ml-auto text-text-muted hover:text-text transition-colors shrink-0">
          <Icon size={14} sw={2}>{collapsed ? <path d="M5 12h14M12 5l7 7-7 7" /> : <path d="M19 12H5M12 5l-7 7 7 7" />}</Icon>
        </button>
      </div>

      {/* System status */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 bg-bg rounded-lg px-3 py-2 border border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-text-muted text-xs font-mono">System</span>
            <div className="flex items-center gap-1.5">
              <div className="status-dot status-dot-green w-1.5 h-1.5" />
              <span className="text-green text-xs font-mono">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div role="progressbar" aria-label="Campus risk score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.riskScore}
                 className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-cyan to-purple rounded-full" style={{ width: `${stats.riskScore}%` }} />
            </div>
            <span className="text-text-muted text-xs font-mono">{stats.riskScore}</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav aria-label="Main" onKeyDown={onNavKeyDown} className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {items.map((item) => {
          const isActive = active === item.id;
          const isAlerts = item.id === "alerts";
          const showBadge = isAlerts && activeAlerts > 0;
          const isNew = isAlerts && newAlertCount > 0;
          const count = activeAlerts > 99 ? "99+" : activeAlerts;

          return (
            <button
              key={item.id}
              onClick={() => { onNav(item.id); if (isAlerts) clearNewAlertCount(); }}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? `${item.label}${showBadge ? `, ${activeAlerts} active` : ""}` : undefined}
              title={`${item.label} (Alt+${item.shortcut})`}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-colors duration-150 text-left relative border ${
                isActive ? "bg-cyan/10 text-cyan border-cyan/20"
                         : "text-text-muted hover:text-text hover:bg-surface-2 border-transparent"}`}
            >
              <span className={`shrink-0 ${isNew && !collapsed ? "text-amber" : ""}`}><Icon>{ICON_PATHS[item.id]}</Icon></span>
              {!collapsed && (
                <>
                  <span className="text-xs font-medium tracking-wide flex-1 whitespace-nowrap">{item.label}</span>
                  {showBadge && (
                    <span className={`text-xs font-mono rounded px-1.5 py-0.5 ${isNew ? "bg-amber/20 text-amber animate-blink" : "bg-border text-text-muted"}`}>
                      {count}
                    </span>
                  )}
                </>
              )}
              {collapsed && showBadge && <span aria-hidden className="absolute top-1 right-1 w-2 h-2 bg-red rounded-full" />}
            </button>
          );
        })}
      </nav>

      {!collapsed && <SessionWarning />}

      {/* User */}
      <div className="border-t border-border p-3">
        <div className={`flex items-center gap-2.5 ${collapsed ? "flex-col" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan/30 to-purple/30 border border-border flex items-center justify-center shrink-0"
               title={collapsed ? `${user.name} · ${user.role}` : undefined}>
            <span className="font-display font-bold text-xs text-cyan">{user.avatar}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text truncate">{user.name}</p>
              <p className="text-xs text-text-muted font-mono truncate">{user.role}</p>
            </div>
          )}
          {/* Sign-out stays reachable when collapsed (it was hidden before) */}
          <LogoutButton onClick={() => setShowLogoutModal(true)} />
        </div>
      </div>
    </aside>
  );
}

import { useApp, PAGE_PERMISSIONS } from "../context/AppContext";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface Props {
  active: string;
  onNav: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { id: "incidents", label: "Incidents", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { id: "riskmap", label: "Risk Map", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
  { id: "analytics", label: "Analytics", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: "alerts", label: "Alerts", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg> },
  { id: "ml", label: "ML Insights", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { id: "audit", label: "Audit Trail", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: "users", label: "User Management", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { id: "settings", label: "Settings", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
];

export default function Sidebar({ active, onNav, collapsed, onToggle }: Props) {
  const { user, setUser, setShowLogoutModal, alerts, newAlertCount, clearNewAlertCount, sessionExpiry } = useApp();

  if (!user) return null;
  const allowed = PAGE_PERMISSIONS[user.role] ?? [];
  const navItems = ALL_NAV_ITEMS.filter(item => allowed.includes(item.id));
  const activeAlerts = alerts.filter(a => a.status === "Active").length;

  const mins = Math.floor(sessionExpiry / 60);
  const secs = sessionExpiry % 60;

  return (
    <aside
      className="flex flex-col h-screen bg-[#0d1525] border-r border-[#1e3058] transition-all duration-300 flex-shrink-0"
      style={{ width: collapsed ? 64 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1e3058]">
        <div className="w-8 h-8 rounded-lg bg-[#070b14] border border-[#1e3058] flex items-center justify-center flex-shrink-0 text-[#00d4ff]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" strokeLinejoin="round"/>
          </svg>
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-white tracking-widest uppercase text-sm whitespace-nowrap">
            Sentinel<span className="text-[#00d4ff]">X</span>
          </span>
        )}
        <button onClick={onToggle} className="ml-auto text-[#4a6090] hover:text-[#e2eaf8] transition-colors flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? <path d="M5 12h14M12 5l7 7-7 7"/> : <path d="M19 12H5M12 5l-7 7 7 7"/>}
          </svg>
        </button>
      </div>

      {/* System status */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 bg-[#070b14] rounded-lg px-3 py-2 border border-[#1e3058]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#4a6090] text-xs font-mono uppercase tracking-wider">System</span>
            <div className="flex items-center gap-1.5">
              <div className="status-dot status-dot-green w-1.5 h-1.5" />
              <span className="text-[#10b981] text-xs font-mono">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-[#1e3058] rounded-full overflow-hidden">
              <div className="h-full w-[68%] bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] rounded-full" />
            </div>
            <span className="text-[#4a6090] text-xs font-mono">68</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {navItems.map(item => {
          const isActive = active === item.id;
          const showBadge = item.id === "alerts" && activeAlerts > 0;
          const isNewAlert = item.id === "alerts" && newAlertCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => { onNav(item.id); if (item.id === "alerts") clearNewAlertCount(); }}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-all duration-150 text-left group relative border
                ${isActive ? "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20" : "text-[#4a6090] hover:text-[#e2eaf8] hover:bg-[#111e35] border-transparent"}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`flex-shrink-0 ${isNewAlert && !collapsed ? "text-[#f59e0b]" : ""}`}>{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="text-xs font-medium tracking-wide flex-1 whitespace-nowrap">{item.label}</span>
                  {showBadge && (
                    <span className={`text-xs font-mono rounded px-1.5 py-0.5 ${isNewAlert ? "bg-[#f59e0b]/20 text-[#f59e0b] animate-blink" : "bg-[#1e3058] text-[#4a6090]"}`}>
                      {activeAlerts}
                    </span>
                  )}
                </>
              )}
              {collapsed && showBadge && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Session timer */}
      {!collapsed && sessionExpiry < 5 * 60 && (
        <div className="mx-3 mb-2 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg px-3 py-2">
          <p className="text-[#f59e0b] text-xs font-mono">
            Session expires in {mins}:{secs.toString().padStart(2, "0")}
          </p>
        </div>
      )}

      {/* User */}
      <div className="border-t border-[#1e3058] p-3">
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff]/30 to-[#7c3aed]/30 border border-[#1e3058] flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-xs text-[#00d4ff]">{user.avatar}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#e2eaf8] truncate">{user.name}</p>
              <p className="text-xs text-[#4a6090] font-mono truncate">{user.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={() => setShowLogoutModal(true)} className="text-[#4a6090] hover:text-[#ef4444] transition-colors flex-shrink-0" title="Sign out">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

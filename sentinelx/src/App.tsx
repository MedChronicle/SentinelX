import { useState } from "react";
import type { AppUser } from "./lib/auth";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Incidents from "./components/Incidents";
import RiskMap from "./components/RiskMap";
import Analytics from "./components/Analytics";
import Alerts from "./components/Alerts";
import MLInsights from "./components/MLInsights";
import AuditTrail from "./components/AuditTrail";
import UserManagement from "./components/UserManagement";
import Settings from "./components/Settings";

type Page = "dashboard" | "incidents" | "riskmap" | "analytics" | "alerts" | "ml" | "audit" | "users" | "settings";

const PAGE_COMPONENTS: Record<Page, React.ReactNode> = {
  dashboard: <Dashboard />,
  incidents: <Incidents />,
  riskmap: <RiskMap />,
  analytics: <Analytics />,
  alerts: <Alerts />,
  ml: <MLInsights />,
  audit: <AuditTrail />,
  users: <UserManagement />,
  settings: <Settings />,
};

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b14]">
      <Sidebar
        active={page}
        onNav={(id) => setPage(id as Page)}
        user={user}
        onLogout={() => setUser(null)}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0d1525] border-b border-[#1e3058] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[#4a6090] text-xs font-mono">
              <span className="text-[#2d4a7a]">SentinelX</span>
              <span>/</span>
              <span className="text-[#e2eaf8] capitalize">{page === "ml" ? "ML Insights" : page === "riskmap" ? "Risk Map" : page}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#4a6090]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Sep 13, 2026 — 08:41 UTC</span>
            </div>
            <div className="w-px h-4 bg-[#1e3058]" />
            <button className="relative text-[#4a6090] hover:text-[#e2eaf8] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ef4444] rounded-full" />
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d4ff]/30 to-[#7c3aed]/30 border border-[#1e3058] flex items-center justify-center">
              <span className="font-display font-bold text-[10px] text-[#00d4ff]">{user.avatar}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-[#e2eaf8] font-medium leading-none">{user.name}</p>
              <p className="text-[10px] font-mono text-[#4a6090] mt-0.5">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-hidden flex">
          {PAGE_COMPONENTS[page]}
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { AppProvider, useApp, PAGE_PERMISSIONS } from "./context/AppContext";
import type { User } from "./context/AppContext";
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
import Toast from "./components/Toast";
import SessionLock from "./components/SessionLock";
import AIAssistant from "./components/AIAssistant";

type Page = "dashboard" | "incidents" | "riskmap" | "analytics" | "alerts" | "ml" | "audit" | "users" | "settings";

const PAGE_LABELS: Record<Page, string> = {
  dashboard: "Dashboard", incidents: "Incidents", riskmap: "Risk Map",
  analytics: "Analytics", alerts: "Alerts", ml: "ML Insights",
  audit: "Audit Trail", users: "User Management", settings: "Settings",
};

function RestrictedPage({ page }: { page: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#070b14] p-6">
      <div className="w-16 h-16 rounded-2xl bg-[#0d1525] border border-[#1e3058] flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d4a7a" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <h2 className="font-display text-xl font-bold text-[#2d4a7a] tracking-wide mb-2">Access Restricted</h2>
      <p className="text-[#1e3058] text-sm font-mono text-center max-w-xs">
        Your role does not have permission to view <span className="text-[#4a6090]">{page}</span>.<br/>Contact your administrator for access.
      </p>
    </div>
  );
}

function AppShell() {
  const { user, setUser, isLocked, showLogoutModal, setShowLogoutModal, sessionExpiry } = useApp();
  const [page, setPage] = useState<Page>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const mins = Math.floor(sessionExpiry / 60);
  const secs = sessionExpiry % 60;

  function handleLogin(u: User) { setUser(u); }
  function handleLogout() { setUser(null); setShowLogoutModal(false); }

  if (!user) return <Login onLogin={handleLogin} />;

  const allowed = PAGE_PERMISSIONS[user.role] ?? [];
  const canView = allowed.includes(page);

  function handleNav(id: string) {
    setPage(id as Page);
  }

  const PAGE_COMPONENTS: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard />,
    incidents: canView ? <Incidents /> : <RestrictedPage page="Incidents" />,
    riskmap: canView ? <RiskMap /> : <RestrictedPage page="Risk Map" />,
    analytics: canView ? <Analytics /> : <RestrictedPage page="Analytics" />,
    alerts: canView ? <Alerts /> : <RestrictedPage page="Alerts" />,
    ml: canView ? <MLInsights /> : <RestrictedPage page="ML Insights" />,
    audit: canView ? <AuditTrail /> : <RestrictedPage page="Audit Trail" />,
    users: canView ? <UserManagement /> : <RestrictedPage page="User Management" />,
    settings: canView ? <Settings /> : <RestrictedPage page="Settings" />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b14]">
      <Sidebar active={page} onNav={handleNav} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0d1525] border-b border-[#1e3058] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-[#4a6090] text-xs font-mono flex items-center gap-1">
              <span className="text-[#2d4a7a]">SentinelX</span>
              <span>/</span>
              <span className="text-[#e2eaf8]">{PAGE_LABELS[page]}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Session timer */}
            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border ${
              sessionExpiry < 2 * 60 ? "text-[#ef4444] border-[#ef4444]/20 bg-[#ef4444]/5 animate-blink"
              : sessionExpiry < 5 * 60 ? "text-[#f59e0b] border-[#f59e0b]/20 bg-[#f59e0b]/5"
              : "text-[#4a6090] border-transparent"
            }`}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{mins}:{secs.toString().padStart(2, "0")}</span>
            </div>
            <div className="w-px h-4 bg-[#1e3058]" />
            <div className="text-[#4a6090] text-xs font-mono hidden md:block">Sep 13, 2026 · 08:41 UTC</div>
            <div className="w-px h-4 bg-[#1e3058]" />
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

      {/* Session lock overlay */}
      {isLocked && <SessionLock />}

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-full max-w-sm animate-fade-up">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <h2 className="font-display text-lg font-bold text-white">Sign Out?</h2>
              <p className="text-[#4a6090] text-xs font-mono mt-1">Signed in as {user.name} · {user.role}</p>
              <p className="text-[#4a6090] text-xs mt-2">Your session will be terminated and all audit activity logged.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleLogout} className="flex-1 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-lg py-2.5 text-sm font-mono hover:bg-[#ef4444]/20 transition-colors">Sign Out</button>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 border border-[#1e3058] text-[#4a6090] rounded-lg py-2.5 text-sm hover:border-[#2a4580] hover:text-[#e2eaf8] transition-colors font-mono">Stay</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant */}
      <AIAssistant />

      {/* Toasts */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

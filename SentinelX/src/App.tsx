import {
  Component, lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState,
  type ComponentType, type ErrorInfo, type ReactNode,
} from "react";
import { AppProvider, useApp, PAGE_PERMISSIONS } from "./context/AppContext";
import type { User } from "./context/AppContext";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Toast from "./components/Toast";
import SessionLock from "./components/SessionLock";
import AIAssistant from "./components/AIAssistant";

/* ───────────── Route registry (single source of truth) ───────────── */

type DashboardProps = { onNavigate: (id: string) => void };

interface RouteDef {
  label: string;
  component: ComponentType<any>;
  /** Visible to every signed-in role, regardless of PAGE_PERMISSIONS */
  public?: boolean;
}

// Each page becomes its own chunk, so the initial bundle only carries the shell.
const ROUTES = {
  dashboard: { label: "Dashboard", public: true, component: lazy(() => import("./components/Dashboard")) as ComponentType<DashboardProps> },
  incidents: { label: "Incidents", component: lazy(() => import("./components/Incidents")) },
  riskmap: { label: "Risk Map", component: lazy(() => import("./components/RiskMap")) },
  analytics: { label: "Analytics", component: lazy(() => import("./components/Analytics")) },
  alerts: { label: "Alerts", component: lazy(() => import("./components/Alerts")) },
  ml: { label: "ML Insights", component: lazy(() => import("./components/MLInsights")) },
  audit: { label: "Audit Trail", component: lazy(() => import("./components/AuditTrail")) },
  users: { label: "User Management", component: lazy(() => import("./components/UserManagement")) },
  settings: { label: "Settings", component: lazy(() => import("./components/Settings")) },
} satisfies Record<string, RouteDef>;

type Page = keyof typeof ROUTES;
const DEFAULT_PAGE: Page = "dashboard";
const isPage = (v: string): v is Page => Object.hasOwn(ROUTES, v);

/* ───────────── Hooks ───────────── */

/** Keeps the current page in the URL hash so refresh and back/forward work. */
function useHashPage(): [Page, (p: Page) => void] {
  const read = (): Page => {
    const h = window.location.hash.slice(1);
    return isPage(h) ? h : DEFAULT_PAGE;
  };
  const [page, setPageState] = useState<Page>(read);

  useEffect(() => {
    const onHash = () => setPageState(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setPage = useCallback((p: Page) => {
    if (window.location.hash.slice(1) !== p) window.location.hash = p;
    setPageState(p);
  }, []);

  return [page, setPage];
}

/** Ticks once a minute so the top bar shows the real time instead of a hard-coded string. */
function useUtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
      }).format(now).replace(",", " ·").replace(/(\d{4}) (\d{2}:\d{2})/, "$1 · $2") + " UTC",
    [now],
  );
}

/** Closes on Escape and keeps focus on the primary action while open. */
function useModalA11y(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);
  return ref;
}

/* ───────────── Small components ───────────── */

class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Page crashed:", error, info.componentStack); }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Notice
        tone="error"
        title="This page failed to load"
        body={this.state.error.message}
        action={<button className="btn-primary rounded-lg px-4 py-2 text-xs" onClick={() => this.setState({ error: null })}>Try again</button>}
      />
    );
  }
}

function Notice({ title, body, tone = "muted", action }: {
  title: string; body: ReactNode; tone?: "muted" | "error"; action?: ReactNode;
}) {
  const color = tone === "error" ? "text-red" : "text-text-dim";
  return (
    <div role="alert" className="flex-1 flex flex-col items-center justify-center bg-bg p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={color}>
          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      </div>
      <h2 className={`font-display text-xl font-bold tracking-wide mb-2 ${color}`}>{title}</h2>
      <p className="text-text-muted text-sm font-mono max-w-xs">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4" aria-busy="true" aria-label="Loading page">
      <div className="skeleton h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-24" />)}
      </div>
      <div className="skeleton h-64" />
    </div>
  );
}

const SessionTimer = memo(function SessionTimer({ seconds }: { seconds: number }) {
  const tone =
    seconds < 120 ? "text-red border-red/20 bg-red/5 animate-blink"
    : seconds < 300 ? "text-amber border-amber/20 bg-amber/5"
    : "text-text-muted border-transparent";
  return (
    <div
      role="timer"
      aria-label={`Session expires in ${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds`}
      className={`hidden sm:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border ${tone}`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
    </div>
  );
});

const TopBar = memo(function TopBar({ label, user, sessionExpiry }: {
  label: string; user: User; sessionExpiry: number;
}) {
  const clock = useUtcClock();
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-surface border-b border-border shrink-0">
      <nav aria-label="Breadcrumb" className="text-text-muted text-xs font-mono flex items-center gap-1">
        <span className="text-text-dim">SentinelX</span>
        <span aria-hidden>/</span>
        <span className="text-text" aria-current="page">{label}</span>
      </nav>
      <div className="flex items-center gap-3">
        <SessionTimer seconds={sessionExpiry} />
        <div className="w-px h-4 bg-border" />
        <time className="text-text-muted text-xs font-mono hidden md:block">{clock}</time>
        <div className="w-px h-4 bg-border" />
        <div className="w-7 h-7 rounded-full bg-linear-to-br from-cyan/30 to-purple/30 border border-border flex items-center justify-center">
          <span className="font-display font-bold text-[10px] text-cyan">{user.avatar}</span>
        </div>
        <div className="hidden sm:block">
          <p className="text-xs text-text font-medium leading-none">{user.name}</p>
          <p className="text-[10px] font-mono text-text-muted mt-0.5">{user.role}</p>
        </div>
      </div>
    </header>
  );
});

function LogoutModal({ user, onConfirm, onCancel }: { user: User; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useModalA11y(true, onCancel);
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-200 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-desc"
           className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-red/10 border border-red/20 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <h2 id="logout-title" className="font-display text-lg font-bold text-white">Sign out?</h2>
          <p className="text-text-muted text-xs font-mono mt-1">Signed in as {user.name} · {user.role}</p>
          <p id="logout-desc" className="text-text-muted text-xs mt-2">
            Your session will end and this sign-out will be recorded in the audit trail.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onConfirm}
                  className="flex-1 bg-red/10 border border-red/30 text-red rounded-lg py-2.5 text-sm font-mono hover:bg-red/20 transition-colors">
            Sign out
          </button>
          <button ref={cancelRef} onClick={onCancel}
                  className="flex-1 border border-border text-text-muted rounded-lg py-2.5 text-sm font-mono hover:border-border-bright hover:text-text transition-colors">
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── App shell ───────────── */

function AppContent() {
  const { user, setUser, isLocked, showLogoutModal, setShowLogoutModal, sessionExpiry } = useApp();
  const [page, setPage] = useHashPage();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar:collapsed") === "1");

  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Alt+1…9 jumps between pages the role can open.
  const allowed = useMemo(() => new Set(user ? PAGE_PERMISSIONS[user.role] ?? [] : []), [user]);
  const canOpen = useCallback((p: Page) => ROUTES[p].public || allowed.has(p), [allowed]);

  useEffect(() => {
    if (!user) return;
    const keys = Object.keys(ROUTES) as Page[];
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || !/^[1-9]$/.test(e.key)) return;
      const target = keys[Number(e.key) - 1];
      if (target && canOpen(target)) { e.preventDefault(); setPage(target); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, canOpen, setPage]);

  const handleNav = useCallback((id: string) => { if (isPage(id)) setPage(id); }, [setPage]);
  const handleLogin = useCallback((u: User) => setUser(u), [setUser]);
  const handleLogout = useCallback(() => {
    setUser(null);
    setShowLogoutModal(false);
    window.location.hash = "";
  }, [setUser, setShowLogoutModal]);
  const closeLogout = useCallback(() => setShowLogoutModal(false), [setShowLogoutModal]);

  if (!user) return <Login onLogin={handleLogin} />;

  const { label, component: PageComponent } = ROUTES[page];
  const permitted = canOpen(page);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar active={page} onNav={handleNav} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <TopBar label={label} user={user} sessionExpiry={sessionExpiry} />

        <div className="flex-1 overflow-hidden flex">
          {permitted ? (
            <ErrorBoundary resetKey={page}>
              <Suspense fallback={<PageSkeleton />}>
                <PageComponent onNavigate={handleNav} />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <Notice
              title="Access restricted"
              body={<>Your role can’t view <span className="text-text">{label}</span>. Ask an administrator to grant access.</>}
            />
          )}
        </div>
      </main>

      {isLocked && <SessionLock />}
      {showLogoutModal && <LogoutModal user={user} onConfirm={handleLogout} onCancel={closeLogout} />}
      <AIAssistant />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

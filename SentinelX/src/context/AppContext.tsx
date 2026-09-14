import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import {
  initialIncidents, initialAlerts, initialAuditLogs,
  type Incident, type Alert, type AuditLog, type Role, type Severity,
  RANDOM_ALERT_TEMPLATES, type IncidentStatus,
} from "../data/mockData";

export interface User {
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
}

export const PAGE_PERMISSIONS: Record<Role, string[]> = {
  Administrator: ["dashboard", "incidents", "riskmap", "analytics", "alerts", "ml", "audit", "users", "settings"],
  "Security Officer": ["dashboard", "incidents", "riskmap", "alerts", "audit"],
  Analyst: ["dashboard", "analytics", "ml", "riskmap", "incidents"],
  Staff: ["dashboard", "incidents", "alerts"],
  Student: ["dashboard", "incidents"],
};

interface AppContextValue {
  user: User | null;
  setUser: (u: User | null) => void;
  incidents: Incident[];
  addIncident: (inc: Incident) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus, by: string, note?: string) => void;
  updateIncidentAssignee: (id: string, assignee: string, by: string) => void;
  addComment: (id: string, author: string, text: string) => void;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string, reason: string) => void;
  escalateAlert: (id: string) => void;
  newAlertCount: number;
  clearNewAlertCount: () => void;
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, "id" | "hash" | "prevHash">) => void;
  toasts: Toast[];
  showToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
  isLocked: boolean;
  unlock: () => void;
  sessionExpiry: number;
  showLogoutModal: boolean;
  setShowLogoutModal: (v: boolean) => void;
  canAccess: (page: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

let alertCounter = 1042;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState(15 * 60);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newAlertCount, setNewAlertCount] = useState(0);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef(15 * 60);

  const resetIdle = useCallback(() => {
    if (!user || isLocked) return;
    expiryRef.current = 15 * 60;
    setSessionExpiry(15 * 60);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsLocked(true), 15 * 60 * 1000);
  }, [user, isLocked]);

  useEffect(() => {
    if (!user) return;
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    countdownRef.current = setInterval(() => {
      setSessionExpiry(prev => {
        if (prev <= 1) { setIsLocked(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [user, resetIdle]);

  // Real-time alert simulation
  useEffect(() => {
    if (!user) return;
    const scheduleNext = () => {
      const delay = 20000 + Math.random() * 20000;
      realtimeRef.current = setTimeout(() => {
        const tpl = RANDOM_ALERT_TEMPLATES[Math.floor(Math.random() * RANDOM_ALERT_TEMPLATES.length)];
        const loc = ["Server Room — Block C", "Parking Lot B", "IT Infrastructure Hub", "Library — Wi-Fi Zone"][Math.floor(Math.random() * 4)];
        const newAlert: Alert = {
          id: `ALT-${alertCounter++}`,
          rule: tpl.rule,
          incident: `INC-${2892 + alertCounter}`,
          severity: tpl.severity,
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          status: "Active",
          description: `${tpl.desc} — ${loc}`,
        };
        setAlerts(prev => [newAlert, ...prev]);
        setNewAlertCount(c => c + 1);
        showToastFn({ type: "warning", title: `New Alert: ${tpl.rule}`, message: newAlert.description });
        scheduleNext();
      }, delay);
    };
    scheduleNext();
    return () => { if (realtimeRef.current) clearTimeout(realtimeRef.current); };
  }, [user]);

  function addAuditLog(log: Omit<AuditLog, "id" | "hash" | "prevHash">) {
    setAuditLogs(prev => {
      const prevHash = prev[0]?.hash ?? "0000000";
      const hash = Math.random().toString(36).slice(2, 10);
      const newEntry: AuditLog = {
        ...log,
        id: `AUD-${9883 + prev.length}`,
        hash,
        prevHash,
      };
      return [newEntry, ...prev];
    });
  }

  function setUser(u: User | null) {
    setUserState(u);
    if (!u) {
      setIsLocked(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
  }

  function addIncident(inc: Incident) {
    setIncidents(prev => [inc, ...prev]);
    addAuditLog({
      user: user?.email ?? "unknown",
      action: "INCIDENT_CREATED",
      entity: inc.id,
      prev: "—",
      next: "Open",
      time: new Date().toLocaleString(),
      ip: "10.4.x.x",
    });
  }

  function updateIncidentStatus(id: string, status: IncidentStatus, by: string, note?: string) {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== id) return inc;
      const entry = { time: new Date().toLocaleTimeString(), action: `Status → ${status}`, by, note };
      return { ...inc, status, timeline: [...inc.timeline, entry] };
    }));
    const inc = incidents.find(i => i.id === id);
    if (inc) addAuditLog({ user: user?.email ?? "unknown", action: "INCIDENT_STATUS_CHANGED", entity: id, prev: inc.status, next: status, time: new Date().toLocaleString(), ip: "10.4.x.x" });
  }

  function updateIncidentAssignee(id: string, assignee: string, by: string) {
    setIncidents(prev => prev.map(inc => {
      if (inc.id !== id) return inc;
      const entry = { time: new Date().toLocaleTimeString(), action: `Reassigned to ${assignee}`, by };
      return { ...inc, assigned: assignee, timeline: [...inc.timeline, entry] };
    }));
    addAuditLog({ user: user?.email ?? "unknown", action: "INCIDENT_ASSIGNED", entity: id, prev: "Previous", next: assignee, time: new Date().toLocaleString(), ip: "10.4.x.x" });
  }

  function addComment(id: string, author: string, text: string) {
    const time = new Date().toLocaleTimeString();
    setIncidents(prev => prev.map(inc => inc.id !== id ? inc : { ...inc, comments: [...inc.comments, { time, author, text }] }));
  }

  function acknowledgeAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Acknowledged" } : a));
    addAuditLog({ user: user?.email ?? "unknown", action: "ALERT_ACKNOWLEDGED", entity: id, prev: "Active", next: "Acknowledged", time: new Date().toLocaleString(), ip: "10.4.x.x" });
  }

  function dismissAlert(id: string, reason: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Dismissed", dismissReason: reason } : a));
    addAuditLog({ user: user?.email ?? "unknown", action: "ALERT_DISMISSED", entity: id, prev: "Active", next: `Dismissed: ${reason}`, time: new Date().toLocaleString(), ip: "10.4.x.x" });
  }

  function escalateAlert(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "Active", severity: "Critical" } : a));
    addAuditLog({ user: user?.email ?? "unknown", action: "ALERT_ESCALATED", entity: id, prev: "Acknowledged", next: "Critical/Active", time: new Date().toLocaleString(), ip: "10.4.x.x" });
    showToastFn({ type: "error", title: "Alert Escalated to Critical", message: `${id} has been escalated` });
  }

  function clearNewAlertCount() { setNewAlertCount(0); }

  function showToastFn(t: Omit<Toast, "id">) {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000);
  }

  function dismissToast(id: string) { setToasts(prev => prev.filter(t => t.id !== id)); }

  function unlock() {
    setIsLocked(false);
    expiryRef.current = 15 * 60;
    setSessionExpiry(15 * 60);
    resetIdle();
  }

  function canAccess(page: string) {
    if (!user) return false;
    return PAGE_PERMISSIONS[user.role]?.includes(page) ?? false;
  }

  return (
    <AppContext.Provider value={{
      user, setUser, incidents, addIncident, updateIncidentStatus, updateIncidentAssignee, addComment,
      alerts, setAlerts, acknowledgeAlert, dismissAlert, escalateAlert, newAlertCount, clearNewAlertCount,
      auditLogs, addAuditLog,
      toasts, showToast: showToastFn, dismissToast,
      isLocked, unlock, sessionExpiry, showLogoutModal, setShowLogoutModal,
      canAccess,
    }}>
      {children}
    </AppContext.Provider>
  );
}

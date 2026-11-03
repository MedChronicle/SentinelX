import {
  useCallback, useEffect, useMemo, useReducer, useRef, useState,
  type ReactNode, type SetStateAction,
} from "react";
import {
  AppStateContext, AppActionsContext, SessionContext,
  type AppActions, type AppState, type Toast, type User,
} from "./AppContextInstance";
import {
  initialIncidents, initialAlerts, initialAuditLogs, RANDOM_ALERT_TEMPLATES,
  type Alert, type AuditLog, type Incident, type IncidentStatus, type Role, type Severity,
} from "../data/mockData";
import { fnv1a, GENESIS_HASH } from "../data/domain";

// Consumers keep importing everything from "./context/AppContext"
export { useApp, useAppActions, useAppState, useSessionTimer } from "./AppContextInstance";
export type { User, Toast, AppContextValue } from "./AppContextInstance";

/* ───────────── Constants ───────────── */

const SESSION_SECONDS = 15 * 60;
const MAX_TOASTS = 5;
const TOAST_MS = 5000;
const CLIENT_IP = "10.4.x.x"; // placeholder until the backend supplies the real address
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
const SIMULATED_ALERT_LOCATIONS = [
  "Server Room — Block C", "Parking Lot B — Zone 3", "IT Infrastructure Hub", "Library — Wi-Fi Zone",
] as const;

export const PAGE_PERMISSIONS: Record<Role, readonly string[]> = {
  Administrator: ["dashboard", "incidents", "riskmap", "analytics", "alerts", "ml", "audit", "users", "settings"],
  "Security Officer": ["dashboard", "incidents", "riskmap", "alerts", "audit"],
  Analyst: ["dashboard", "analytics", "ml", "riskmap", "incidents"],
  Staff: ["dashboard", "incidents", "alerts"],
  Student: ["dashboard", "incidents"],
};

/* ───────────── Helpers (pure) ───────────── */

// UTC "YYYY-MM-DD HH:mm" / "HH:mm", the same format the mock data uses
const stampDate = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
const stampTime = (d: Date) => d.toISOString().slice(11, 16);
const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

type AuditInput = Omit<AuditLog, "id" | "hash" | "prevHash" | "time"> & { time?: string };

/** Newest-first chain: each entry's hash covers the previous hash, so edits break every later link. */
function appendAudit(logs: AuditLog[], e: AuditInput, at: Date): AuditLog[] {
  const last = logs[0];
  const seq = last ? Number(last.id.slice(4)) + 1 : 1;
  const time = e.time ?? stampDate(at);
  const prevHash = last?.hash ?? GENESIS_HASH;
  const entry: AuditLog = {
    ...e,
    time,
    id: `AUD-${seq}`,
    prevHash,
    hash: fnv1a([prevHash, time, e.user, e.action, e.entity, e.prev, e.next].join("|")),
  };
  return [entry, ...logs];
}

const nextAlertNumber = (alerts: Alert[]) =>
  alerts.reduce((max, a) => Math.max(max, Number(a.id.slice(4)) || 0), 1041) + 1;

/* ───────────── Reducer: every change and its audit entry happen atomically ───────────── */

interface DataState {
  incidents: Incident[];
  alerts: Alert[];
  auditLogs: AuditLog[];
  toasts: Toast[];
  newAlertCount: number;
}

type AlertTemplate = { rule: string; severity: Severity; description: string };

type Action =
  | { type: "incident/add"; incident: Incident; actor: string; at: Date }
  | { type: "incident/status"; id: string; status: IncidentStatus; by: string; note?: string; actor: string; at: Date }
  | { type: "incident/assign"; id: string; assignee: string; by: string; actor: string; at: Date }
  | { type: "incident/comment"; id: string; author: string; text: string; at: Date }
  | { type: "alert/received"; template: AlertTemplate; incident: Alert["incident"]; at: Date }
  | { type: "alert/acknowledge"; id: string; actor: string; at: Date }
  | { type: "alert/dismiss"; id: string; reason: string; actor: string; at: Date }
  | { type: "alert/escalate"; id: string; actor: string; at: Date }
  | { type: "alerts/replace"; next: SetStateAction<Alert[]> }
  | { type: "alerts/seen" }
  | { type: "audit/add"; entry: AuditInput; at: Date }
  | { type: "toast/show"; toast: Toast }
  | { type: "toast/dismiss"; id: string };

const initialData = (): DataState => ({
  incidents: initialIncidents,
  alerts: initialAlerts,
  auditLogs: initialAuditLogs,
  toasts: [],
  newAlertCount: 0,
});

function reducer(s: DataState, a: Action): DataState {
  switch (a.type) {
    case "incident/add":
      return {
        ...s,
        incidents: [a.incident, ...s.incidents],
        auditLogs: appendAudit(s.auditLogs, {
          user: a.actor, action: "INCIDENT_CREATED", entity: a.incident.id,
          prev: "—", next: a.incident.status, ip: CLIENT_IP,
        }, a.at),
      };

    case "incident/status": {
      const inc = s.incidents.find((i) => i.id === a.id);
      if (!inc || inc.status === a.status) return s;
      const entry = { time: stampTime(a.at), action: `Status → ${a.status}`, by: a.by, note: a.note };
      return {
        ...s,
        incidents: s.incidents.map((i) =>
          i.id === a.id ? { ...i, status: a.status, timeline: [...i.timeline, entry] } : i),
        auditLogs: appendAudit(s.auditLogs, {
          user: a.actor, action: "INCIDENT_STATUS_CHANGED", entity: a.id,
          prev: inc.status, next: a.status, ip: CLIENT_IP,
        }, a.at),
      };
    }

    case "incident/assign": {
      const inc = s.incidents.find((i) => i.id === a.id);
      if (!inc) return s;
      const entry = { time: stampTime(a.at), action: `Reassigned to ${a.assignee}`, by: a.by };
      return {
        ...s,
        incidents: s.incidents.map((i) =>
          i.id === a.id ? { ...i, assigned: a.assignee, timeline: [...i.timeline, entry] } : i),
        auditLogs: appendAudit(s.auditLogs, {
          user: a.actor, action: "INCIDENT_ASSIGNED", entity: a.id,
          prev: inc.assigned, next: a.assignee, ip: CLIENT_IP,
        }, a.at),
      };
    }

    case "incident/comment": {
      const comment = { time: stampTime(a.at), author: a.author, text: a.text };
      return {
        ...s,
        incidents: s.incidents.map((i) =>
          i.id === a.id ? { ...i, comments: [...i.comments, comment] } : i),
      };
    }

    case "alert/received": {
      const alert: Alert = {
        id: `ALT-${nextAlertNumber(s.alerts)}`,
        rule: a.template.rule,
        incident: a.incident,
        severity: a.template.severity,
        time: stampTime(a.at),
        status: "Active",
        description: a.template.description,
      };
      return {
        ...s,
        alerts: [alert, ...s.alerts],
        newAlertCount: s.newAlertCount + 1,
        auditLogs: appendAudit(s.auditLogs, {
          user: "system@sentinelx", action: "ALERT_GENERATED", entity: alert.id,
          prev: "—", next: "Active", ip: "10.4.0.1",
        }, a.at),
      };
    }

    case "alert/acknowledge": {
      const alert = s.alerts.find((x) => x.id === a.id);
      if (!alert) return s;
      return {
        ...s,
        alerts: s.alerts.map((x) => (x.id === a.id ? { ...x, status: "Acknowledged" } : x)),
        auditLogs: appendAudit(s.auditLogs, {
          user: a.actor, action: "ALERT_ACKNOWLEDGED", entity: a.id,
          prev: alert.status, next: "Acknowledged", ip: CLIENT_IP,
        }, a.at),
      };
    }

    case "alert/dismiss": {
      const alert = s.alerts.find((x) => x.id === a.id);
      if (!alert) return s;
      return {
        ...s,
        alerts: s.alerts.map((x) => (x.id === a.id ? { ...x, status: "Dismissed", dismissReason: a.reason } : x)),
        auditLogs: appendAudit(s.auditLogs, {
          user: a.actor, action: "ALERT_DISMISSED", entity: a.id,
          prev: alert.status, next: `Dismissed: ${a.reason}`, ip: CLIENT_IP,
        }, a.at),
      };
    }

    case "alert/escalate": {
      const alert = s.alerts.find((x) => x.id === a.id);
      if (!alert) return s;
      return {
        ...s,
        alerts: s.alerts.map((x) => (x.id === a.id ? { ...x, status: "Active", severity: "Critical" } : x)),
        auditLogs: appendAudit(s.auditLogs, {
          user: a.actor, action: "ALERT_ESCALATED", entity: a.id,
          prev: `${alert.severity}/${alert.status}`, next: "Critical/Active", ip: CLIENT_IP,
        }, a.at),
      };
    }

    case "alerts/replace":
      return { ...s, alerts: typeof a.next === "function" ? a.next(s.alerts) : a.next };

    case "alerts/seen":
      return s.newAlertCount === 0 ? s : { ...s, newAlertCount: 0 };

    case "audit/add":
      return { ...s, auditLogs: appendAudit(s.auditLogs, a.entry, a.at) };

    case "toast/show":
      return { ...s, toasts: [...s.toasts.slice(-(MAX_TOASTS - 1)), a.toast] };

    case "toast/dismiss":
      return { ...s, toasts: s.toasts.filter((t) => t.id !== a.id) };
  }
}

/* ───────────── Provider ───────────── */

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, initialData);
  const [user, setUserState] = useState<User | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState(SESSION_SECONDS);

  // Refs let stable callbacks read the latest values without being re-created
  const userRef = useRef<User | null>(null);
  const incidentsRef = useRef(data.incidents);
  const expiresAt = useRef(0);
  const toastTimers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => { incidentsRef.current = data.incidents; }, [data.incidents]);

  const active = user !== null && !isLocked;

  /* Session: one deadline timestamp. Activity only moves the deadline (no state update, no re-render),
     and the 1 s tick derives the countdown from the clock, so it stays correct after a sleeping tab. */
  useEffect(() => {
    if (!active) return;
    const extend = () => { expiresAt.current = Date.now() + SESSION_SECONDS * 1000; };
    extend();
    setSessionExpiry(SESSION_SECONDS);

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, extend, { passive: true }));
    const tick = setInterval(() => {
      const left = Math.max(0, Math.ceil((expiresAt.current - Date.now()) / 1000));
      setSessionExpiry(left);
      if (left === 0) setIsLocked(true);
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, extend));
      clearInterval(tick);
    };
  }, [active]);

  /* Toasts */
  const dismissToast = useCallback((id: string) => dispatch({ type: "toast/dismiss", id }), []);
  const showToast = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    dispatch({ type: "toast/show", toast: { ...t, id } });
    const timer = setTimeout(() => {
      toastTimers.current.delete(timer);
      dispatch({ type: "toast/dismiss", id });
    }, TOAST_MS);
    toastTimers.current.add(timer);
  }, []);
  useEffect(() => {
    const timers = toastTimers.current;
    return () => { timers.forEach(clearTimeout); timers.clear(); };
  }, []);

  /* Simulated real-time alerts (paused while locked or signed out) */
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const tpl = pick(RANDOM_ALERT_TEMPLATES);
        const location = pick(SIMULATED_ALERT_LOCATIONS);
        // Link to a real open incident at that location; otherwise don't invent an ID
        const match = incidentsRef.current.find(
          (i) => i.location === location && i.status !== "Resolved" && i.status !== "Closed");
        const description = `${tpl.desc} — ${location}`;
        dispatch({
          type: "alert/received",
          template: { rule: tpl.rule, severity: tpl.severity, description },
          incident: match?.id ?? "Multiple",
          at: new Date(),
        });
        showToast({ type: "warning", title: `New alert: ${tpl.rule}`, message: description });
        schedule();
      }, 20_000 + Math.random() * 20_000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [active, showToast]);

  /* Actions: created once, identity never changes */
  const actions = useMemo<AppActions>(() => {
    const actor = () => userRef.current?.email ?? "unknown";
    return {
      setUser: (u) => {
        userRef.current = u;
        setUserState(u);
        if (!u) setIsLocked(false);
      },
      addIncident: (incident) => dispatch({ type: "incident/add", incident, actor: actor(), at: new Date() }),
      updateIncidentStatus: (id, status, by, note) =>
        dispatch({ type: "incident/status", id, status, by, note, actor: actor(), at: new Date() }),
      updateIncidentAssignee: (id, assignee, by) =>
        dispatch({ type: "incident/assign", id, assignee, by, actor: actor(), at: new Date() }),
      addComment: (id, author, text) => dispatch({ type: "incident/comment", id, author, text, at: new Date() }),
      setAlerts: (next) => dispatch({ type: "alerts/replace", next }),
      acknowledgeAlert: (id) => dispatch({ type: "alert/acknowledge", id, actor: actor(), at: new Date() }),
      dismissAlert: (id, reason) => dispatch({ type: "alert/dismiss", id, reason, actor: actor(), at: new Date() }),
      escalateAlert: (id) => {
        dispatch({ type: "alert/escalate", id, actor: actor(), at: new Date() });
        showToast({ type: "error", title: "Alert escalated to Critical", message: `${id} has been escalated` });
      },
      clearNewAlertCount: () => dispatch({ type: "alerts/seen" }),
      addAuditLog: (entry) => dispatch({ type: "audit/add", entry, at: new Date() }),
      showToast,
      dismissToast,
      unlock: () => setIsLocked(false), // the session effect restarts the countdown
      setShowLogoutModal,
    };
  }, [showToast, dismissToast]);

  const canAccess = useCallback(
    (page: string) => (user ? PAGE_PERMISSIONS[user.role]?.includes(page) ?? false : false),
    [user],
  );

  const state = useMemo<AppState>(
    () => ({ user, ...data, isLocked, showLogoutModal, canAccess }),
    [user, data, isLocked, showLogoutModal, canAccess],
  );

  return (
    <AppActionsContext.Provider value={actions}>
      <AppStateContext.Provider value={state}>
        <SessionContext.Provider value={sessionExpiry}>{children}</SessionContext.Provider>
      </AppStateContext.Provider>
    </AppActionsContext.Provider>
  );
}

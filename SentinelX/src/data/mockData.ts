/* ───────────── Enumerations: one array drives the type AND runtime checks ───────────── */

export const ROLES = ["Administrator", "Security Officer", "Analyst", "Staff", "Student"] as const;
export const SEVERITIES = ["Critical", "High", "Moderate", "Low"] as const;
export const INCIDENT_STATUSES = ["Open", "Investigating", "Escalated", "Resolved", "Closed"] as const;
export const ALERT_STATUSES = ["Active", "Acknowledged", "Dismissed", "Resolved"] as const;
export const CONTACT_PREFERENCES = ["In-app updates", "Email", "Phone"] as const;

export type Role = (typeof ROLES)[number];
export type Severity = (typeof SEVERITIES)[number];
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];
export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];

export const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);
export const isSeverity = (v: unknown): v is Severity => SEVERITIES.includes(v as Severity);

/* ───────────── Template-literal IDs catch "INC-" vs "ALT-" mix-ups at compile time ───────────── */

export type IncidentId = `INC-${number}`;
export type AlertId = `ALT-${number}`;
export type AuditId = `AUD-${number}`;
export type UserId = `USR-${number}`;

/* ───────────── Entities ───────────── */

export interface TimelineEntry { time: string; action: string; by: string; note?: string }
export interface IncidentComment { time: string; author: string; text: string }

export interface Incident {
  id: IncidentId;
  type: string;
  description: string;
  location: string;
  severity: Severity;
  status: IncidentStatus;
  reporter: string;
  reporterEmail?: string;
  assigned: string;
  time: string;
  riskScore: number;
  evidence?: string;
  occurredAt?: string;
  locationDetail?: string;
  witnessInfo?: string;
  contactPreference?: ContactPreference;
  immediateDanger?: boolean;
  timeline: TimelineEntry[];
  comments: IncidentComment[];
}

export interface Alert {
  id: AlertId;
  rule: string;
  incident: IncidentId | "Multiple";
  severity: Severity;
  time: string;
  status: AlertStatus;
  description: string;
  dismissReason?: string;
}

export interface AuditLog {
  id: AuditId;
  user: string;
  action: string;
  entity: string;
  prev: string;
  next: string;
  time: string;
  hash: string;
  prevHash: string;
  ip: string;
}

/* ───────────── Reference data ───────────── */

export const LOCATIONS = [
  "Server Room — Block C", "IT Infrastructure Hub", "Parking Lot B — Zone 3", "Research Labs — Floor 5",
  "Chemistry Lab — Wing D", "Student Hostel A", "Cafeteria Block", "Gymnasium", "Admin Block — UPS Room",
  "Library — Wi-Fi Zone", "Main Gate", "Academic Block — Floor 2", "Sports Complex", "Auditorium", "Medical Center",
] as const;

export const INCIDENT_TYPES = [
  "Unauthorized Access", "Suspicious Activity", "Network Security Alert", "Environmental Risk",
  "Emergency — Medical", "Infrastructure Failure", "Fire Alarm", "Theft / Property",
  "Physical Altercation", "Vehicle Incident",
] as const;

/** Single place that defines how a severity looks and sorts. */
export const SEVERITY_META: Record<Severity, { rank: number; minScore: number; color: string; badge: string }> = {
  Critical: { rank: 0, minScore: 80, color: "#ef4444", badge: "badge-critical" },
  High:     { rank: 1, minScore: 60, color: "#f59e0b", badge: "badge-high" },
  Moderate: { rank: 2, minScore: 35, color: "#a78bfa", badge: "badge-moderate" },
  Low:      { rank: 3, minScore: 0,  color: "#10b981", badge: "badge-low" },
};

export const STATUS_BADGE: Record<IncidentStatus, string> = {
  Open: "badge-open", Investigating: "badge-investigating", Escalated: "badge-escalated",
  Resolved: "badge-resolved", Closed: "badge-closed",
};

/** Maps a 0–100 risk score onto a severity band (consistent with the existing mock incidents). */
export function severityFromScore(score: number): Severity {
  return SEVERITIES.find((s) => score >= SEVERITY_META[s].minScore) ?? "Low";
}

/* ───────────── Workflow rules ───────────── */

export const INCIDENT_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  Open: ["Investigating", "Escalated", "Closed"],
  Investigating: ["Escalated", "Resolved", "Closed"],
  Escalated: ["Investigating", "Resolved"],
  Resolved: ["Closed", "Investigating"], // reopen allowed
  Closed: [],
};

export const canTransition = (from: IncidentStatus, to: IncidentStatus) =>
  INCIDENT_TRANSITIONS[from].includes(to);

/* ───────────── Time helpers ("YYYY-MM-DD HH:mm", treated as UTC) ───────────── */

export function parseTs(ts: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(ts);
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : null;
}

export function hoursSince(ts: string, now: Date = new Date()): number | null {
  const d = parseTs(ts);
  return d ? (now.getTime() - d.getTime()) / 36e5 : null;
}

/* ───────────── Selectors ───────────── */

export const bySeverityThenScore = (a: Incident, b: Incident) =>
  SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank || b.riskScore - a.riskScore;

export function countBy<T, K extends string>(items: readonly T[], key: (t: T) => K): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const item of items) { const k = key(item); out[k] = (out[k] ?? 0) + 1; }
  return out;
}

/** Stats derived from live state, so the dashboard reacts when an incident or alert changes. */
export function liveStats(incidents: readonly Incident[], alerts: readonly Alert[]) {
  const isOpen = (s: IncidentStatus) => s !== "Resolved" && s !== "Closed";
  const open = incidents.filter((i) => isOpen(i.status));
  return {
    open: open.length,
    critical: open.filter((i) => i.severity === "Critical").length,
    unassigned: open.filter((i) => i.assigned === "Unassigned").length,
    activeAlerts: alerts.filter((a) => a.status === "Active").length,
    avgRisk: open.length ? Math.round(open.reduce((n, i) => n + i.riskScore, 0) / open.length) : 0,
    bySeverity: countBy(open, (i) => i.severity),
  };
}

/* ───────────── Tamper-evident audit chain ───────────── */

export const GENESIS_HASH = "0000000"; // matches the oldest mock entry

/** 32-bit FNV-1a → 8 hex chars. Demo-grade only; use SubtleCrypto SHA-256 on a real backend. */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Logs are newest-first. Returns the index of the first broken link, or -1 if the chain is intact. */
export function verifyAuditChain(logs: readonly AuditLog[]): number {
  for (let i = 0; i < logs.length; i++) {
    const expected = i + 1 < logs.length ? logs[i + 1].hash : GENESIS_HASH;
    if (logs[i].prevHash !== expected) return i;
  }
  return -1;
}

let auditSeq = 9883;
/** Builds the next entry, chained to the newest existing one. */
export function nextAuditEntry(
  logs: readonly AuditLog[],
  e: Pick<AuditLog, "user" | "action" | "entity" | "prev" | "next" | "ip">,
  now: Date = new Date(),
): AuditLog {
  const time = now.toISOString().slice(0, 16).replace("T", " ");
  const prevHash = logs[0]?.hash ?? GENESIS_HASH;
  return {
    id: `AUD-${auditSeq++}`,
    ...e,
    time,
    prevHash,
    hash: fnv1a([prevHash, time, e.user, e.action, e.entity, e.prev, e.next].join("|")),
  };
}

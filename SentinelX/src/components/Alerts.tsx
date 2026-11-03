import { useMemo, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from "react";
import { useAppActions, useAppState } from "../context/AppContext";
import { ALERT_STATUSES, SEVERITY_META, countBy, type Alert, type AlertStatus } from "../data/domain";
import Modal from "./Modal";

/* ───────────── Config ───────────── */

const STATUS_TONE: Record<AlertStatus, string> = {
  Active: "var(--color-red)",
  Acknowledged: "var(--color-amber)",
  Dismissed: "var(--color-text-muted)",
  Resolved: "var(--color-green)",
};

type Filter = "All" | AlertStatus;
const FILTERS: readonly Filter[] = ["All", ...ALERT_STATUSES];
type SortKey = "newest" | "severity";

const MODIFY_ROLES = new Set(["Administrator", "Security Officer"]);
const QUICK_REASONS = ["False positive", "Resolved offline", "Duplicate alert"] as const;

const ALERT_RULES = [
  { id: "r1", rule: "Critical incident → immediate escalation", trigger: "Severity = Critical", action: "Auto-escalate + notify admin", on: true },
  { id: "r2", rule: "Repeated location — elevated risk", trigger: "Same location ≥ 3 incidents in 24h", action: "Raise risk score + alert", on: true },
  { id: "r3", rule: "SLA exceeded — no assignment", trigger: "Unassigned incident > SLA threshold", action: "Alert + auto-assign queue", on: true },
  { id: "r4", rule: "ML anomaly cluster detected", trigger: "Isolation Forest confidence > 70%", action: "Generate alert + flag incidents", on: true },
  { id: "r5", rule: "High-risk zone monitoring", trigger: "Zone risk score > 70", action: "Continuous monitoring alert", on: false },
] as const;

const tone = (value: string) => ({ "--tone": value }) as CSSProperties;

const actionBtn =
  "px-3 py-1.5 border rounded-lg text-xs font-mono transition-colors whitespace-nowrap " +
  "bg-(--tone)/10 border-(--tone)/30 text-(--tone) hover:bg-(--tone)/20";

/* ───────────── Alert card ───────────── */

function AlertCard({ alert, canModify, onAcknowledge, onEscalate, onDismiss, onOpenIncident }: {
  alert: Alert;
  canModify: boolean;
  onAcknowledge: () => void;
  onEscalate: () => void;
  onDismiss: () => void;
  onOpenIncident?: () => void;
}) {
  const sev = SEVERITY_META[alert.severity];
  const open = alert.status === "Active" || alert.status === "Acknowledged";
  const canAck = alert.status === "Active";
  const canEscalate = open && !(alert.status === "Active" && alert.severity === "Critical");

  return (
    <li
      className="bg-surface rounded-xl p-5 transition-opacity"
      style={{
        ...tone(sev.color),
        border: `1px solid ${alert.status === "Active"
          ? `color-mix(in oklab, ${sev.color} 25%, transparent)`
          : "var(--color-border)"}`,
        boxShadow: `inset 3px 0 0 ${sev.color}`, // severity accent on the left edge
        opacity: alert.status === "Dismissed" ? 0.55 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-text-muted">{alert.id}</span>
            <span className={`badge ${sev.badge}`}>{alert.severity}</span>
            <span className="badge" style={tone(STATUS_TONE[alert.status])}>{alert.status}</span>
            {alert.status === "Active" && <span aria-hidden className="status-dot status-dot-red" />}
          </div>
          <h3 className="font-display font-semibold text-text tracking-wide text-sm mb-1">{alert.rule}</h3>
          <p className="text-text-muted text-xs leading-relaxed">{alert.description}</p>
          {alert.dismissReason && <p className="text-xs font-mono text-text-muted mt-1 italic">Dismissed: {alert.dismissReason}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs font-mono text-text-muted">
            <span>Incident: <span className="text-cyan">{alert.incident}</span></span>
            <span>Time: {alert.time}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {canModify && canAck && (
            <button onClick={onAcknowledge} aria-label={`Acknowledge ${alert.id}`} className={actionBtn} style={tone("var(--color-amber)")}>
              Acknowledge
            </button>
          )}
          {canModify && canEscalate && (
            <button onClick={onEscalate} aria-label={`Escalate ${alert.id} to critical`} className={actionBtn} style={tone("var(--color-red)")}>
              Escalate
            </button>
          )}
          {canModify && open && (
            <button onClick={onDismiss} aria-label={`Dismiss ${alert.id}`} className={actionBtn} style={tone("var(--color-text-muted)")}>
              Dismiss
            </button>
          )}
          {onOpenIncident && (
            <button onClick={onOpenIncident} aria-label={`Open incidents for ${alert.id}`} className={actionBtn} style={tone("var(--color-cyan)")}>
              Incidents
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/* ───────────── Page ───────────── */

export default function Alerts({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { alerts, user, canAccess } = useAppState();
  const { acknowledgeAlert, dismissAlert, escalateAlert, showToast } = useAppActions();

  const [filter, setFilter] = useState<Filter>("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [target, setTarget] = useState<Alert | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(ALERT_RULES.map((r) => [r.id, r.on])));

  const canModify = !!user && MODIFY_ROLES.has(user.role);
  const counts = useMemo(() => countBy(alerts, (a) => a.status), [alerts]);
  const criticalActive = useMemo(() => alerts.filter((a) => a.severity === "Critical" && a.status === "Active").length, [alerts]);

  const visible = useMemo(() => {
    const base = alerts.filter((a) => filter === "All" || a.status === filter);
    // Array.sort is stable, so within a severity the newest-first order is kept
    return sort === "severity"
      ? [...base].sort((a, b) => SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank)
      : base;
  }, [alerts, filter, sort]);

  // Bulk action deliberately skips Critical alerts: those should be reviewed one by one
  const bulkAckable = visible.filter((a) => a.status === "Active" && a.severity !== "Critical");

  function acknowledge(a: Alert) {
    acknowledgeAlert(a.id);
    showToast({ type: "info", title: "Alert acknowledged", message: a.id });
  }

  function acknowledgeAll() {
    bulkAckable.forEach((a) => acknowledgeAlert(a.id));
    showToast({ type: "info", title: `${bulkAckable.length} alerts acknowledged`, message: "Critical alerts were left for individual review." });
  }

  function openDismiss(a: Alert) { setTarget(a); setReason(""); setReasonError(""); }
  function closeDismiss() { setTarget(null); }

  function submitDismiss(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 3) { setReasonError("Enter a reason. It is recorded in the audit trail."); return; }
    if (!target) return;
    dismissAlert(target.id, trimmed);
    showToast({ type: "info", title: "Alert dismissed", message: trimmed });
    closeDismiss();
  }

  const onReasonKey = (e: KeyboardEvent) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitDismiss(); };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-bg">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Alert management</h1>
          <p className="text-text-muted text-xs font-mono mt-0.5">
            {counts.Active ?? 0} active · {counts.Acknowledged ?? 0} acknowledged · {counts.Dismissed ?? 0} dismissed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div role="group" aria-label="Filter by status" className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                        filter === f ? "bg-cyan/10 border-cyan/30 text-cyan" : "bg-surface border-border text-text-muted hover:border-border-bright"}`}>
                {f} <span className="opacity-60">{f === "All" ? alerts.length : counts[f] ?? 0}</span>
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="alert-sort">Sort alerts</label>
          <select id="alert-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-text-muted outline-none focus:border-cyan">
            <option value="newest">Newest first</option>
            <option value="severity">Severity first</option>
          </select>
        </div>
      </div>

      {criticalActive > 0 && (
        <div role="status" className="mb-4 bg-red/10 border border-red/30 rounded-xl p-4 flex items-center gap-4 glow-red">
          <div className="w-10 h-10 rounded-full bg-red/20 border border-red/40 flex items-center justify-center shrink-0">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-red tracking-wide text-sm">
              {criticalActive} critical {criticalActive === 1 ? "alert" : "alerts"} active
            </p>
            <p className="text-red/70 text-xs font-mono mt-0.5">Immediate action required. Escalation protocols are engaged.</p>
          </div>
          <div aria-hidden className="status-dot status-dot-red shrink-0" />
        </div>
      )}

      {canModify && bulkAckable.length > 1 && (
        <div className="mb-3 flex justify-end">
          <button onClick={acknowledgeAll}
                  className="px-3 py-1.5 border rounded-lg text-xs font-mono transition-colors bg-amber/10 border-amber/30 text-amber hover:bg-amber/20">
            Acknowledge {bulkAckable.length} non-critical
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl flex flex-col items-center justify-center py-16 mb-6">
          <svg aria-hidden width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="1.5" className="mb-3">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <p className="text-text-muted text-sm font-display">
            {filter === "All" ? "No alerts yet." : `No ${filter.toLowerCase()} alerts.`}
          </p>
          {filter !== "All" && (
            <button onClick={() => setFilter("All")} className="text-cyan text-xs font-mono mt-2 hover:underline">Show all alerts</button>
          )}
        </div>
      ) : (
        <ul className="space-y-3 mb-6">
          {visible.map((a) => (
            <AlertCard key={a.id} alert={a} canModify={canModify}
                       onAcknowledge={() => acknowledge(a)}
                       onEscalate={() => escalateAlert(a.id)}
                       onDismiss={() => openDismiss(a)}
                       onOpenIncident={onNavigate && canAccess("incidents") && a.incident !== "Multiple" ? () => onNavigate("incidents") : undefined} />
          ))}
        </ul>
      )}

      {/* Rules (toggles are local until the backend stores them) */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-text tracking-wide">Configured alert rules</h2>
        </div>
        <ul className="divide-y divide-border/50">
          {ALERT_RULES.map((r) => {
            const on = enabled[r.id];
            return (
              <li key={r.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-surface-2 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text font-medium">{r.rule}</p>
                  <p className="text-xs font-mono text-text-muted mt-0.5">Trigger: {r.trigger} · Action: {r.action}</p>
                </div>
                {canModify ? (
                  <button role="switch" aria-checked={on} aria-label={`${r.rule}: ${on ? "enabled" : "disabled"}`}
                          onClick={() => setEnabled((s) => ({ ...s, [r.id]: !s[r.id] }))}
                          className={`relative w-9 h-5 rounded-full border transition-colors shrink-0 ${on ? "bg-green/30 border-green/50" : "bg-border border-border-bright"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform ${on ? "translate-x-4 bg-green" : "bg-text-muted"}`} />
                  </button>
                ) : (
                  <span className={`text-xs font-mono ${on ? "text-green" : "text-text-muted"}`}>{on ? "Active" : "Disabled"}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {target && (
        <Modal title="Dismiss alert" description={`${target.id} · A reason is required and is logged in the audit trail.`} onClose={closeDismiss}>
          <form onSubmit={submitDismiss} noValidate>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_REASONS.map((q) => (
                <button key={q} type="button" onClick={() => { setReason(q); setReasonError(""); }}
                        className="text-xs font-mono border border-border text-text-muted rounded-md px-2 py-1 hover:text-text hover:border-border-bright transition-colors">
                  {q}
                </button>
              ))}
            </div>
            <label htmlFor="dismiss-reason" className="sr-only">Reason for dismissal</label>
            <textarea id="dismiss-reason" autoFocus rows={3} value={reason} onKeyDown={onReasonKey}
                      onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
                      placeholder="Reason for dismissal (e.g. false positive, resolved offline)…"
                      aria-invalid={!!reasonError} aria-describedby={reasonError ? "dismiss-reason-error" : undefined}
                      className="w-full bg-bg border border-border focus:border-cyan rounded-lg px-3 py-2.5 text-sm text-text placeholder-text-dim outline-none font-mono resize-none" />
            {reasonError && <p id="dismiss-reason-error" role="alert" className="text-red text-xs font-mono mt-1">{reasonError}</p>}
            <div className="flex gap-2 mt-4">
              <button type="submit"
                      className="flex-1 bg-text-muted/20 border border-text-muted/30 text-text rounded-lg py-2.5 text-sm font-mono hover:bg-text-muted/30 transition-colors">
                Dismiss alert
              </button>
              <button type="button" onClick={closeDismiss}
                      className="flex-1 border border-border text-text-muted rounded-lg py-2.5 text-sm hover:border-border-bright transition-colors font-mono">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

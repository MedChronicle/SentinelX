import { useState } from "react";
import { useApp } from "../context/AppContext";
import type { AlertStatus } from "../data/mockData";

export default function Alerts() {
  const { alerts, acknowledgeAlert, dismissAlert, escalateAlert, showToast, user } = useApp();
  const [filter, setFilter] = useState("All");
  const [dismissTarget, setDismissTarget] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");

  const canModify = user?.role === "Administrator" || user?.role === "Security Officer";

  const filtered = alerts.filter(a => filter === "All" || a.status === filter);

  function handleDismiss() {
    if (!dismissTarget || !dismissReason.trim()) { showToast({ type: "error", title: "Reason required for dismissal" }); return; }
    dismissAlert(dismissTarget, dismissReason);
    showToast({ type: "info", title: `Alert dismissed`, message: dismissReason });
    setDismissTarget(null);
    setDismissReason("");
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Alert Management</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">
            {alerts.filter(a => a.status === "Active").length} active · {alerts.filter(a => a.status === "Acknowledged").length} acknowledged · {alerts.filter(a => a.status === "Dismissed").length} dismissed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Active", "Acknowledged", "Dismissed", "Resolved"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${filter === f ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]" : "bg-[#0d1525] border-[#1e3058] text-[#4a6090] hover:border-[#2a4580]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Critical banner */}
      {alerts.filter(a => a.severity === "Critical" && a.status === "Active").length > 0 && (
        <div className="mb-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 flex items-center gap-4 glow-red">
          <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/40 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-[#ef4444] tracking-wide text-sm uppercase">
              {alerts.filter(a => a.severity === "Critical" && a.status === "Active").length} Critical Alerts Active
            </p>
            <p className="text-[#ef4444]/70 text-xs font-mono mt-0.5">Immediate action required — escalation protocols engaged</p>
          </div>
          <div className="status-dot status-dot-red flex-shrink-0" />
        </div>
      )}

      {/* Alert list */}
      <div className="space-y-3 mb-6">
        {filtered.length === 0 && (
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl flex flex-col items-center justify-center py-16">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d4a7a" strokeWidth="1.5" className="mb-3"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            <p className="text-[#2d4a7a] text-sm font-display">No alerts in this category</p>
          </div>
        )}
        {filtered.map(alert => {
          const sevColor = alert.severity === "Critical" ? "#ef4444" : alert.severity === "High" ? "#f59e0b" : "#7c3aed";
          const statusBg: Record<AlertStatus, string> = {
            Active: "#ef4444", Acknowledged: "#f59e0b", Dismissed: "#4a6090", Resolved: "#10b981",
          };
          const statusC = statusBg[alert.status] || "#4a6090";
          return (
            <div
              key={alert.id}
              className="bg-[#0d1525] rounded-xl p-5 transition-all"
              style={{
                border: `1px solid ${alert.status === "Active" ? sevColor + "40" : "#1e3058"}`,
                borderLeft: `3px solid ${sevColor}`,
                opacity: alert.status === "Dismissed" ? 0.55 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-[#4a6090]">{alert.id}</span>
                    <span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                    <span className="badge text-xs px-1.5" style={{ background: `${statusC}15`, color: statusC, border: `1px solid ${statusC}30` }}>
                      {alert.status}
                    </span>
                    {alert.status === "Active" && <span className="status-dot status-dot-red" />}
                  </div>
                  <p className="font-display font-semibold text-[#e2eaf8] tracking-wide text-sm mb-1">{alert.rule}</p>
                  <p className="text-[#4a6090] text-xs leading-relaxed">{alert.description}</p>
                  {alert.dismissReason && (
                    <p className="text-xs font-mono text-[#4a6090] mt-1 italic">Dismissed: {alert.dismissReason}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs font-mono text-[#4a6090]">
                    <span>Incident: <span className="text-[#00d4ff]">{alert.incident}</span></span>
                    <span>Time: {alert.time}</span>
                  </div>
                </div>
                {canModify && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {alert.status === "Active" && (
                      <>
                        <button onClick={() => { acknowledgeAlert(alert.id); showToast({ type: "info", title: "Alert acknowledged", message: alert.id }); }} className="px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] rounded-lg text-xs font-mono hover:bg-[#f59e0b]/20 transition-colors whitespace-nowrap">
                          Acknowledge
                        </button>
                        <button onClick={() => { escalateAlert(alert.id); }} className="px-3 py-1.5 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-lg text-xs font-mono hover:bg-[#ef4444]/20 transition-colors whitespace-nowrap">
                          Escalate
                        </button>
                        <button onClick={() => setDismissTarget(alert.id)} className="px-3 py-1.5 bg-[#4a6090]/10 border border-[#4a6090]/30 text-[#4a6090] rounded-lg text-xs font-mono hover:text-[#e2eaf8] hover:border-[#2a4580] transition-colors whitespace-nowrap">
                          Dismiss
                        </button>
                      </>
                    )}
                    {alert.status === "Acknowledged" && (
                      <>
                        <button onClick={() => { escalateAlert(alert.id); }} className="px-3 py-1.5 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-lg text-xs font-mono hover:bg-[#ef4444]/20 transition-colors whitespace-nowrap">
                          Escalate
                        </button>
                        <button onClick={() => setDismissTarget(alert.id)} className="px-3 py-1.5 bg-[#4a6090]/10 border border-[#4a6090]/30 text-[#4a6090] rounded-lg text-xs font-mono hover:text-[#e2eaf8] transition-colors whitespace-nowrap">
                          Dismiss
                        </button>
                      </>
                    )}
                    <button className="px-3 py-1.5 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] rounded-lg text-xs font-mono hover:bg-[#00d4ff]/20 transition-colors whitespace-nowrap">
                      View
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert rules panel */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e3058] flex items-center justify-between">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">Configured Alert Rules</h2>
          {canModify && (
            <button className="btn-primary rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Rule
            </button>
          )}
        </div>
        <div className="divide-y divide-[#1e3058]/50">
          {[
            { rule: "Critical incident → immediate escalation", trigger: "Severity = Critical", action: "Auto-escalate + notify admin", on: true },
            { rule: "Repeated location — elevated risk", trigger: "Same location ≥ 3 incidents in 24h", action: "Raise risk score + alert", on: true },
            { rule: "SLA exceeded — no assignment", trigger: "Unassigned incident > SLA threshold", action: "Alert + auto-assign queue", on: true },
            { rule: "ML anomaly cluster detected", trigger: "Isolation Forest confidence > 70%", action: "Generate alert + flag incidents", on: true },
            { rule: "High-risk zone monitoring", trigger: "Zone risk score > 70", action: "Continuous monitoring alert", on: false },
          ].map(r => (
            <div key={r.rule} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#111e35] transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.on ? "bg-[#10b981]" : "bg-[#4a6090]"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e2eaf8] font-medium">{r.rule}</p>
                <p className="text-xs font-mono text-[#4a6090] mt-0.5">Trigger: {r.trigger} · Action: {r.action}</p>
              </div>
              <span className={`text-xs font-mono ${r.on ? "text-[#10b981]" : "text-[#4a6090]"}`}>{r.on ? "Active" : "Disabled"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dismiss modal */}
      {dismissTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDismissTarget(null)}>
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-full max-w-sm animate-fade-up" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-white mb-1">Dismiss Alert</h2>
            <p className="text-xs font-mono text-[#4a6090] mb-4">{dismissTarget} · A reason is required and will be logged in the audit trail.</p>
            <textarea
              value={dismissReason}
              onChange={e => setDismissReason(e.target.value)}
              placeholder="Reason for dismissal (e.g. false positive, resolved offline)…"
              rows={3}
              className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono resize-none mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleDismiss} className="flex-1 bg-[#4a6090]/20 border border-[#4a6090]/30 text-[#e2eaf8] rounded-lg py-2.5 text-sm font-mono hover:bg-[#4a6090]/30 transition-colors">Confirm Dismiss</button>
              <button onClick={() => setDismissTarget(null)} className="flex-1 border border-[#1e3058] text-[#4a6090] rounded-lg py-2.5 text-sm hover:border-[#2a4580] transition-colors font-mono">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { alerts } from "../data/mockData";

export default function Alerts() {
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState(alerts);

  const filtered = items.filter(a => filter === "All" || a.status === filter);

  function acknowledge(id: string) {
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: "Acknowledged" } : a));
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Alert Management</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">
            {items.filter(a => a.status === "Active").length} active · {items.filter(a => a.status === "Acknowledged").length} acknowledged
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["All", "Active", "Acknowledged", "Resolved"].map(f => (
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

      {/* Active critical alert banner */}
      {items.filter(a => a.severity === "Critical" && a.status === "Active").length > 0 && (
        <div className="mb-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl p-4 flex items-center gap-4 glow-red">
          <div className="w-10 h-10 rounded-full bg-[#ef4444]/20 border border-[#ef4444]/40 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-[#ef4444] tracking-wide text-sm uppercase">
              {items.filter(a => a.severity === "Critical" && a.status === "Active").length} Critical Alerts Active
            </p>
            <p className="text-[#ef4444]/70 text-xs font-mono mt-0.5">Immediate action required — escalation protocols engaged</p>
          </div>
          <div className="status-dot status-dot-red flex-shrink-0" />
        </div>
      )}

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const sevColor = alert.severity === "Critical" ? "#ef4444" : alert.severity === "High" ? "#f59e0b" : "#7c3aed";
          const statusColor = alert.status === "Active" ? "#ef4444" : alert.status === "Acknowledged" ? "#f59e0b" : "#10b981";
          return (
            <div
              key={alert.id}
              className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 card-hover"
              style={{ borderLeft: `3px solid ${sevColor}` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-[#4a6090]">{alert.id}</span>
                    <span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                    <span className="badge" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                      {alert.status}
                    </span>
                  </div>
                  <p className="font-display font-semibold text-[#e2eaf8] tracking-wide text-sm mb-1">{alert.rule}</p>
                  <p className="text-[#4a6090] text-xs leading-relaxed">{alert.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs font-mono text-[#4a6090]">
                    <span>Incident: <span className="text-[#00d4ff]">{alert.incident}</span></span>
                    <span>Time: {alert.time}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {alert.status === "Active" && (
                    <button
                      onClick={() => acknowledge(alert.id)}
                      className="px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] rounded-lg text-xs font-mono hover:bg-[#f59e0b]/20 transition-colors whitespace-nowrap"
                    >
                      Acknowledge
                    </button>
                  )}
                  <button className="px-3 py-1.5 bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] rounded-lg text-xs font-mono hover:bg-[#00d4ff]/20 transition-colors whitespace-nowrap">
                    View Incident
                  </button>
                  {alert.severity === "Critical" && alert.status === "Active" && (
                    <button className="px-3 py-1.5 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-lg text-xs font-mono hover:bg-[#ef4444]/20 transition-colors whitespace-nowrap">
                      Escalate Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert rules panel */}
      <div className="mt-6 bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e3058] flex items-center justify-between">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">Configured Alert Rules</h2>
          <button className="btn-primary rounded-lg px-3 py-1.5 text-xs flex items-center gap-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Rule
          </button>
        </div>
        <div className="divide-y divide-[#1e3058]/50">
          {[
            { rule: "Critical incident → immediate escalation", trigger: "Severity = Critical", action: "Auto-escalate + notify admin", status: true },
            { rule: "Repeated location — elevated risk", trigger: "Same location ≥ 3 incidents in 24h", action: "Raise risk score + alert", status: true },
            { rule: "SLA exceeded — no assignment", trigger: "Unassigned incident > SLA threshold", action: "Alert + auto-assign queue", status: true },
            { rule: "ML anomaly cluster detected", trigger: "Isolation Forest confidence > 70%", action: "Generate alert + flag incidents", status: true },
            { rule: "High-risk zone monitoring", trigger: "Zone risk score > 70", action: "Continuous monitoring alert", status: false },
          ].map(r => (
            <div key={r.rule} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#111e35] transition-colors">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status ? "bg-[#10b981]" : "bg-[#4a6090]"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#e2eaf8] font-medium">{r.rule}</p>
                <p className="text-xs font-mono text-[#4a6090] mt-0.5">Trigger: {r.trigger} · Action: {r.action}</p>
              </div>
              <span className={`text-xs font-mono ${r.status ? "text-[#10b981]" : "text-[#4a6090]"}`}>{r.status ? "Active" : "Disabled"}</span>
              <button className="text-[#4a6090] hover:text-[#e2eaf8] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

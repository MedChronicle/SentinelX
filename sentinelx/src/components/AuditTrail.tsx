import { useState } from "react";
import { auditLogs } from "../data/mockData";

const ACTION_COLORS: Record<string, string> = {
  INCIDENT_CREATED: "#10b981",
  INCIDENT_ESCALATED: "#ef4444",
  INCIDENT_ASSIGNED: "#00d4ff",
  INCIDENT_STATUS_CHANGED: "#f59e0b",
  ALERT_GENERATED: "#f59e0b",
  USER_ROLE_MODIFIED: "#7c3aed",
  ML_PREDICTION_STORED: "#a78bfa",
};

export default function AuditTrail() {
  const [search, setSearch] = useState("");
  const [verifying, setVerifying] = useState<string | null>(null);

  const filtered = auditLogs.filter(log => {
    if (!search) return true;
    return log.user.includes(search) || log.action.includes(search.toUpperCase()) || log.entity.includes(search);
  });

  function verify(id: string) {
    setVerifying(id);
    setTimeout(() => setVerifying(null), 1200);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Audit Trail</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Tamper-evident hash chain · {auditLogs.length} entries today</p>
        </div>
        <div className="flex items-center gap-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z"/>
            <polyline points="9 12 11 14 15 10"/>
          </svg>
          <span className="text-[#10b981] text-xs font-mono">Chain Integrity: Verified</span>
        </div>
      </div>

      {/* Hash chain visual */}
      <div className="mb-5 bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
        <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide text-sm mb-3">Audit Hash Chain</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {auditLogs.slice(0, 6).map((log, i) => (
            <div key={log.id} className="flex items-center flex-shrink-0">
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => verify(log.id)}
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${verifying === log.id ? "bg-[#10b981]/20 border-[#10b981]" : "bg-[#070b14] border-[#1e3058] group-hover:border-[#2a4580]"}`}>
                  {verifying === log.id ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a6090" strokeWidth="1.8">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  )}
                </div>
                <span className="font-mono text-[8px] text-[#4a6090] mt-1">{log.hash}</span>
              </div>
              {i < 5 && (
                <div className="flex items-center mx-1 flex-shrink-0">
                  <div className="w-6 h-px bg-[#00d4ff]/30" />
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="#00d4ff" opacity={0.3}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center ml-2 text-[#2d4a7a] text-xs font-mono flex-shrink-0">···</div>
        </div>
        <p className="text-[#4a6090] text-xs font-mono mt-2">Click any block to verify hash integrity</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2.5 mb-4">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a6090" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by user, action, entity…"
          className="bg-transparent text-xs text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono flex-1"
        />
      </div>

      {/* Log table */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3058]">
                {["ID", "User", "Action", "Entity", "Previous", "New Value", "Hash", "IP", "Time"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#4a6090] text-xs font-mono uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const color = ACTION_COLORS[log.action] || "#4a6090";
                return (
                  <tr key={log.id} className="border-b border-[#1e3058]/50 hover:bg-[#111e35] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#4a6090] whitespace-nowrap">{log.id}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#e2eaf8] whitespace-nowrap">{log.user}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="badge text-xs px-1.5" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#00d4ff] whitespace-nowrap">{log.entity}</td>
                    <td className="px-4 py-3 text-xs text-[#4a6090] font-mono whitespace-nowrap">{log.prev}</td>
                    <td className="px-4 py-3 text-xs text-[#e2eaf8] font-mono whitespace-nowrap">{log.next}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#2d4a7a] whitespace-nowrap tracking-wider">{log.hash}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4a6090] whitespace-nowrap">{log.ip}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#4a6090] whitespace-nowrap">{log.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

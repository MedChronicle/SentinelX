import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";

const ACTION_COLORS: Record<string, string> = {
  INCIDENT_CREATED: "#10b981",
  INCIDENT_ESCALATED: "#ef4444",
  INCIDENT_ASSIGNED: "#00d4ff",
  INCIDENT_STATUS_CHANGED: "#f59e0b",
  ALERT_GENERATED: "#f59e0b",
  ALERT_ACKNOWLEDGED: "#00d4ff",
  ALERT_DISMISSED: "#4a6090",
  ALERT_ESCALATED: "#ef4444",
  USER_ROLE_MODIFIED: "#7c3aed",
  ML_PREDICTION_STORED: "#a78bfa",
};

export default function AuditTrail() {
  const { auditLogs } = useApp();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Hash chain verification
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; broken?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const ACTIONS = ["All", "INCIDENT_CREATED", "INCIDENT_ESCALATED", "INCIDENT_ASSIGNED", "INCIDENT_STATUS_CHANGED", "ALERT_GENERATED", "ALERT_ACKNOWLEDGED", "ALERT_DISMISSED", "USER_ROLE_MODIFIED", "ML_PREDICTION_STORED"];

  const filtered = useMemo(() => {
    return auditLogs.filter(log => {
      if (actionFilter !== "All" && log.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!log.user.toLowerCase().includes(q) && !log.action.toLowerCase().includes(q) && !log.entity.toLowerCase().includes(q)) return false;
      }
      if (dateFrom && log.time < dateFrom) return false;
      if (dateTo && log.time > dateTo + " 23:59") return false;
      return true;
    });
  }, [auditLogs, search, actionFilter, dateFrom, dateTo]);

  function verifyChain() {
    setVerifying(true);
    setVerifyResult(null);
    setTimeout(() => {
      // Walk chain: each log's prevHash should match the next log's hash
      let broken: string | undefined;
      for (let i = 0; i < auditLogs.length - 1; i++) {
        if (auditLogs[i].prevHash !== auditLogs[i + 1].hash) {
          broken = auditLogs[i].id;
          break;
        }
      }
      setVerifyResult({ ok: !broken, broken });
      setVerifying(false);
    }, 1200);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Audit Trail</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Tamper-evident hash chain · {auditLogs.length} entries</p>
        </div>
        <button
          onClick={verifyChain}
          disabled={verifying}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-mono border transition-all ${
            verifyResult?.ok === true ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
            : verifyResult?.ok === false ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444]"
            : "bg-[#0d1525] border-[#1e3058] text-[#4a6090] hover:border-[#2a4580]"
          }`}
        >
          {verifying ? (
            <><div className="w-3 h-3 rounded-full border border-t-[#00d4ff] border-[#1e3058] animate-spin" /> Verifying…</>
          ) : verifyResult?.ok === true ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Chain Valid</>
          ) : verifyResult?.ok === false ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Break at {verifyResult.broken}</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z"/></svg> Verify Chain Integrity</>
          )}
        </button>
      </div>

      {/* Hash chain visualization */}
      <div className="mb-5 bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
        <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide text-sm mb-3">Audit Hash Chain</h2>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {auditLogs.slice(0, 7).map((log, i) => {
            const isBroken = verifyResult?.broken === log.id;
            const color = isBroken ? "#ef4444" : verifyResult?.ok ? "#10b981" : "#4a6090";
            return (
              <div key={log.id} className="flex items-center flex-shrink-0">
                <div
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  title={`${log.id} — click to expand`}
                >
                  <div
                    className="w-11 h-11 rounded-xl border flex items-center justify-center transition-all group-hover:scale-110"
                    style={{
                      background: `${color}10`,
                      borderColor: `${color}40`,
                      boxShadow: verifyResult && !isBroken ? `0 0 8px ${color}30` : undefined,
                    }}
                  >
                    {isBroken ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    ) : verifyResult?.ok ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a6090" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    )}
                  </div>
                  <span className="font-mono text-[8px] mt-1" style={{ color }}>{log.hash}</span>
                </div>
                {i < 6 && (
                  <div className="flex items-center mx-0.5 flex-shrink-0">
                    <div className="w-5 h-px" style={{ background: isBroken ? "#ef4444" : "#1e3058" }} />
                    <svg width="6" height="6" viewBox="0 0 24 24" fill={isBroken ? "#ef4444" : "#2d4a7a"} opacity={0.6}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                )}
              </div>
            );
          })}
          <span className="text-[#2d4a7a] text-xs font-mono ml-2 flex-shrink-0">…{auditLogs.length - 7} more</span>
        </div>
        <p className="text-[#4a6090] text-xs font-mono mt-2">Click a block to inspect hash · Click "Verify Chain" to validate integrity</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <div className="col-span-2 flex items-center gap-2 bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a6090" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user, action, entity…" className="bg-transparent text-xs text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono w-full"/>
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none"/>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none"/>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none">
          {ACTIONS.map(a => <option key={a}>{a}</option>)}
        </select>
        <span className="text-[#4a6090] text-xs font-mono self-center">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3058]">
                {["ID", "User", "Action", "Entity", "Previous", "New Value", "Hash / PrevHash", "IP", "Time"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#4a6090] text-xs font-mono uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const color = ACTION_COLORS[log.action] || "#4a6090";
                const isExpanded = expanded === log.id;
                return (
                  <>
                    <tr key={log.id} onClick={() => setExpanded(isExpanded ? null : log.id)} className="border-b border-[#1e3058]/50 hover:bg-[#111e35] transition-colors cursor-pointer">
                      <td className="px-4 py-3 font-mono text-xs text-[#4a6090] whitespace-nowrap">{log.id}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[#e2eaf8] whitespace-nowrap max-w-[160px] truncate">{log.user}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="badge text-xs px-1.5" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#00d4ff] whitespace-nowrap">{log.entity}</td>
                      <td className="px-4 py-3 text-xs text-[#4a6090] font-mono whitespace-nowrap">{log.prev}</td>
                      <td className="px-4 py-3 text-xs text-[#e2eaf8] font-mono whitespace-nowrap max-w-[120px] truncate">{log.next}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-[#2d4a7a] whitespace-nowrap">
                        <span className="text-[#4a6090]">{log.hash}</span>
                        <span className="text-[#1e3058]"> ← {log.prevHash}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#4a6090] whitespace-nowrap">{log.ip}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#4a6090] whitespace-nowrap">{log.time}</td>
                    </tr>
                    {isExpanded && (
                      <tr key={log.id + "_exp"} className="border-b border-[#1e3058]/50 bg-[#070b14]">
                        <td colSpan={9} className="px-4 py-3">
                          <div className="font-mono text-xs space-y-1 text-[#4a6090]">
                            <p><span className="text-[#00d4ff]">hash:</span> {log.hash}</p>
                            <p><span className="text-[#2d4a7a]">prev_hash:</span> {log.prevHash}</p>
                            <p><span className="text-[#4a6090]">entity:</span> {log.entity} · action: {log.action} · ip: {log.ip}</p>
                            <p><span className="text-[#4a6090]">user:</span> {log.user} · time: {log.time}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

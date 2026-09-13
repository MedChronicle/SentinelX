import { useState } from "react";
import { incidents } from "../data/mockData";

const TYPES = ["All", "Unauthorized Access", "Network Security Alert", "Suspicious Activity", "Infrastructure Failure", "Environmental Risk", "Emergency — Medical"];
const SEVERITIES = ["All", "Critical", "High", "Moderate", "Low"];
const STATUSES = ["All", "Open", "Investigating", "Escalated", "Resolved", "Closed"];

export default function Incidents() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof incidents[0] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = incidents.filter(inc => {
    if (typeFilter !== "All" && inc.type !== typeFilter) return false;
    if (sevFilter !== "All" && inc.severity !== sevFilter) return false;
    if (statusFilter !== "All" && inc.status !== statusFilter) return false;
    if (search && !inc.id.toLowerCase().includes(search.toLowerCase()) && !inc.type.toLowerCase().includes(search.toLowerCase()) && !inc.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Incident Management</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">{filtered.length} incidents matching filters</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Incident
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2 bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 flex-1 min-w-48">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a6090" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, type, location…"
            className="bg-transparent text-xs text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono w-full"
          />
        </div>
        <select
          value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none"
        >
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select
          value={sevFilter} onChange={e => setSevFilter(e.target.value)}
          className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none"
        >
          {SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none"
        >
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e3058]">
                {["ID", "Type", "Location", "Severity", "Status", "Reporter", "Time", "Risk"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#4a6090] text-xs font-mono uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, i) => (
                <tr
                  key={inc.id}
                  onClick={() => setSelected(inc)}
                  className="border-b border-[#1e3058]/50 hover:bg-[#111e35] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#00d4ff] whitespace-nowrap">{inc.id}</td>
                  <td className="px-4 py-3 text-xs text-[#e2eaf8] whitespace-nowrap">{inc.type}</td>
                  <td className="px-4 py-3 text-xs text-[#4a6090] font-mono whitespace-nowrap max-w-[200px] truncate">{inc.location}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#4a6090] whitespace-nowrap">{inc.reporter}</td>
                  <td className="px-4 py-3 text-xs font-mono text-[#4a6090] whitespace-nowrap">{inc.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${inc.riskScore}%`,
                            background: inc.riskScore >= 76 ? "#ef4444" : inc.riskScore >= 51 ? "#f59e0b" : "#10b981",
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-[#e2eaf8]">{inc.riskScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-full max-w-lg animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="font-mono text-[#00d4ff] text-sm">{selected.id}</p>
                <h2 className="font-display text-xl font-bold text-white mt-0.5">{selected.type}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#4a6090] hover:text-[#e2eaf8] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Status", value: <span className={`badge badge-${selected.status.toLowerCase()}`}>{selected.status}</span> },
                { label: "Severity", value: <span className={`badge badge-${selected.severity.toLowerCase()}`}>{selected.severity}</span> },
                { label: "Location", value: selected.location },
                { label: "Reporter", value: selected.reporter },
                { label: "Assigned To", value: selected.assigned },
                { label: "Time Reported", value: selected.time },
                { label: "Risk Score", value: <span className="font-mono text-[#f59e0b]">{selected.riskScore} / 100</span> },
              ].map(f => (
                <div key={f.label} className="bg-[#070b14] rounded-lg p-3 border border-[#1e3058]">
                  <p className="text-[#4a6090] text-xs font-mono uppercase mb-1">{f.label}</p>
                  <div className="text-sm text-[#e2eaf8]">{f.value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-primary flex-1 rounded-lg py-2.5 text-sm">Update Status</button>
              <button className="flex-1 border border-[#ef4444]/30 text-[#ef4444] rounded-lg py-2.5 text-sm hover:bg-[#ef4444]/10 transition-colors font-display font-semibold tracking-wide uppercase text-xs">Escalate</button>
            </div>
          </div>
        </div>
      )}

      {/* New incident modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-full max-w-lg animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold text-white">Report New Incident</h2>
              <button onClick={() => setShowForm(false)} className="text-[#4a6090] hover:text-[#e2eaf8]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Incident Type", type: "select", options: TYPES.slice(1) },
                { label: "Location", type: "text", placeholder: "Building, floor, zone…" },
                { label: "Description", type: "textarea", placeholder: "Detailed description of the incident…" },
                { label: "Severity", type: "select", options: SEVERITIES.slice(1) },
                { label: "Evidence / Reference", type: "text", placeholder: "Camera ID, sensor ID, reference doc…" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">{f.label}</label>
                  {f.type === "select" ? (
                    <select className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] outline-none font-mono">
                      {(f.options as string[]).map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={f.placeholder}
                      className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1 rounded-lg py-2.5 text-sm" onClick={() => setShowForm(false)}>Submit Incident</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-[#1e3058] text-[#4a6090] rounded-lg py-2.5 text-sm hover:border-[#2a4580] hover:text-[#e2eaf8] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

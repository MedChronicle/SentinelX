import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { LOCATIONS, INCIDENT_TYPES, type Incident, type IncidentStatus, type Severity } from "../data/mockData";

const STATUSES: IncidentStatus[] = ["Open", "Investigating", "Escalated", "Resolved", "Closed"];
const SEVERITIES: Severity[] = ["Critical", "High", "Moderate", "Low"];
const OFFICERS = ["Lt. Kavita Nair", "Sgt. Rajan Mehta", "Off. Dev Patel", "Off. Neha Kapoor", "Eng. Suresh Kumar", "Medical Unit 1"];

function exportCSV(data: Incident[]) {
  const headers = ["ID", "Type", "Location", "Severity", "Status", "Reporter", "Assigned", "Time", "Risk Score"];
  const rows = data.map(i => [i.id, i.type, i.location, i.severity, i.status, i.reporter, i.assigned, i.time, i.riskScore]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "sentinelx_incidents.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function Incidents() {
  const { user, incidents, addIncident, updateIncidentStatus, updateIncidentAssignee, addComment, showToast } = useApp();
  const isReadOnly = user?.role === "Analyst";
  const isLimited = user?.role === "Staff" || user?.role === "Student";

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals
  const [selected, setSelected] = useState<Incident | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Detail panel state
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<IncidentStatus>("Open");
  const [newAssignee, setNewAssignee] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // New incident form
  const [form, setForm] = useState({ type: INCIDENT_TYPES[0], location: LOCATIONS[0], description: "", severity: "Moderate" as Severity, evidence: "" });

  const visibleIncidents = useMemo(() => {
    return incidents.filter(inc => {
      if (isLimited && inc.reporterEmail && inc.reporterEmail !== user?.email) {
        if (user?.role === "Student") return false;
      }
      return true;
    });
  }, [incidents, user, isLimited]);

  const filtered = useMemo(() => {
    return visibleIncidents.filter(inc => {
      if (typeFilter !== "All" && inc.type !== typeFilter) return false;
      if (sevFilter !== "All" && inc.severity !== sevFilter) return false;
      if (statusFilter !== "All" && inc.status !== statusFilter) return false;
      if (locationFilter !== "All" && inc.location !== locationFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!inc.id.toLowerCase().includes(q) && !inc.type.toLowerCase().includes(q) && !inc.location.toLowerCase().includes(q) && !inc.reporter.toLowerCase().includes(q)) return false;
      }
      if (dateFrom && inc.time < dateFrom) return false;
      if (dateTo && inc.time > dateTo + " 23:59") return false;
      return true;
    });
  }, [visibleIncidents, typeFilter, sevFilter, statusFilter, locationFilter, search, dateFrom, dateTo]);

  function handleSubmitIncident() {
    if (!form.description.trim()) { showToast({ type: "error", title: "Description required" }); return; }
    const now = new Date();
    const id = `INC-${2892 + incidents.length}`;
    const inc: Incident = {
      id,
      type: form.type,
      description: form.description,
      location: form.location,
      severity: form.severity,
      status: "Open",
      reporter: user?.name ?? "Unknown",
      reporterEmail: user?.email,
      assigned: "Unassigned",
      time: now.toISOString().slice(0, 16).replace("T", " "),
      riskScore: form.severity === "Critical" ? 85 : form.severity === "High" ? 65 : form.severity === "Moderate" ? 45 : 20,
      evidence: form.evidence,
      timeline: [{ time: now.toLocaleTimeString(), action: "Incident Created", by: user?.name ?? "Unknown" }],
      comments: [],
    };
    addIncident(inc);
    showToast({ type: "success", title: `Incident ${id} created`, message: `${form.type} at ${form.location} — Status: Open` });
    setShowForm(false);
    setForm({ type: INCIDENT_TYPES[0], location: LOCATIONS[0], description: "", severity: "Moderate", evidence: "" });
  }

  function handleStatusChange() {
    if (!selected) return;
    updateIncidentStatus(selected.id, newStatus, user?.name ?? "Unknown", statusNote || undefined);
    setSelected(prev => prev ? { ...prev, status: newStatus, timeline: [...prev.timeline, { time: new Date().toLocaleTimeString(), action: `Status → ${newStatus}`, by: user?.name ?? "Unknown", note: statusNote || undefined }] } : null);
    showToast({ type: "info", title: `${selected.id} updated`, message: `Status changed to ${newStatus}` });
    setStatusNote("");
  }

  function handleReassign() {
    if (!selected || !newAssignee) return;
    updateIncidentAssignee(selected.id, newAssignee, user?.name ?? "Unknown");
    setSelected(prev => prev ? { ...prev, assigned: newAssignee } : null);
    showToast({ type: "info", title: "Incident reassigned", message: `Assigned to ${newAssignee}` });
  }

  function handleAddComment() {
    if (!selected || !newComment.trim()) return;
    addComment(selected.id, user?.name ?? "Unknown", newComment);
    setSelected(prev => prev ? { ...prev, comments: [...prev.comments, { time: new Date().toLocaleTimeString(), author: user?.name ?? "Unknown", text: newComment }] } : null);
    setNewComment("");
  }

  const canModify = user?.role === "Administrator" || user?.role === "Security Officer";

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">
            {user?.role === "Student" ? "My Reports" : "Incident Management"}
          </h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">{filtered.length} incidents · {incidents.filter(i => i.status === "Open").length} open</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 border border-[#1e3058] text-[#4a6090] hover:text-[#e2eaf8] hover:border-[#2a4580] rounded-lg px-3 py-2 text-xs font-mono transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Report Incident
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <div className="col-span-2 flex items-center gap-2 bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a6090" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, type, location, reporter…" className="bg-transparent text-xs text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono w-full"/>
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none" title="From date"/>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none" title="To date"/>
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { label: "Type", value: typeFilter, set: setTypeFilter, opts: ["All", ...INCIDENT_TYPES] },
          { label: "Severity", value: sevFilter, set: setSevFilter, opts: ["All", ...SEVERITIES] },
          { label: "Status", value: statusFilter, set: setStatusFilter, opts: ["All", ...STATUSES] },
          { label: "Location", value: locationFilter, set: setLocationFilter, opts: ["All", ...LOCATIONS] },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)} className="bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none">
            {f.opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {(search || typeFilter !== "All" || sevFilter !== "All" || statusFilter !== "All" || locationFilter !== "All" || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setTypeFilter("All"); setSevFilter("All"); setStatusFilter("All"); setLocationFilter("All"); setDateFrom(""); setDateTo(""); }} className="px-3 py-2 text-xs font-mono text-[#ef4444] border border-[#ef4444]/20 rounded-lg hover:bg-[#ef4444]/10 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl flex flex-col items-center justify-center py-20">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2d4a7a" strokeWidth="1.5" className="mb-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p className="font-display font-semibold text-[#2d4a7a]">No incidents match your filters</p>
          <p className="text-xs font-mono text-[#1e3058] mt-1">Try adjusting search or filter criteria</p>
        </div>
      ) : (
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
                {filtered.map(inc => (
                  <tr key={inc.id} onClick={() => { setSelected(inc); setNewStatus(inc.status); setNewAssignee(inc.assigned); }} className="border-b border-[#1e3058]/50 hover:bg-[#111e35] cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#00d4ff] whitespace-nowrap">{inc.id}</td>
                    <td className="px-4 py-3 text-xs text-[#e2eaf8] whitespace-nowrap max-w-[160px] truncate">{inc.type}</td>
                    <td className="px-4 py-3 text-xs text-[#4a6090] font-mono whitespace-nowrap max-w-[180px] truncate">{inc.location}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status}</span></td>
                    <td className="px-4 py-3 text-xs text-[#4a6090] whitespace-nowrap max-w-[140px] truncate">{inc.reporter}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#4a6090] whitespace-nowrap">{inc.time}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${inc.riskScore}%`, background: inc.riskScore >= 76 ? "#ef4444" : inc.riskScore >= 51 ? "#f59e0b" : "#10b981" }}/>
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
      )}

      {/* Incident Detail Slide-Over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-xl bg-[#0d1525] border-l border-[#1e3058] overflow-y-auto animate-slide-in">
            <div className="sticky top-0 bg-[#0d1525] border-b border-[#1e3058] px-6 py-4 flex items-start justify-between z-10">
              <div>
                <p className="font-mono text-[#00d4ff] text-sm">{selected.id}</p>
                <h2 className="font-display text-xl font-bold text-white mt-0.5">{selected.type}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#4a6090] hover:text-[#e2eaf8] transition-colors mt-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Status", v: <span className={`badge badge-${selected.status.toLowerCase()}`}>{selected.status}</span> },
                  { l: "Severity", v: <span className={`badge badge-${selected.severity.toLowerCase()}`}>{selected.severity}</span> },
                  { l: "Location", v: selected.location },
                  { l: "Reporter", v: selected.reporter },
                  { l: "Assigned To", v: selected.assigned },
                  { l: "Risk Score", v: <span className="font-mono text-[#f59e0b] font-bold">{selected.riskScore} / 100</span> },
                  { l: "Time Reported", v: selected.time },
                  { l: "Evidence", v: selected.evidence || "None" },
                ].map(f => (
                  <div key={f.l} className="bg-[#070b14] rounded-lg p-3 border border-[#1e3058]">
                    <p className="text-[#4a6090] text-xs font-mono uppercase mb-1">{f.l}</p>
                    <div className="text-sm text-[#e2eaf8]">{f.v}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="bg-[#070b14] rounded-lg p-4 border border-[#1e3058]">
                <p className="text-[#4a6090] text-xs font-mono uppercase mb-2">Description</p>
                <p className="text-sm text-[#e2eaf8] leading-relaxed">{selected.description}</p>
              </div>

              {/* Status change — admin/officer only */}
              {canModify && (
                <div className="bg-[#070b14] rounded-lg p-4 border border-[#1e3058]">
                  <p className="text-[#4a6090] text-xs font-mono uppercase mb-3">Update Status</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => setNewStatus(s)} className={`badge cursor-pointer ${newStatus === s ? `badge-${s.toLowerCase()}` : "badge-closed opacity-50"}`}>{s}</button>
                    ))}
                  </div>
                  <input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Note (optional)…" className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono mb-2"/>
                  <button onClick={handleStatusChange} className="btn-primary rounded-lg px-4 py-2 text-xs">Apply Status Change</button>
                </div>
              )}

              {/* Reassign */}
              {canModify && (
                <div className="bg-[#070b14] rounded-lg p-4 border border-[#1e3058]">
                  <p className="text-[#4a6090] text-xs font-mono uppercase mb-3">Reassign Officer</p>
                  <div className="flex gap-2">
                    <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} className="flex-1 bg-[#0a1020] border border-[#1e3058] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] font-mono outline-none">
                      <option value="">-- Select Officer --</option>
                      {OFFICERS.map(o => <option key={o}>{o}</option>)}
                    </select>
                    <button onClick={handleReassign} className="btn-primary rounded-lg px-4 py-2 text-xs">Assign</button>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-[#4a6090] text-xs font-mono uppercase mb-3">Status Timeline</p>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-[#1e3058]" />
                  <div className="space-y-4 pl-8">
                    {selected.timeline.map((t, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-5 top-1 w-2 h-2 rounded-full bg-[#00d4ff] border-2 border-[#0d1525]" />
                        <p className="text-xs font-semibold text-[#e2eaf8]">{t.action}</p>
                        <p className="text-xs font-mono text-[#4a6090]">{t.time} · {t.by}</p>
                        {t.note && <p className="text-xs text-[#a78bfa] mt-0.5 italic">{t.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-[#4a6090] text-xs font-mono uppercase mb-3">Notes & Comments</p>
                <div className="space-y-3 mb-3">
                  {selected.comments.length === 0 && <p className="text-xs text-[#2d4a7a] font-mono">No comments yet.</p>}
                  {selected.comments.map((c, i) => (
                    <div key={i} className="bg-[#070b14] rounded-lg p-3 border border-[#1e3058]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-[#e2eaf8]">{c.author}</span>
                        <span className="text-xs font-mono text-[#4a6090]">{c.time}</span>
                      </div>
                      <p className="text-xs text-[#e2eaf8]">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddComment()} placeholder="Add a note…" className="flex-1 bg-[#070b14] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono"/>
                  <button onClick={handleAddComment} className="btn-primary rounded-lg px-3 py-2 text-xs">Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Incident Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-full max-w-lg animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Report Incident</h2>
                <p className="text-xs font-mono text-[#4a6090] mt-0.5">Reporting as {user?.name}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-[#4a6090] hover:text-[#e2eaf8]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Incident Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] outline-none font-mono">
                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Location *</label>
                <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] outline-none font-mono">
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Description *</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what happened, when, and any relevant details…" rows={3} className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono resize-none"/>
              </div>
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Severity (auto-suggested)</label>
                <div className="flex gap-2">
                  {SEVERITIES.map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, severity: s }))} className={`badge cursor-pointer flex-1 justify-center py-2 ${form.severity === s ? `badge-${s.toLowerCase()}` : "badge-closed opacity-40"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[#4a6090] text-xs font-mono uppercase block mb-1">Evidence / Reference (optional)</label>
                <div className="flex gap-2">
                  <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))} placeholder="Camera ID, sensor ref, document…" className="flex-1 bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2.5 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono"/>
                  <button className="border border-[#1e3058] text-[#4a6090] rounded-lg px-3 hover:border-[#2a4580] transition-colors text-xs font-mono">Upload</button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSubmitIncident} className="btn-primary flex-1 rounded-lg py-2.5 text-sm">Submit Incident</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-[#1e3058] text-[#4a6090] rounded-lg py-2.5 text-sm hover:border-[#2a4580] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

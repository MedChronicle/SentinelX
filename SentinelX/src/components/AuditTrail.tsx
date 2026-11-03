import { useState, useMemo, Fragment } from "react";
import { useApp } from "../context/AppContext";

const ACTION_COLORS: Record<string, string> = {
  INCIDENT_CREATED: "#10b981",
  INCIDENT_ESCALATED: "#ef4444",
  INCIDENT_ASSIGNED: "#00d4ff",
  INCIDENT_STATUS_CHANGED: "#f59e0b",
  ALERT_GENERATED: "#f59e0b",
  ALERT_ACKNOWLEDGED: "#00d4ff",
  ALERT_DISMISSED: "#64748b",
  ALERT_ESCALATED: "#ef4444",
  USER_ROLE_MODIFIED: "#a78bfa",
  ML_PREDICTION_STORED: "#c084fc",
};

const PAGE_SIZE = 15;

type AuditLog = {
  id: string;
  user: string;
  action: string;
  entity: string;
  prev: string;
  next: string;
  hash: string;
  prevHash: string;
  ip: string;
  time: string;
};

export default function AuditTrail() {
  const { auditLogs } = useApp();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [ipFilter, setIpFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [verifyResult, setVerifyResult] = useState<{
    ok: boolean;
    checked: number;
    errors: string[];
  } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const actions = useMemo(
    () => ["All", ...Array.from(new Set(auditLogs.map((log: AuditLog) => log.action)))],
    [auditLogs]
  );

  const users = useMemo(
    () => Array.from(new Set(auditLogs.map((log: AuditLog) => log.user))).sort(),
    [auditLogs]
  );

  const stats = useMemo(() => ({
    total: auditLogs.length,
    incidents: auditLogs.filter((log: AuditLog) => log.action.startsWith("INCIDENT")).length,
    alerts: auditLogs.filter((log: AuditLog) => log.action.startsWith("ALERT")).length,
    users: new Set(auditLogs.map((log: AuditLog) => log.user)).size,
    escalations: auditLogs.filter((log: AuditLog) => log.action.includes("ESCALATED")).length,
  }), [auditLogs]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...auditLogs]
      .filter((log: AuditLog) => {
        if (actionFilter !== "All" && log.action !== actionFilter) return false;
        if (userFilter !== "All" && log.user !== userFilter) return false;
        if (ipFilter && !log.ip.toLowerCase().includes(ipFilter.toLowerCase())) return false;

        if (query) {
          const searchable = [
            log.id, log.user, log.action, log.entity, log.prev, log.next,
            log.ip, log.hash, log.prevHash, log.time,
          ].join(" ").toLowerCase();

          if (!searchable.includes(query)) return false;
        }

        const timestamp = new Date(log.time).getTime();

        if (dateFrom) {
          const start = new Date(`${dateFrom}T00:00:00`).getTime();
          if (!Number.isNaN(timestamp) && timestamp < start) return false;
        }

        if (dateTo) {
          const end = new Date(`${dateTo}T23:59:59.999`).getTime();
          if (!Number.isNaN(timestamp) && timestamp > end) return false;
        }

        return true;
      })
      .sort((a: AuditLog, b: AuditLog) => {
        const aTime = new Date(a.time).getTime();
        const bTime = new Date(b.time).getTime();
        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [auditLogs, search, actionFilter, userFilter, ipFilter, dateFrom, dateTo, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleLogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setActionFilter("All");
    setUserFilter("All");
    setIpFilter("");
    setPage(1);
  }

  // Structural chain check only. For cryptographic verification, recompute
  // each digest on the backend using the original canonical event payload.
  function verifyChain() {
    setVerifying(true);
    setVerifyResult(null);

    const errors: string[] = [];

    // The original component displays newest-first logs. Each newer record's
    // prevHash should therefore match the following (older) record's hash.
    for (let i = 0; i < auditLogs.length; i++) {
      const current = auditLogs[i] as AuditLog;
      const older = auditLogs[i + 1] as AuditLog | undefined;

      if (!current.hash || !current.prevHash) {
        errors.push(`${current.id}: Missing hash data`);
      }

      if (older && current.prevHash !== older.hash) {
        errors.push(`${current.id}: Previous hash does not match ${older.id}`);
      }
    }

    setVerifyResult({
      ok: errors.length === 0,
      checked: auditLogs.length,
      errors,
    });
    setVerifying(false);
  }

  function exportCSV() {
    const headers = [
      "ID", "User", "Action", "Entity", "Previous", "New Value",
      "Hash", "Previous Hash", "IP", "Time",
    ];

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filtered.map((log: AuditLog) =>
      [
        log.id, log.user, log.action, log.entity, log.prev, log.next,
        log.hash, log.prevHash, log.ip, log.time,
      ].map(escapeCSV).join(",")
    );

    const csv = [headers.map(escapeCSV).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "SOC_Audit_Trail.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const statCards = [
    { label: "TOTAL EVENTS", value: stats.total, color: "#00d4ff" },
    { label: "INCIDENT EVENTS", value: stats.incidents, color: "#10b981" },
    { label: "ALERT EVENTS", value: stats.alerts, color: "#f59e0b" },
    { label: "UNIQUE USERS", value: stats.users, color: "#a78bfa" },
    { label: "ESCALATIONS", value: stats.escalations, color: "#ef4444" },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-[#070b14] p-5 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-wide">Audit Trail</h1>
            <span className="text-[9px] px-2 py-1 rounded border border-[#00d4ff]/30 text-[#00d4ff] bg-[#00d4ff]/10 font-mono">
              FORENSIC MODE
            </span>
          </div>
          <p className="text-[#647da5] text-xs mt-1 font-mono">
            Cryptographic audit monitoring · {auditLogs.length} records
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportCSV}
            disabled={filtered.length === 0}
            className="px-4 py-2.5 rounded-lg text-xs font-mono text-[#00d4ff] border border-[#00d4ff]/30 bg-[#00d4ff]/5 hover:bg-[#00d4ff]/10 disabled:opacity-40"
          >
            ↓ Export CSV
          </button>
          <button
            onClick={verifyChain}
            disabled={verifying || auditLogs.length === 0}
            className="px-4 py-2.5 rounded-lg text-xs font-mono text-white bg-[#142641] border border-[#28446c] hover:border-[#00d4ff] disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "⛨ Verify Integrity"}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-4 hover:border-[#34517e] transition-all"
          >
            <p className="text-[10px] text-[#647da5] font-mono tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold mt-2" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </p>
            <div className="h-1 rounded-full mt-3" style={{ background: `${stat.color}35` }} />
          </div>
        ))}
      </div>

      {/* Verification result */}
      {verifyResult && (
        <div className={`mb-6 p-4 rounded-xl border ${
          verifyResult.ok
            ? "bg-[#10b981]/5 border-[#10b981]/30"
            : "bg-[#ef4444]/5 border-[#ef4444]/30"
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className={`font-bold text-sm ${
                verifyResult.ok ? "text-[#10b981]" : "text-[#ef4444]"
              }`}>
                {verifyResult.ok ? "STRUCTURAL CHAIN CHECK PASSED" : "CHAIN INTEGRITY FAILURE"}
              </p>
              <p className="text-xs text-[#8295b5] mt-1 font-mono">
                {verifyResult.checked} records inspected · {verifyResult.errors.length} structural errors
              </p>
            </div>
            <button
              onClick={() => setVerifyResult(null)}
              className="text-xs text-[#647da5] hover:text-white"
            >
              Dismiss ×
            </button>
          </div>

          {verifyResult.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {verifyResult.errors.map((error, index) => (
                <p key={index} className="text-xs text-[#ef7777] font-mono">{error}</p>
              ))}
            </div>
          )}

          <p className="text-[10px] text-[#647da5] mt-3">
            This frontend check validates hash-link structure and field presence. It does not independently recalculate SHA-256 digests.
          </p>
        </div>
      )}

      {/* Hash chain visualization */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center mb-4 gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#e2eaf8]">Hash Chain Visualization</h2>
            <p className="text-[10px] text-[#647da5] mt-1">Record-to-record hash relationships</p>
          </div>
          <span className="text-[10px] text-[#647da5] font-mono">
            {Math.min(auditLogs.length, 8)} / {auditLogs.length}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-3">
          {auditLogs.slice(0, 8).map((log: AuditLog, index: number) => {
            const isBroken = verifyResult?.errors.some((error) => error.startsWith(`${log.id}:`));
            const color = isBroken ? "#ef4444" : verifyResult?.ok ? "#10b981" : "#00d4ff";

            return (
              <div key={log.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="flex flex-col items-center p-2 rounded-lg hover:bg-[#17243b]"
                  title={`Inspect ${log.id}`}
                >
                  <div
                    className="w-12 h-12 rounded-xl border flex items-center justify-center"
                    style={{ borderColor: `${color}60`, background: `${color}12` }}
                  >
                    <span style={{ color }} className="text-lg">{isBroken ? "✕" : "⬡"}</span>
                  </div>
                  <span className="text-[9px] font-mono mt-2 text-[#8295b5]">{log.id}</span>
                </button>
                {index !== Math.min(auditLogs.length, 8) - 1 && (
                  <span className="text-[#34517e]">⟶</span>
                )}
              </div>
            );
          })}
          {auditLogs.length === 0 && (
            <p className="text-xs text-[#647da5]">No hash records available.</p>
          )}
        </div>
        <p className="text-[10px] text-[#647da5]">
          Select a block to open its record details. Run integrity verification to inspect chain links.
        </p>
      </div>

      {/* Advanced filters */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xs font-bold text-white tracking-wider">ADVANCED FILTERS</h2>
          <button onClick={clearFilters} className="text-[10px] text-[#00d4ff] hover:text-white">
            Clear all filters ↺
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search all audit fields..."
            className="bg-[#070b14] border border-[#1e3058] rounded-lg p-3 text-xs text-white outline-none focus:border-[#00d4ff]"
          />
          <select
            value={actionFilter}
            onChange={(event) => { setActionFilter(event.target.value); setPage(1); }}
            className="bg-[#070b14] border border-[#1e3058] rounded-lg p-3 text-xs text-white outline-none"
          >
            {actions.map((action) => <option key={action} value={action}>{action}</option>)}
          </select>
          <select
            value={userFilter}
            onChange={(event) => { setUserFilter(event.target.value); setPage(1); }}
            className="bg-[#070b14] border border-[#1e3058] rounded-lg p-3 text-xs text-white outline-none"
          >
            <option value="All">All Users</option>
            {users.map((user) => <option key={user} value={user}>{user}</option>)}
          </select>
          <input
            value={ipFilter}
            onChange={(event) => { setIpFilter(event.target.value); setPage(1); }}
            placeholder="Filter by IP address..."
            className="bg-[#070b14] border border-[#1e3058] rounded-lg p-3 text-xs text-white outline-none focus:border-[#00d4ff]"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => { setDateFrom(event.target.value); setPage(1); }}
            className="bg-[#070b14] border border-[#1e3058] rounded-lg p-3 text-xs text-white outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => { setDateTo(event.target.value); setPage(1); }}
            className="bg-[#070b14] border border-[#1e3058] rounded-lg p-3 text-xs text-white outline-none"
          />
          <select
            value={sortOrder}
            onChange={(event) => { setSortOrder(event.target.value as "newest" | "oldest"); setPage(1); }}
            className="bg-[#070b14] border border-[#1e3058] rounded-lg p-3 text-xs text-white outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <p className="text-[10px] text-[#647da5] mt-3 font-mono">
          Showing {filtered.length} matching records
        </p>
      </div>

      {/* Audit records */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[#1e3058]">
          <h2 className="text-sm font-bold text-white">Audit Records</h2>
          <span className="text-[10px] text-[#647da5] font-mono">PAGE {page} / {totalPages}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead>
              <tr className="bg-[#101d32]">
                {["ID", "USER", "ACTION", "ENTITY", "PREVIOUS", "NEW VALUE", "HASH", "IP ADDRESS", "TIMESTAMP"].map((header) => (
                  <th key={header} className="text-left p-4 text-[10px] text-[#647da5] font-mono whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLogs.map((log: AuditLog) => {
                const color = ACTION_COLORS[log.action] || "#647da5";
                const isExpanded = expanded === log.id;

                return (
                  <Fragment key={log.id}>
                    <tr
                      onClick={() => setExpanded(isExpanded ? null : log.id)}
                      className="border-t border-[#1e3058]/60 hover:bg-[#142139] cursor-pointer transition-colors"
                    >
                      <td className="p-4 text-xs font-mono text-[#647da5]">{log.id}</td>
                      <td className="p-4 text-xs text-white">{log.user}</td>
                      <td className="p-4">
                        <span
                          className="text-[10px] px-2 py-1 rounded border whitespace-nowrap"
                          style={{ color, background: `${color}12`, borderColor: `${color}35` }}
                        >
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[#00d4ff]">{log.entity}</td>
                      <td className="p-4 text-xs text-[#647da5]">{log.prev}</td>
                      <td className="p-4 text-xs text-white">{log.next}</td>
                      <td className="p-4 text-[10px] font-mono text-[#8295b5]">{log.hash}</td>
                      <td className="p-4 text-xs text-[#647da5]">{log.ip}</td>
                      <td className="p-4 text-xs text-[#647da5] whitespace-nowrap">{log.time}</td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-t border-[#1e3058]/60 bg-[#070b14]">
                        <td colSpan={9} className="p-5">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div>
                              <p className="text-[10px] text-[#00d4ff] mb-3 font-mono">CRYPTOGRAPHIC DETAILS</p>
                              <p className="text-xs text-[#647da5] mb-2">Record Hash</p>
                              <p className="text-xs font-mono text-white break-all mb-4">{log.hash || "Not available"}</p>
                              <p className="text-xs text-[#647da5] mb-2">Previous Hash</p>
                              <p className="text-xs font-mono text-[#00d4ff] break-all">{log.prevHash || "Not available"}</p>
                            </div>

                            <div>
                              <p className="text-[10px] text-[#00d4ff] mb-3 font-mono">EVENT INFORMATION</p>
                              {[
                                ["Record ID", log.id],
                                ["Actor", log.user],
                                ["Action", log.action],
                                ["Entity", log.entity],
                                ["IP Address", log.ip],
                                ["Timestamp", log.time],
                                ["Previous Value", log.prev],
                                ["New Value", log.next],
                              ].map(([label, value]) => (
                                <div key={label} className="flex justify-between gap-4 border-b border-[#1e3058]/50 py-2">
                                  <span className="text-[10px] text-[#647da5]">{label}</span>
                                  <span className="text-[10px] text-white text-right break-all">{value || "—"}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {visibleLogs.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center p-12">
                    <p className="text-[#647da5] text-sm">No audit records found</p>
                    <button onClick={clearFilters} className="text-xs text-[#00d4ff] mt-3">
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center p-4 border-t border-[#1e3058] gap-3">
          <span className="text-[10px] text-[#647da5] font-mono">
            {filtered.length === 0
              ? "0 records"
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="px-3 py-2 text-xs rounded border border-[#1e3058] text-white disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="px-3 py-2 text-xs rounded border border-[#1e3058] text-white disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

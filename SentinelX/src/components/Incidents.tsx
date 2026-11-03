import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  LOCATIONS,
  INCIDENT_TYPES,
  type Incident,
  type IncidentStatus,
  type Severity,
} from "../data/mockData";

const STATUSES: IncidentStatus[] = [
  "Open",
  "Investigating",
  "Escalated",
  "Resolved",
  "Closed",
];

const SEVERITIES: Severity[] = ["Critical", "High", "Moderate", "Low"];

const OFFICERS = [
  "Lt. Kavita Nair",
  "Sgt. Rajan Mehta",
  "Off. Dev Patel",
  "Off. Neha Kapoor",
  "Eng. Suresh Kumar",
  "Medical Unit 1",
];

const PAGE_SIZE = 12;

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Moderate: "#f59e0b",
  Low: "#10b981",
};

function exportCSV(data: Incident[]) {
  const headers = [
    "ID",
    "Type",
    "Location",
    "Exact Location",
    "Severity",
    "Status",
    "Reporter",
    "Assigned",
    "Occurred",
    "Reported",
    "Risk Score",
    "Description",
  ];

  const escapeCell = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = data.map((incident) =>
    [
      incident.id,
      incident.type,
      incident.location,
      incident.locationDetail,
      incident.severity,
      incident.status,
      incident.reporter,
      incident.assigned,
      incident.occurredAt,
      incident.time,
      incident.riskScore,
      incident.description,
    ]
      .map(escapeCell)
      .join(","),
  );

  const csv = [
    headers.map(escapeCell).join(","),
    ...rows,
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "sentinelx_incidents.csv";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value?: string) {
  if (!value) return "Not provided";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function matchesDateRange(value: string, from: string, to: string) {
  // Incident.time is stored as "YYYY-MM-DD HH:mm", so lexical comparison
  // is safe for the normalized date format used by this application.
  const normalized = value.replace("T", " ").slice(0, 16);
  if (from && normalized < `${from} 00:00`) return false;
  if (to && normalized > `${to} 23:59`) return false;
  return true;
}

export default function Incidents() {
  const {
    user,
    incidents,
    addIncident,
    updateIncidentStatus,
    updateIncidentAssignee,
    addComment,
    showToast,
  } = useApp();

  const canModify =
    user?.role === "Administrator" || user?.role === "Security Officer";

  const isStudent = user?.role === "Student";

  // Search and filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "risk">("newest");
  const [page, setPage] = useState(1);

  // Detail panel and form visibility
  const [selected, setSelected] = useState<Incident | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Detail panel controls
  const [newComment, setNewComment] = useState("");
  const [newStatus, setNewStatus] = useState<IncidentStatus>("Open");
  const [newAssignee, setNewAssignee] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const emptyForm = {
    type: INCIDENT_TYPES[0],
    location: LOCATIONS[0],
    locationDetail: "",
    occurredAt: "",
    description: "",
    severity: "Moderate" as Severity,
    evidence: "",
    witnessInfo: "",
    contactPreference: "In-app updates" as NonNullable<
      Incident["contactPreference"]
    >,
    immediateDanger: false,
  };

  const [form, setForm] = useState(emptyForm);

  // Students only see incidents they personally submitted.
  const visibleIncidents = useMemo(() => {
    if (isStudent) {
      return incidents.filter(
        (incident) => incident.reporterEmail === user?.email,
      );
    }
    return incidents;
  }, [incidents, isStudent, user?.email]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return visibleIncidents
      .filter((incident) => {
        if (typeFilter !== "All" && incident.type !== typeFilter) return false;
        if (severityFilter !== "All" && incident.severity !== severityFilter) return false;
        if (statusFilter !== "All" && incident.status !== statusFilter) return false;
        if (locationFilter !== "All" && incident.location !== locationFilter) return false;
        if (assigneeFilter !== "All" && incident.assigned !== assigneeFilter) return false;

        if (query) {
          const searchable = [
            incident.id,
            incident.type,
            incident.location,
            incident.locationDetail,
            incident.reporter,
            incident.assigned,
            incident.description,
            incident.status,
            incident.severity,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!searchable.includes(query)) return false;
        }

        if (!matchesDateRange(incident.time, dateFrom, dateTo)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === "risk") return b.riskScore - a.riskScore;

        const aTime = new Date(a.time.replace(" ", "T")).getTime();
        const bTime = new Date(b.time.replace(" ", "T")).getTime();

        return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
      });
  }, [
    visibleIncidents,
    search,
    typeFilter,
    severityFilter,
    statusFilter,
    locationFilter,
    assigneeFilter,
    dateFrom,
    dateTo,
    sortOrder,
  ]);

  const stats = useMemo(() => {
    const open = visibleIncidents.filter((i) => i.status === "Open").length;
    const active = visibleIncidents.filter(
      (i) => i.status === "Investigating" || i.status === "Escalated",
    ).length;
    const critical = visibleIncidents.filter(
      (i) => i.severity === "Critical" && i.status !== "Resolved" && i.status !== "Closed",
    ).length;
    const resolved = visibleIncidents.filter(
      (i) => i.status === "Resolved" || i.status === "Closed",
    ).length;

    return {
      total: visibleIncidents.length,
      open,
      active,
      critical,
      resolved,
    };
  }, [visibleIncidents]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageIncidents = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const assignees = useMemo(
    () =>
      Array.from(new Set(visibleIncidents.map((incident) => incident.assigned)))
        .filter(Boolean)
        .sort(),
    [visibleIncidents],
  );

  // Keep an open detail panel synchronized with context updates.
  useEffect(() => {
    if (!selected) return;
    const latest = incidents.find((incident) => incident.id === selected.id);
    if (latest && latest !== selected) setSelected(latest);
    if (!latest) setSelected(null);
  }, [incidents, selected]);

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
    setSeverityFilter("All");
    setStatusFilter("All");
    setLocationFilter("All");
    setAssigneeFilter("All");
    setDateFrom("");
    setDateTo("");
    setSortOrder("newest");
    setPage(1);
  }

  function openIncident(incident: Incident) {
    setSelected(incident);
    setNewStatus(incident.status);
    setNewAssignee(incident.assigned);
    setStatusNote("");
    setNewComment("");
  }

  function handleSubmitIncident() {
    const description = form.description.trim();

    if (!form.occurredAt) {
      showToast({
        type: "error",
        title: "Occurrence time required",
        message: "Tell security when the incident happened.",
      });
      return;
    }

    if (new Date(form.occurredAt).getTime() > Date.now()) {
      showToast({
        type: "error",
        title: "Invalid occurrence time",
        message: "The incident time cannot be in the future.",
      });
      return;
    }

    if (!form.locationDetail.trim()) {
      showToast({
        type: "error",
        title: "Exact location required",
        message: "Add a room, floor, landmark, or zone.",
      });
      return;
    }

    if (description.length < 20) {
      showToast({
        type: "error",
        title: "More detail required",
        message: "Please enter at least 20 characters describing what happened.",
      });
      return;
    }

    const now = new Date();
    const nextNumber =
      Math.max(
        2891,
        ...incidents.map((incident) => Number(incident.id.replace(/\D/g, "")) || 0),
      ) + 1;

    const id = `INC-${nextNumber}`;
    const severity = form.immediateDanger ? "Critical" : form.severity;

    const newIncident: Incident = {
      id,
      type: form.type,
      description,
      location: form.location,
      locationDetail: form.locationDetail.trim(),
      occurredAt: form.occurredAt.replace("T", " "),
      severity,
      status: "Open",
      reporter: user?.name ?? "Unknown",
      reporterEmail: user?.email,
      assigned: "Unassigned",
      time: now.toISOString().slice(0, 16).replace("T", " "),
      riskScore:
        severity === "Critical"
          ? 90
          : severity === "High"
            ? 70
            : severity === "Moderate"
              ? 45
              : 20,
      evidence: form.evidence.trim() || undefined,
      witnessInfo: form.witnessInfo.trim() || undefined,
      contactPreference: form.contactPreference,
      immediateDanger: form.immediateDanger,
      timeline: [
        {
          time: now.toLocaleTimeString(),
          action: isStudent ? "Student report filed" : "Incident Created",
          by: user?.name ?? "Unknown",
          note: form.immediateDanger
            ? "Reporter indicated immediate danger."
            : undefined,
        },
      ],
      comments: [],
    };

    addIncident(newIncident);
    showToast({
      type: "success",
      title: `Incident ${id} created`,
      message: `${form.type} at ${form.location} — Status: Open`,
    });

    setShowForm(false);
    setForm(emptyForm);
    setPage(1);
    clearFilters();
  }

  function handleStatusChange() {
    if (!selected || !canModify) return;

    if (newStatus === selected.status && !statusNote.trim()) {
      showToast({
        type: "info",
        title: "No changes made",
        message: "Choose a different status or add a status note.",
      });
      return;
    }

    updateIncidentStatus(
      selected.id,
      newStatus,
      user?.name ?? "Unknown",
      statusNote.trim() || undefined,
    );

    showToast({
      type: "info",
      title: `${selected.id} updated`,
      message: `Status changed to ${newStatus}`,
    });

    setStatusNote("");
  }

  function handleReassign() {
    if (!selected || !newAssignee || !canModify) return;

    if (newAssignee === selected.assigned) {
      showToast({
        type: "info",
        title: "No reassignment needed",
        message: "This incident is already assigned to that officer.",
      });
      return;
    }

    updateIncidentAssignee(selected.id, newAssignee, user?.name ?? "Unknown");

    showToast({
      type: "success",
      title: "Incident reassigned",
      message: `Assigned to ${newAssignee}`,
    });
  }

  function handleAddComment() {
    const comment = newComment.trim();
    if (!selected || !comment) return;

    addComment(selected.id, user?.name ?? "Unknown", comment);
    setNewComment("");
  }

  const statCards = [
    { label: "TOTAL REPORTS", value: stats.total, color: "#00d4ff", icon: "▤" },
    { label: "OPEN", value: stats.open, color: "#f59e0b", icon: "◷" },
    { label: "IN PROGRESS", value: stats.active, color: "#a78bfa", icon: "◉" },
    { label: "ACTIVE CRITICAL", value: stats.critical, color: "#ef4444", icon: "!" },
    { label: "RESOLVED / CLOSED", value: stats.resolved, color: "#10b981", icon: "✓" },
  ];

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-[#070b14] p-5 lg:p-8">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">
              {isStudent ? "My Reports" : "Incident Management"}
            </h1>
            <span className="rounded border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-2 py-1 text-[9px] font-mono text-[#00d4ff]">
              {isStudent ? "REPORTER VIEW" : "OPERATIONS CONSOLE"}
            </span>
          </div>
          <p className="mt-1 text-xs font-mono text-[#647da5]">
            {filtered.length} matching {isStudent ? "reports" : "incidents"} · {stats.open} currently open
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg border border-[#1e3058] px-3 py-2.5 text-xs font-mono text-[#8295b5] transition-colors hover:border-[#2a4580] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV ({filtered.length})
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Report Incident
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#1e3058] bg-[#0d1525] p-4 transition-colors hover:border-[#34517e]"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[9px] font-mono tracking-wider text-[#647da5]">
                {stat.label}
              </p>
              <span className="text-sm" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-bold" style={{ color: stat.color }}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <section className="mb-5 rounded-xl border border-[#1e3058] bg-[#0d1525] p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-white">SEARCH & FILTERS</h2>
            <p className="mt-1 text-[10px] font-mono text-[#647da5]">
              Narrow incidents by category, ownership, status, risk, and date.
            </p>
          </div>
          <button
            onClick={clearFilters}
            className="text-[10px] font-mono text-[#00d4ff] transition-colors hover:text-white"
          >
            Reset filters ↺
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Search ID, description, reporter..."
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#40577d] focus:border-[#00d4ff]"
          />

          <select
            value={typeFilter}
            onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
          >
            <option value="All">All incident types</option>
            {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>

          <select
            value={severityFilter}
            onChange={(event) => { setSeverityFilter(event.target.value); setPage(1); }}
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
          >
            <option value="All">All severity levels</option>
            {SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
          >
            <option value="All">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>

          <select
            value={locationFilter}
            onChange={(event) => { setLocationFilter(event.target.value); setPage(1); }}
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
          >
            <option value="All">All locations</option>
            {LOCATIONS.map((location) => <option key={location} value={location}>{location}</option>)}
          </select>

          {!isStudent && (
            <select
              value={assigneeFilter}
              onChange={(event) => { setAssigneeFilter(event.target.value); setPage(1); }}
              className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
            >
              <option value="All">All assigned officers</option>
              {assignees.map((assignee) => <option key={assignee} value={assignee}>{assignee}</option>)}
            </select>
          )}

          <input
            type="date"
            aria-label="Reported from date"
            value={dateFrom}
            onChange={(event) => { setDateFrom(event.target.value); setPage(1); }}
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
          />

          <input
            type="date"
            aria-label="Reported to date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => { setDateTo(event.target.value); setPage(1); }}
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
          />

          <select
            value={sortOrder}
            onChange={(event) => { setSortOrder(event.target.value as typeof sortOrder); setPage(1); }}
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none"
          >
            <option value="newest">Newest reported</option>
            <option value="oldest">Oldest reported</option>
            <option value="risk">Highest risk first</option>
          </select>
        </div>
      </section>

      {/* Incident table */}
      <section className="overflow-hidden rounded-xl border border-[#1e3058] bg-[#0d1525]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e3058] p-4">
          <div>
            <h2 className="text-sm font-bold text-white">Incident Register</h2>
            <p className="mt-1 text-[10px] font-mono text-[#647da5]">
              Select a record to inspect its history and available actions.
            </p>
          </div>
          <span className="rounded-md border border-[#1e3058] px-2.5 py-1.5 text-[10px] font-mono text-[#8295b5]">
            {filtered.length} RECORDS
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#34517e" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="mt-4 font-display font-semibold text-[#8295b5]">
              No incidents match your filters
            </p>
            <p className="mt-1 text-xs font-mono text-[#4a6090]">
              Try changing your search or filter criteria.
            </p>
            <button onClick={clearFilters} className="mt-4 text-xs text-[#00d4ff] hover:text-white">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="border-b border-[#1e3058] bg-[#101d32]">
                  {["INCIDENT", "TYPE / LOCATION", "SEVERITY", "STATUS", "REPORTER", "ASSIGNED TO", "REPORTED", "RISK"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-mono tracking-wider text-[#647da5]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageIncidents.map((incident) => {
                  const severityColor = SEVERITY_COLORS[incident.severity];

                  return (
                    <tr
                      key={incident.id}
                      onClick={() => openIncident(incident)}
                      className="cursor-pointer border-b border-[#1e3058]/60 transition-colors hover:bg-[#142139]"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="font-mono text-xs font-semibold text-[#00d4ff]">{incident.id}</p>
                        {incident.immediateDanger && (
                          <span className="mt-1 inline-block text-[9px] font-mono text-[#ef7777]">
                            IMMEDIATE DANGER
                          </span>
                        )}
                      </td>

                      <td className="max-w-[220px] px-4 py-3">
                        <p className="truncate text-xs text-[#e2eaf8]">{incident.type}</p>
                        <p className="mt-1 truncate text-[10px] font-mono text-[#647da5]">
                          {incident.location}{incident.locationDetail ? ` · ${incident.locationDetail}` : ""}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className="rounded border px-2 py-1 text-[10px] font-mono"
                          style={{
                            color: severityColor,
                            background: `${severityColor}12`,
                            borderColor: `${severityColor}40`,
                          }}
                        >
                          {incident.severity}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`badge badge-${incident.status.toLowerCase()}`}>
                          {incident.status}
                        </span>
                      </td>

                      <td className="max-w-[140px] truncate px-4 py-3 text-xs text-[#8295b5]">
                        {incident.reporter}
                      </td>

                      <td className="max-w-[150px] truncate px-4 py-3 text-xs text-[#8295b5]">
                        {incident.assigned}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-[10px] font-mono text-[#647da5]">
                        {incident.time}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#1e3058]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, incident.riskScore))}%`,
                                background: incident.riskScore >= 76
                                  ? "#ef4444"
                                  : incident.riskScore >= 51
                                    ? "#f59e0b"
                                    : "#10b981",
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-[#e2eaf8]">
                            {incident.riskScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1e3058] p-4">
            <p className="text-[10px] font-mono text-[#647da5]">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-[#1e3058] px-3 py-2 text-xs text-white transition-colors hover:border-[#00d4ff] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ← Previous
              </button>
              <span className="px-2 text-[10px] font-mono text-[#8295b5]">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-lg border border-[#1e3058] px-3 py-2 text-xs text-white transition-colors hover:border-[#00d4ff] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Incident detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Close incident details"
            className="flex-1 cursor-default bg-black/60 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />

          <aside className="animate-slide-in flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-[#1e3058] bg-[#0d1525] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#1e3058] bg-[#0d1525]/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="font-mono text-sm text-[#00d4ff]">{selected.id}</p>
                <h2 className="mt-0.5 font-display text-xl font-bold text-white">
                  {selected.type}
                </h2>
                <p className="mt-1 text-[10px] font-mono text-[#647da5]">
                  Reported {formatDate(selected.time)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-[#647da5] transition-colors hover:bg-[#17243b] hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* Incident overview */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[10px] font-mono tracking-wider text-[#00d4ff]">INCIDENT OVERVIEW</h3>
                  <span className="text-[10px] font-mono text-[#647da5]">RISK {selected.riskScore}/100</span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[
                    ["Status", selected.status],
                    ["Severity", selected.severity],
                    ["Location", selected.location],
                    ["Exact Location", selected.locationDetail || "Not provided"],
                    ["Reporter", selected.reporter],
                    ["Reporter Email", selected.reporterEmail || "Not available"],
                    ["Assigned To", selected.assigned],
                    ["Time Reported", formatDate(selected.time)],
                    ["Time Occurred", formatDate(selected.occurredAt)],
                    ["Contact Preference", selected.contactPreference || "Not specified"],
                    ["Witnesses", selected.witnessInfo || "None reported"],
                    ["Evidence Reference", selected.evidence || "None attached"],
                    ["Immediate Danger", selected.immediateDanger ? "Yes — priority response" : "No"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[#1e3058] bg-[#070b14] p-3">
                      <p className="mb-1 text-[9px] font-mono uppercase tracking-wider text-[#647da5]">{label}</p>
                      <p className="break-words text-xs text-[#e2eaf8]">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Description */}
              <section className="rounded-lg border border-[#1e3058] bg-[#070b14] p-4">
                <h3 className="mb-2 text-[10px] font-mono tracking-wider text-[#00d4ff]">INCIDENT DESCRIPTION</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#d5deed]">
                  {selected.description}
                </p>
              </section>

              {/* Status and assignment controls */}
              {canModify && (
                <>
                  <section className="rounded-lg border border-[#1e3058] bg-[#070b14] p-4">
                    <h3 className="mb-3 text-[10px] font-mono tracking-wider text-[#00d4ff]">UPDATE INCIDENT STATUS</h3>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => setNewStatus(status)}
                          className={`rounded-lg border px-3 py-2 text-[10px] font-mono transition-colors ${
                            newStatus === status
                              ? "border-[#00d4ff]/50 bg-[#00d4ff]/10 text-[#00d4ff]"
                              : "border-[#1e3058] text-[#8295b5] hover:border-[#34517e]"
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <input
                      value={statusNote}
                      onChange={(event) => setStatusNote(event.target.value)}
                      placeholder="Add an audit note for this change (optional)..."
                      className="mb-3 w-full rounded-lg border border-[#1e3058] bg-[#0a1020] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#40577d] focus:border-[#00d4ff]"
                    />
                    <button
                      onClick={handleStatusChange}
                      disabled={newStatus === selected.status && !statusNote.trim()}
                      className="btn-primary rounded-lg px-4 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Apply Status Update
                    </button>
                  </section>

                  <section className="rounded-lg border border-[#1e3058] bg-[#070b14] p-4">
                    <h3 className="mb-3 text-[10px] font-mono tracking-wider text-[#00d4ff]">ASSIGNMENT MANAGEMENT</h3>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={newAssignee}
                        onChange={(event) => setNewAssignee(event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-[#1e3058] bg-[#0a1020] px-3 py-2.5 text-xs text-white outline-none"
                      >
                        <option value="">Select an officer</option>
                        <option value="Unassigned">Unassigned</option>
                        {OFFICERS.map((officer) => (
                          <option key={officer} value={officer}>{officer}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleReassign}
                        disabled={!newAssignee || newAssignee === selected.assigned}
                        className="btn-primary rounded-lg px-4 py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Assign Officer
                      </button>
                    </div>
                  </section>
                </>
              )}

              {/* Timeline */}
              <section>
                <h3 className="mb-4 text-[10px] font-mono tracking-wider text-[#00d4ff]">INCIDENT ACTIVITY TIMELINE</h3>
                {selected.timeline.length === 0 ? (
                  <p className="text-xs text-[#647da5]">No timeline events recorded.</p>
                ) : (
                  <div className="relative">
                    <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[#1e3058]" />
                    <div className="space-y-5">
                      {selected.timeline.map((event, index) => (
                        <div key={`${event.time}-${index}`} className="relative flex gap-4">
                          <span className="z-[1] mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#00d4ff] bg-[#0d1525]" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#e2eaf8]">{event.action}</p>
                            <p className="mt-1 text-[10px] font-mono text-[#647da5]">
                              {event.time} · {event.by}
                            </p>
                            {event.note && (
                              <p className="mt-1 text-xs italic text-[#a78bfa]">{event.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Comments */}
              <section>
                <h3 className="mb-3 text-[10px] font-mono tracking-wider text-[#00d4ff]">NOTES & COMMENTS</h3>
                <div className="mb-3 space-y-2">
                  {selected.comments.length === 0 && (
                    <p className="text-xs text-[#647da5]">No comments have been added yet.</p>
                  )}
                  {selected.comments.map((comment, index) => (
                    <div key={`${comment.time}-${index}`} className="rounded-lg border border-[#1e3058] bg-[#070b14] p-3">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#e2eaf8]">{comment.author}</span>
                        <span className="text-[10px] font-mono text-[#647da5]">{comment.time}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-xs text-[#c5d1e5]">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleAddComment();
                    }}
                    placeholder="Add an internal note or update..."
                    className="min-w-0 flex-1 rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#40577d] focus:border-[#00d4ff]"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="btn-primary rounded-lg px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Post
                  </button>
                </div>
              </section>

              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-lg border border-[#1e3058] py-2.5 text-xs text-[#8295b5] transition-colors hover:border-[#34517e] hover:text-white"
              >
                Close incident details
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* New incident modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowForm(false)}
        >
          <div
            className="animate-fade-up max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1e3058] bg-[#0d1525] p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {isStudent ? "File a Safety Report" : "Report Incident"}
                </h2>
                <p className="mt-1 text-xs font-mono text-[#647da5]">
                  Reporting as {user?.name ?? "Unknown"} · Required fields marked *
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded-lg p-2 text-[#647da5] hover:bg-[#17243b] hover:text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">Incident Type *</label>
                  <select
                    value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                    className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00d4ff]"
                  >
                    {INCIDENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">Location *</label>
                  <select
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00d4ff]"
                  >
                    {LOCATIONS.map((location) => <option key={location} value={location}>{location}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">Exact Location *</label>
                  <input
                    value={form.locationDetail}
                    onChange={(event) => setForm((current) => ({ ...current, locationDetail: event.target.value }))}
                    placeholder="Room, floor, landmark, zone..."
                    className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#40577d] focus:border-[#00d4ff]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">When It Happened *</label>
                  <input
                    type="datetime-local"
                    max={new Date().toISOString().slice(0, 16)}
                    value={form.occurredAt}
                    onChange={(event) => setForm((current) => ({ ...current, occurredAt: event.target.value }))}
                    className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00d4ff]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">Description * (minimum 20 characters)</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Describe what happened, when it happened, and any relevant details..."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs leading-relaxed text-white outline-none placeholder:text-[#40577d] focus:border-[#00d4ff]"
                />
                <p className="mt-1 text-right text-[10px] font-mono text-[#647da5]">
                  {form.description.trim().length} / 20 minimum
                </p>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-mono uppercase text-[#8295b5]">Severity estimate</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SEVERITIES.map((severity) => {
                    const color = SEVERITY_COLORS[severity];
                    const active = form.severity === severity;

                    return (
                      <button
                        key={severity}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, severity }))}
                        className="rounded-lg border px-3 py-2.5 text-xs font-mono transition-colors"
                        style={{
                          color: active ? color : "#8295b5",
                          borderColor: active ? `${color}70` : "#1e3058",
                          background: active ? `${color}12` : "#070b14",
                        }}
                      >
                        {severity}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                form.immediateDanger
                  ? "border-[#ef4444]/40 bg-[#ef4444]/10"
                  : "border-[#1e3058] bg-[#070b14]"
              }`}>
                <input
                  type="checkbox"
                  checked={form.immediateDanger}
                  onChange={(event) => setForm((current) => ({ ...current, immediateDanger: event.target.checked }))}
                  className="mt-0.5 accent-red-500"
                />
                <span>
                  <span className="block text-xs font-semibold text-white">Immediate danger or medical help needed</span>
                  <span className="mt-1 block text-[10px] text-[#8295b5]">
                    This marks the report as Critical. For an active emergency, contact campus security immediately.
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">Witnesses (optional)</label>
                  <input
                    value={form.witnessInfo}
                    onChange={(event) => setForm((current) => ({ ...current, witnessInfo: event.target.value }))}
                    placeholder="Names or relevant details..."
                    className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#40577d] focus:border-[#00d4ff]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">Contact Preference</label>
                  <select
                    value={form.contactPreference}
                    onChange={(event) => setForm((current) => ({
                      ...current,
                      contactPreference: event.target.value as NonNullable<Incident["contactPreference"]>,
                    }))}
                    className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none focus:border-[#00d4ff]"
                  >
                    <option>In-app updates</option>
                    <option>Email</option>
                    <option>Phone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-mono uppercase text-[#8295b5]">Evidence / Reference (optional)</label>
                <div className="flex gap-2">
                  <input
                    value={form.evidence}
                    onChange={(event) => setForm((current) => ({ ...current, evidence: event.target.value }))}
                    placeholder="Camera ID, sensor reference, document..."
                    className="min-w-0 flex-1 rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#40577d] focus:border-[#00d4ff]"
                  />
                  <label className="cursor-pointer rounded-lg border border-[#1e3058] px-3 py-2.5 text-xs text-[#8295b5] transition-colors hover:border-[#34517e] hover:text-white">
                    Attach
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.txt"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          setForm((current) => ({
                            ...current,
                            evidence: file.name,
                          }));
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="mt-1 text-[10px] text-[#647da5]">
                  This records the selected filename only; it does not upload the file to a server.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-[#1e3058] py-2.5 text-xs text-[#8295b5] transition-colors hover:border-[#34517e] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitIncident}
                disabled={
                  !form.occurredAt ||
                  !form.locationDetail.trim() ||
                  form.description.trim().length < 20
                }
                className="btn-primary flex-1 rounded-lg py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit Incident Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

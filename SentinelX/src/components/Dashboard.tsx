import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  stats,
  trendData,
  incidentTypeData,
  locationRiskData,
} from "../data/mockData";

const COLORS = {
  cyan: "#00d4ff",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#a78bfa",
  panel: "#0d1525",
  border: "#1e3058",
  muted: "#4a6090",
  text: "#e2eaf8",
};

const VIT_CAMPUS_ZONES = [
  { name: "Main Gate", short: "MG", x: 10, y: 48, risk: "Low", detail: "Entry operating normally" },
  { name: "SJT & Technology Tower", short: "SJT", x: 34, y: 25, risk: "Moderate", detail: "Heavy pedestrian movement" },
  { name: "Greenos Food Court", short: "GF", x: 48, y: 46, risk: "High", detail: "Slippery surface reported" },
  { name: "Main Building", short: "MB", x: 66, y: 29, risk: "Low", detail: "No active hazard" },
  { name: "Central Library", short: "CL", x: 72, y: 54, risk: "Moderate", detail: "Maintenance near east aisle" },
  { name: "Men's Hostel Zone", short: "MH", x: 28, y: 74, risk: "High", detail: "Road diversion after 20:00" },
  { name: "Ladies Hostel Zone", short: "LH", x: 57, y: 78, risk: "Low", detail: "Patrol active" },
  { name: "Outdoor Stadium", short: "OS", x: 86, y: 72, risk: "Moderate", detail: "Event crowd expected" },
] as const;

const CAMPUS_EVENTS = [
  { time: "Current advisory", title: "Wet-floor response", place: "Greenos Food Court", level: "High", note: "Use the north-side entrance until cleaning is complete." },
  { time: "18:00–21:00", title: "Student activity crowd", place: "Outdoor Stadium", level: "Moderate", note: "Expect congestion on the stadium approach road." },
  { time: "After 20:00", title: "Service-road diversion", place: "Men's Hostel Zone", level: "High", note: "Pedestrians should use the illuminated central walkway." },
] as const;

type RiskLevel = "Low" | "Moderate" | "High";
type DashboardProps = { onNavigate?: (page: string) => void };

const riskTone = (risk: string) =>
  risk === "Critical" || risk === "High"
    ? COLORS.red
    : risk === "Moderate" || risk === "Medium"
      ? COLORS.amber
      : COLORS.green;

const badgeClass = (value: string) =>
  `badge badge-${String(value).toLowerCase().replace(/\s+/g, "-")}`;

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-xl border border-[#1e3058] bg-[#0d1525] ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#1e3058] px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display font-semibold tracking-wide text-[#e2eaf8]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[#4a6090]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-hover rounded-xl border border-[#1e3058] bg-[#0d1525] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#315080]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${color}15`, border: `1px solid ${color}35` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        {sub && <span className="text-right text-xs text-[#4a6090]">{sub}</span>}
      </div>
      <div className="mb-1 font-display text-3xl font-bold leading-none text-white">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-[#4a6090]">{label}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#1e3058] bg-[#0d1525] p-3 text-xs shadow-xl">
      <p className="mb-1 font-mono text-[#4a6090]">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey ?? item.name} className="font-mono" style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

function SafetyScore({ score, label }: { score: number; label: string }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const tone = safeScore >= 76 ? COLORS.red : safeScore >= 51 ? COLORS.amber : COLORS.green;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="flex flex-col items-center text-center">
      <p className="mb-3 text-xs uppercase tracking-wider text-[#4a6090]">{label}</p>
      <div className="relative mb-3 h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-label={`Score ${safeScore} out of 100`}>
          <circle cx="50" cy="50" r="42" stroke="#1e3058" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="42"
            stroke={tone}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(safeScore / 100) * circumference} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 6px ${tone})`, transition: "stroke-dasharray 500ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-bold" style={{ color: tone }}>{safeScore}</span>
          <span className="font-mono text-xs text-[#4a6090]">/ 100</span>
        </div>
      </div>
      <span className={badgeClass(safeScore >= 76 ? "critical" : safeScore >= 51 ? "moderate" : "resolved")}>
        {safeScore >= 76 ? "HIGH RISK" : safeScore >= 51 ? "MODERATE RISK" : "LOW RISK"}
      </span>
    </div>
  );
}

function StudentDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, incidents } = useApp();
  const [selectedZone, setSelectedZone] = useState<(typeof VIT_CAMPUS_ZONES)[number] | null>(null);

  const myReports = useMemo(
    () => incidents.filter((incident) => incident.reporterEmail === user?.email),
    [incidents, user?.email],
  );
  const resolved = myReports.filter((incident) =>
    ["Resolved", "Closed"].includes(incident.status),
  ).length;
  const openReports = myReports.filter((incident) =>
    ["Open", "In Progress", "Assigned"].includes(incident.status),
  ).length;
  const score = Math.min(100, myReports.length * 15 + resolved * 10);

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#070b14] p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#00d4ff]">SentinelX / Student Portal</p>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">
            Welcome, {user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="mt-1 text-xs text-[#4a6090]">Your campus safety activity at a glance</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-2">
          <span className="status-dot status-dot-green" />
          <span className="font-mono text-xs text-[#10b981]">Student portal active</span>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="flex flex-col items-center justify-center rounded-xl border border-[#1e3058] bg-gradient-to-br from-[#0d1525] to-[#111e35] p-6">
          <SafetyScore score={score} label="Safety participation score" />
          <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-[#4a6090]">
            This participation indicator is based on reports you have submitted and reports that have been resolved.
          </p>
        </section>
        <div className="grid grid-cols-2 gap-3 lg:col-span-2">
          <StatCard label="Reports filed" value={myReports.length} sub="Your submissions" color={COLORS.cyan}
            icon={<span className="text-lg">▤</span>} />
          <StatCard label="Resolved" value={resolved} sub="Closed or resolved" color={COLORS.green}
            icon={<span className="text-lg">✓</span>} />
          <StatCard label="Open reports" value={openReports} sub="Still being actioned" color={COLORS.amber}
            icon={<span className="text-lg">◷</span>} />
          <button
            type="button"
            onClick={() => onNavigate("incidents")}
            className="card-hover flex min-h-28 flex-col items-center justify-center rounded-xl border border-[#00d4ff]/30 bg-[#0d1525] p-5 text-center transition hover:bg-[#102039] focus:outline-none focus:ring-2 focus:ring-[#00d4ff]"
          >
            <span className="mb-2 text-2xl text-[#00d4ff]">＋</span>
            <span className="font-display text-sm font-semibold text-[#00d4ff]">Report an incident</span>
            <span className="mt-1 text-xs text-[#4a6090]">Create a safety report</span>
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title="VIT Vellore Safety Map"
          subtitle="Select a marker to inspect the area advisory"
          className="xl:col-span-2"
          action={<span className="hidden text-[10px] font-mono text-[#4a6090] sm:block">Illustrative campus map</span>}
        >
          <div className="relative h-80 overflow-hidden bg-[#070b14]">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: "linear-gradient(#1e3058 1px, transparent 1px), linear-gradient(90deg, #1e3058 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
            <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d="M4 48 C18 42 25 46 36 40 S58 31 68 39 S82 58 96 55" fill="none" stroke="#1e3058" strokeWidth="2.4" />
              <path d="M28 5 C31 20 34 35 38 50 S48 77 58 96" fill="none" stroke="#1e3058" strokeWidth="1.8" />
              <path d="M70 5 C66 22 64 40 69 57 S79 77 88 94" fill="none" stroke="#1e3058" strokeWidth="1.8" />
              <path d="M10 75 C28 67 45 68 58 73 S78 82 95 76" fill="none" stroke="#172746" strokeWidth="1.2" strokeDasharray="2 2" />
            </svg>
            <div className="absolute left-4 top-3 text-[10px] font-mono uppercase tracking-widest text-[#2d4a7a]">Katpadi Road / West</div>
            {VIT_CAMPUS_ZONES.map((zone) => {
              const tone = riskTone(zone.risk);
              const active = selectedZone?.name === zone.name;
              return (
                <button
                  key={zone.name}
                  type="button"
                  aria-label={`${zone.name}, ${zone.risk} risk. View details`}
                  aria-pressed={active}
                  onClick={() => setSelectedZone(active ? null : zone)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#070b14]"
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                >
                  <span className="absolute inset-0 rounded-full opacity-20 transition-transform group-hover:scale-150" style={{ background: tone }} />
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 bg-[#0d1525] text-[10px] font-bold shadow-lg transition-transform group-hover:scale-110"
                    style={{ borderColor: tone, color: tone, boxShadow: active ? `0 0 18px ${tone}70` : undefined }}>
                    {zone.short}
                  </span>
                </button>
              );
            })}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg border border-[#1e3058] bg-[#0d1525]/95 px-3 py-2 text-[10px] font-mono">
              <span style={{ color: COLORS.green }}>● Low</span>
              <span style={{ color: COLORS.amber }}>● Moderate</span>
              <span style={{ color: COLORS.red }}>● High</span>
            </div>
            <div className="absolute bottom-3 right-3 rounded bg-[#0d1525]/90 px-2 py-1 text-[9px] font-mono text-[#4a6090]">
              Not for navigation
            </div>
          </div>
          {selectedZone && (
            <div className="flex flex-wrap items-start justify-between gap-3 border-t border-[#1e3058] bg-[#101e33] p-4">
              <div>
                <p className="font-semibold text-[#e2eaf8]">{selectedZone.name}</p>
                <p className="mt-1 text-xs text-[#4a6090]">{selectedZone.detail}</p>
              </div>
              <span className={badgeClass(selectedZone.risk)}>{selectedZone.risk} risk</span>
            </div>
          )}
        </Panel>

        <Panel title="Campus Advisories" subtitle="Sample advisory feed — verify with campus security">
          <div className="divide-y divide-[#1e3058]/60">
            {CAMPUS_EVENTS.map((event) => (
              <article key={event.title} className="p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#e2eaf8]">{event.title}</p>
                    <p className="mt-0.5 text-xs text-[#00d4ff]">{event.place}</p>
                  </div>
                  <span className={badgeClass(event.level)}>{event.level}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#4a6090]">{event.note}</p>
                <p className="mt-2 font-mono text-[10px] text-[#2d4a7a]">{event.time}</p>
              </article>
            ))}
          </div>
          <div className="m-4 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 p-3">
            <p className="text-xs font-semibold text-[#ef4444]">Emergency assistance</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#4a6090]">
              Contact VIT Security using the currently published campus emergency contact. Do not rely on this demo dashboard for emergency dispatch.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="My Reports" subtitle={`${myReports.length} report${myReports.length === 1 ? "" : "s"} submitted from this account`}
        action={<button type="button" onClick={() => onNavigate("incidents")} className="text-xs font-semibold text-[#00d4ff] hover:underline">View all →</button>}
        className="mb-4"
      >
        {myReports.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <span className="mb-3 text-3xl text-[#2d4a7a]">▤</span>
            <p className="font-display text-sm text-[#e2eaf8]">No reports submitted yet</p>
            <p className="mt-1 text-xs text-[#4a6090]">Use Report an incident to submit your first report.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e3058]/50">
            {myReports.slice(0, 6).map((incident) => (
              <div key={incident.id} className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-[#111e35]">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#00d4ff]">{incident.id}</span>
                    <span className={badgeClass(incident.status)}>{incident.status}</span>
                  </div>
                  <p className="truncate text-sm text-[#e2eaf8]">{incident.type}</p>
                  <p className="mt-0.5 truncate text-xs text-[#4a6090]">{incident.location} · {incident.time}</p>
                </div>
                <span className={badgeClass(incident.severity)}>{incident.severity}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Campus Safety Reminders" subtitle="General awareness guidance">
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          {[
            "Do not allow unknown people to follow you into restricted or access-controlled areas.",
            "Report suspicious activity on campus networks to the appropriate IT or security team.",
            "For an emergency, contact campus security directly before submitting a digital report.",
          ].map((tip, index) => (
            <div key={tip} className="rounded-lg border border-[#1e3058] bg-[#070b14] p-4">
              <span className="mb-2 block font-display text-2xl font-bold text-[#00d4ff]">0{index + 1}</span>
              <p className="text-xs leading-relaxed text-[#4a6090]">{tip}</p>
            </div>
          ))}
        </div>
      </Panel>
    </main>
  );
}

export default function Dashboard({ onNavigate = () => {} }: DashboardProps) {
  const { user, incidents, alerts } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  if (user?.role === "Student") return <StudentDashboard onNavigate={onNavigate} />;

  const activeAlerts = alerts.filter((alert) => alert.status === "Active").length;
  const openIncidents = incidents.filter((incident) =>
    ["Open", "In Progress", "Assigned"].includes(incident.status),
  ).length;
  const criticalIncidents = incidents.filter((incident) =>
    ["Critical"].includes(incident.severity),
  ).length;
  const resolvedIncidents = incidents.filter((incident) =>
    ["Resolved", "Closed"].includes(incident.status),
  ).length;

  // A transparent demo score derived from the current incident list, not a live risk model.
  const calculatedRisk = incidents.length
    ? Math.min(100, Math.round(
        incidents.reduce((total, incident) => {
          const weight =
            incident.severity === "Critical" ? 4 :
            incident.severity === "High" ? 3 :
            incident.severity === "Medium" ? 2 : 1;
          return total + weight;
        }, 0) / incidents.length * 20,
      ))
    : Number(stats.riskScore || 0);
  const riskColor = riskTone(calculatedRisk);

  const filteredIncidents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return incidents.filter((incident) => {
      const matchesSearch = !term || [
        incident.id,
        incident.type,
        incident.location,
        incident.reporterEmail,
        incident.status,
        incident.severity,
      ].some((value) => String(value ?? "").toLowerCase().includes(term));
      const matchesStatus = statusFilter === "All" || incident.status === statusFilter;
      const matchesSeverity = severityFilter === "All" || incident.severity === severityFilter;
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [incidents, search, statusFilter, severityFilter]);

  const currentTime = new Date().toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#070b14] p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[#00d4ff]">SentinelX / Security Operations</p>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white">Operations Center</h1>
          <p className="mt-1 text-xs text-[#4a6090]">{currentTime} · {user?.role || "Operator"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-[#10b981]/30 bg-[#10b981]/10 px-3 py-2">
            <span className="status-dot status-dot-green" />
            <span className="font-mono text-xs text-[#10b981]">Dashboard operational</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/10 px-3 py-2">
            <span className="status-dot status-dot-red" />
            <span className="font-mono text-xs text-[#ef4444]">{activeAlerts} active alerts</span>
          </div>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total incidents" value={incidents.length.toLocaleString()} sub="All recorded reports" color={COLORS.cyan}
          icon={<span className="text-lg">▤</span>} />
        <StatCard label="Open incidents" value={openIncidents} sub="Require follow-up" color={COLORS.amber}
          icon={<span className="text-lg">◷</span>} />
        <StatCard label="Critical incidents" value={criticalIncidents} sub="Highest severity" color={COLORS.red}
          icon={<span className="text-lg">!</span>} />
        <StatCard label="Resolved incidents" value={resolvedIncidents} sub="Resolved or closed" color={COLORS.green}
          icon={<span className="text-lg">✓</span>} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Incident trend" subtitle="Historical sample data · last 10 days" className="lg:col-span-2">
          <div className="h-64 p-3 sm:p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="sentinelTotalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="sentinelCriticalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e3058" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#4a6090", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#4a6090", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="incidents" name="Total" stroke="#00d4ff" strokeWidth={2.5} fill="url(#sentinelTotalGradient)" />
                <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} fill="url(#sentinelCriticalGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Campus risk indicator" subtitle="Calculated from incident severity">
          <div className="p-5">
            <SafetyScore score={calculatedRisk} label="Demo risk score" />
            <div className="mt-5 space-y-3">
              {[
                { label: "Critical", count: criticalIncidents, color: COLORS.red },
                { label: "High", count: incidents.filter((item) => item.severity === "High").length, color: COLORS.amber },
                { label: "Other", count: incidents.filter((item) => !["Critical", "High"].includes(item.severity)).length, color: COLORS.purple },
              ].map((item) => {
                const percent = incidents.length ? (item.count / incidents.length) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-[#4a6090]">{item.label}</span>
                      <span className="font-mono text-[#e2eaf8]">{item.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#1e3058]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[10px] leading-relaxed text-[#4a6090]">
              This is a simple demonstration indicator. It is not a validated prediction or emergency-risk assessment.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Incident distribution" subtitle="Sample category distribution">
          <div className="h-44 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incidentTypeData} cx="50%" cy="50%" innerRadius={43} outerRadius={68} paddingAngle={3} dataKey="value">
                  {incidentTypeData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 px-5 pb-5">
            {incidentTypeData.slice(0, 5).map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
                  <span className="truncate text-xs text-[#4a6090]">{item.name}</span>
                </div>
                <span className="font-mono text-xs text-[#e2eaf8]">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top risk locations" subtitle="Sample location-risk data">
          <div className="space-y-4 p-5">
            {locationRiskData.slice(0, 6).map((location) => {
              const tone = riskTone(location.riskScore >= 76 ? "High" : location.riskScore >= 51 ? "Moderate" : "Low");
              return (
                <div key={location.location}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-[#e2eaf8]">{location.location}</span>
                    <span className="shrink-0 font-mono text-xs" style={{ color: tone }}>{location.riskScore}/100</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#1e3058]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, location.riskScore))}%`, background: tone }} />
                  </div>
                  <p className={`mt-1 text-right text-[10px] ${String(location.trend).startsWith("+") ? "text-[#ef4444]" : "text-[#10b981]"}`}>
                    {location.trend}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent incidents" subtitle="Latest entries in the current incident list"
          action={<button type="button" onClick={() => onNavigate("incidents")} className="text-xs font-semibold text-[#00d4ff] hover:underline">Open register →</button>}
        >
          <div className="divide-y divide-[#1e3058]/50">
            {incidents.slice(0, 6).length ? incidents.slice(0, 6).map((incident) => (
              <div key={incident.id} className="flex items-start gap-3 p-4">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: riskTone(incident.severity) }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#e2eaf8]">{incident.type}</p>
                  <p className="mt-0.5 truncate text-xs text-[#4a6090]">{incident.location}</p>
                  <p className="mt-1 font-mono text-[10px] text-[#2d4a7a]">{incident.id} · {incident.time}</p>
                </div>
                <span className={badgeClass(incident.severity)}>{incident.severity}</span>
              </div>
            )) : <p className="p-6 text-center text-xs text-[#4a6090]">No incidents recorded.</p>}
          </div>
        </Panel>
      </div>

      <Panel title="Incident register" subtitle={`${filteredIncidents.length} matching record${filteredIncidents.length === 1 ? "" : "s"}`}
        action={<button type="button" onClick={() => onNavigate("incidents")} className="text-xs font-semibold text-[#00d4ff] hover:underline">Manage incidents →</button>}
      >
        <div className="grid grid-cols-1 gap-3 border-b border-[#1e3058] p-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ID, type, location, reporter..."
            aria-label="Search incidents"
            className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2 text-xs text-[#e2eaf8] outline-none placeholder:text-[#4a6090] focus:border-[#00d4ff]"
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2 text-xs text-[#e2eaf8] outline-none focus:border-[#00d4ff]">
            {["All", "Open", "Assigned", "In Progress", "Resolved", "Closed"].map((value) => <option key={value} value={value}>{value} status</option>)}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}
            aria-label="Filter by severity"
            className="rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2 text-xs text-[#e2eaf8] outline-none focus:border-[#00d4ff]">
            {["All", "Critical", "High", "Medium", "Low"].map((value) => <option key={value} value={value}>{value} severity</option>)}
          </select>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-[#e2eaf8]">No matching incidents</p>
            <p className="mt-1 text-xs text-[#4a6090]">Try changing the search term or filters.</p>
            <button type="button" onClick={() => { setSearch(""); setStatusFilter("All"); setSeverityFilter("All"); }}
              className="mt-3 text-xs font-semibold text-[#00d4ff] hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead className="bg-[#101e33] font-mono uppercase tracking-wide text-[#4a6090]">
                <tr>
                  <th className="px-5 py-3">Incident</th>
                  <th className="px-5 py-3">Location</th>
                  <th className="px-5 py-3">Reporter</th>
                  <th className="px-5 py-3">Severity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3058]/50">
                {filteredIncidents.slice(0, 12).map((incident) => (
                  <tr key={incident.id} className="transition hover:bg-[#111e35]">
                    <td className="px-5 py-3">
                      <p className="font-mono text-[#00d4ff]">{incident.id}</p>
                      <p className="mt-1 text-[#e2eaf8]">{incident.type}</p>
                    </td>
                    <td className="px-5 py-3 text-[#4a6090]">{incident.location}</td>
                    <td className="px-5 py-3 text-[#4a6090]">{incident.reporterEmail || "—"}</td>
                    <td className="px-5 py-3"><span className={badgeClass(incident.severity)}>{incident.severity}</span></td>
                    <td className="px-5 py-3"><span className={badgeClass(incident.status)}>{incident.status}</span></td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[#4a6090]">{incident.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIncidents.length > 12 && (
              <p className="border-t border-[#1e3058] px-5 py-3 text-center text-[10px] text-[#4a6090]">
                Showing 12 of {filteredIncidents.length} matches. Open the incident register to view the rest.
              </p>
            )}
          </div>
        )}
      </Panel>
    </main>
  );
}

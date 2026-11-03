import { useMemo, useState, type ReactNode } from "react";
import {
  BarChart, Bar, Area, Line, ComposedChart, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { trendData, incidentTypeData, locationRiskData } from "../data/mockData";
import { SEVERITY_META, severityFromScore } from "../data/domain";
import { useAppState } from "../context/AppContext";

/* ───────────── Chart theme (recharts needs literal colors; keep in sync with @theme) ───────────── */

const C = {
  cyan: "#00d4ff", red: "#ef4444", amber: "#f59e0b", purple: "#7c3aed", green: "#10b981",
  grid: "#1e3058", tick: "#4a6090",
} as const;
const TICK = { fill: C.tick, fontSize: 10, fontFamily: "JetBrains Mono" };
const TICK_SM = { ...TICK, fontSize: 9 };

/* ───────────── Static datasets (not filtered by the range selector) ───────────── */

const hourlyData = [
  { hour: 0, incidents: 3 }, { hour: 2, incidents: 5 }, { hour: 4, incidents: 8 },
  { hour: 6, incidents: 12 }, { hour: 8, incidents: 22 }, { hour: 10, incidents: 18 },
  { hour: 12, incidents: 25 }, { hour: 14, incidents: 20 }, { hour: 16, incidents: 28 },
  { hour: 18, incidents: 35 }, { hour: 20, incidents: 30 }, { hour: 22, incidents: 15 },
];
const isNight = (hour: number) => hour >= 18 || hour <= 4;

const SLA_HOURS = 4;
const resolutionData = [
  { type: "Unauthorized Access", avgHours: 6.2 },
  { type: "Network Security", avgHours: 3.4 },
  { type: "Suspicious Activity", avgHours: 4.8 },
  { type: "Infrastructure", avgHours: 8.1 },
  { type: "Environmental", avgHours: 2.9 },
  { type: "Emergency", avgHours: 1.2 },
];

/* ───────────── Range selector: only offers what the data can support ───────────── */

const RANGES = [
  { id: "3d", label: "3D", days: 3 },
  { id: "7d", label: "7D", days: 7 },
  { id: "all", label: `${trendData.length}D`, days: trendData.length },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

const sum = <T,>(rows: readonly T[], pick: (r: T) => number) => rows.reduce((n, r) => n + pick(r), 0);
const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);

/* ───────────── Pieces ───────────── */

interface TipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string | number; value?: string | number; color?: string }>;
  label?: string | number;
  formatLabel?: (l: string | number) => string;
  unit?: string;
}

function ChartTooltip({ active, payload, label, formatLabel, unit = "" }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-lg p-3 text-xs shadow-lg">
      <p className="text-text-muted font-mono mb-1.5">{label !== undefined && formatLabel ? formatLabel(label) : label}</p>
      {payload.map((p) => (
        <p key={String(p.name)} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}{unit}</p>
      ))}
    </div>
  );
}

function ChartCard({ title, summary, footnote, children }: { title: string; summary: string; footnote?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-5">
      <h2 className="font-display font-semibold text-text tracking-wide mb-4">{title}</h2>
      {/* Screen readers get the takeaway; the visual chart itself is hidden from them */}
      <p className="sr-only">{summary}</p>
      <div aria-hidden>{children}</div>
      {footnote && <p className="text-text-muted text-xs font-mono mt-2">{footnote}</p>}
    </section>
  );
}

function Kpi({ label, value, sub, tone = "text-text" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-5 py-4">
      <p className="text-text-muted text-xs font-mono">{label}</p>
      <p className={`font-display text-2xl font-bold mt-1 ${tone}`}>{value}</p>
      {sub && <p className="text-text-muted text-xs font-mono mt-0.5">{sub}</p>}
    </div>
  );
}

type SortKey = "location" | "incidents" | "riskScore" | "trend";
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "location", label: "Location" },
  { key: "incidents", label: "Total incidents" },
  { key: "riskScore", label: "Risk score" },
  { key: "trend", label: "7-day trend" },
];

/* ───────────── Page ───────────── */

export default function Analytics({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { canAccess } = useAppState();
  const [rangeId, setRangeId] = useState<RangeId>("all");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [asc, setAsc] = useState(false);

  const range = RANGES.find((r) => r.id === rangeId)!;

  const { rows, kpi } = useMemo(() => {
    const rows = trendData.slice(-range.days);
    const prev = trendData.slice(-range.days * 2, -range.days);
    const total = sum(rows, (r) => r.incidents);
    const critical = sum(rows, (r) => r.critical);
    const resolved = sum(rows, (r) => r.resolved);
    const peak = rows.reduce((a, b) => (b.incidents > a.incidents ? b : a));
    // Only compare when a full previous period exists
    const prevTotal = prev.length === range.days ? sum(prev, (r) => r.incidents) : null;
    const delta = prevTotal ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
    return { rows, kpi: { total, critical, resolved, peak, delta } };
  }, [range.days]);

  const locations = useMemo(() => {
    const dir = asc ? 1 : -1;
    return [...locationRiskData].sort((a, b) =>
      sortKey === "location" ? dir * a.location.localeCompare(b.location)
      : sortKey === "trend" ? dir * (parseFloat(a.trend) - parseFloat(b.trend))
      : dir * (a[sortKey] - b[sortKey]));
  }, [sortKey, asc]);

  const nightShare = pct(sum(hourlyData.filter((h) => isNight(h.hour)), (h) => h.incidents), sum(hourlyData, (h) => h.incidents));
  const peakHour = hourlyData.reduce((a, b) => (b.incidents > a.incidents ? b : a));
  const topType = [...incidentTypeData].sort((a, b) => b.value - a.value)[0];
  const slowest = [...resolutionData].sort((a, b) => b.avgHours - a.avgHours)[0];

  function sortBy(key: SortKey) {
    if (key === sortKey) setAsc((a) => !a);
    else { setSortKey(key); setAsc(key === "location"); }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-bg">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Analytics</h1>
          <p className="text-text-muted text-xs font-mono mt-0.5">Incident intelligence · last {range.days} days of data</p>
        </div>
        <div role="group" aria-label="Time range" className="flex items-center gap-2">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRangeId(r.id)} aria-pressed={rangeId === r.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                      rangeId === r.id ? "bg-cyan/10 border-cyan/30 text-cyan" : "bg-surface border-border text-text-muted hover:border-border-bright"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs follow the selected range */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi label="Incidents" value={String(kpi.total)}
             sub={kpi.delta === null ? "No earlier period to compare" : `${kpi.delta > 0 ? "▲" : kpi.delta < 0 ? "▼" : "•"} ${Math.abs(kpi.delta)}% vs previous ${range.days}d`}
             tone={kpi.delta !== null && kpi.delta > 0 ? "text-red" : "text-text"} />
        <Kpi label="Critical" value={String(kpi.critical)} sub={`${pct(kpi.critical, kpi.total)}% of incidents`} />
        <Kpi label="Resolution rate" value={`${pct(kpi.resolved, kpi.total)}%`} sub={`${kpi.resolved} resolved`}
             tone={pct(kpi.resolved, kpi.total) < 70 ? "text-amber" : "text-green"} />
        <Kpi label="Busiest day" value={kpi.peak.date} sub={`${kpi.peak.incidents} incidents`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard
          title={`${range.days}-day incident volume`}
          summary={`Daily incidents over ${range.days} days. Total ${kpi.total}, of which ${kpi.critical} critical. Busiest day ${kpi.peak.date} with ${kpi.peak.incidents}.`}
        >
          {/* ComposedChart is the supported way to mix Area and Line; Line inside AreaChart can fail to render */}
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={rows} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.cyan} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="incidents" name="Incidents" stroke={C.cyan} strokeWidth={2} fill="url(#gradTotal)" />
              <Line type="monotone" dataKey="critical" name="Critical" stroke={C.red} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Incidents by hour of day"
          summary={`Peak at ${peakHour.hour}:00 with ${peakHour.incidents} incidents. Night hours account for ${nightShare}% of incidents.`}
          footnote={<><span className="text-red">■</span> Night (18:00–04:00): {nightShare}% of incidents · peak {String(peakHour.hour).padStart(2, "0")}:00 · all data, not range-filtered</>}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" />
              <XAxis dataKey="hour" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}h`} />
              <YAxis tick={TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip formatLabel={(l) => `${String(l).padStart(2, "0")}:00`} />} />
              <Bar dataKey="incidents" name="Incidents" radius={[3, 3, 0, 0]}>
                {hourlyData.map((h) => <Cell key={h.hour} fill={isNight(h.hour) ? C.red : C.cyan} fillOpacity={0.7} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Incident type distribution"
          summary={`${topType.name} is the most common type with ${topType.value} incidents.`}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incidentTypeData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={TICK_SM} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Count" radius={[0, 3, 3, 0]}>
                {incidentTypeData.map((d) => <Cell key={d.name} fill={d.color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Avg. resolution time (hours)"
          summary={`${slowest.type} is slowest at ${slowest.avgHours} hours. ${resolutionData.filter((r) => r.avgHours > SLA_HOURS).length} types exceed the ${SLA_HOURS}-hour target.`}
          footnote={<><span className="text-red">■</span> Over the {SLA_HOURS}h line · SLA targets: 4h High, 2h Critical</>}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={resolutionData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}h`} />
              <YAxis type="category" dataKey="type" width={120} tick={TICK_SM} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip unit="h" />} />
              <ReferenceLine x={SLA_HOURS} stroke={C.amber} strokeDasharray="4 3" />
              <Bar dataKey="avgHours" name="Avg hours" radius={[0, 3, 3, 0]}>
                {resolutionData.map((r) => <Cell key={r.type} fill={r.avgHours > SLA_HOURS ? C.red : C.purple} fillOpacity={0.75} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Location risk table */}
      <section className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-semibold text-text tracking-wide">Location risk analysis</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {COLUMNS.map((c) => (
                  <th key={c.key} scope="col" aria-sort={sortKey === c.key ? (asc ? "ascending" : "descending") : "none"}
                      className="text-left px-5 py-3 text-xs font-mono">
                    <button onClick={() => sortBy(c.key)}
                            className={`inline-flex items-center gap-1 transition-colors ${sortKey === c.key ? "text-cyan" : "text-text-muted hover:text-text"}`}>
                      {c.label}
                      <span aria-hidden>{sortKey === c.key ? (asc ? "↑" : "↓") : ""}</span>
                    </button>
                  </th>
                ))}
                {onNavigate && canAccess("riskmap") && <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => {
                const sev = SEVERITY_META[severityFromScore(loc.riskScore)];
                const change = parseFloat(loc.trend);
                return (
                  <tr key={loc.location} className="border-b border-border/50 hover:bg-surface-2 transition-colors">
                    <th scope="row" className="px-5 py-3.5 text-sm text-text text-left font-normal">{loc.location}</th>
                    <td className="px-5 py-3.5 text-sm font-mono text-text">{loc.incidents}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${loc.riskScore}%`, background: sev.color }} />
                        </div>
                        <span className="text-sm font-mono font-bold" style={{ color: sev.color }}>{loc.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-mono font-medium ${change > 0 ? "text-red" : change < 0 ? "text-green" : "text-text-muted"}`}>
                        {change > 0 ? "▲" : change < 0 ? "▼" : "•"} {loc.trend}
                      </span>
                    </td>
                    {onNavigate && canAccess("riskmap") && (
                      <td className="px-5 py-3.5">
                        <button onClick={() => onNavigate("riskmap")} aria-label={`View ${loc.location} on the risk map`}
                                className="text-xs font-mono text-cyan hover:text-cyan/70 transition-colors">
                          View on map
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

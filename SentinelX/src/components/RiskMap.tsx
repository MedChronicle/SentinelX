import { useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { heatmapZones } from "../data/mockData";

type RiskFilter = "All" | "Critical" | "High" | "Moderate" | "Low";
type SortMode = "risk" | "incidents" | "name";

const RISK_FILTERS: RiskFilter[] = [
  "All",
  "Critical",
  "High",
  "Moderate",
  "Low",
];

const BUILDINGS = [
  { x: "5%", y: "5%", w: "30%", h: "25%", label: "ADMIN WING" },
  { x: "40%", y: "5%", w: "25%", h: "20%", label: "IT HUB" },
  { x: "70%", y: "5%", w: "28%", h: "30%", label: "RESEARCH BLOCK" },
  { x: "5%", y: "40%", w: "20%", h: "30%", label: "HOSTEL A" },
  { x: "30%", y: "35%", w: "35%", h: "25%", label: "ACADEMIC CORE" },
  { x: "70%", y: "40%", w: "28%", h: "20%", label: "LABS — WING D" },
  { x: "10%", y: "78%", w: "35%", h: "18%", label: "PARKING LOT B" },
  { x: "50%", y: "72%", w: "22%", h: "24%", label: "CAFETERIA" },
  { x: "76%", y: "68%", w: "22%", h: "28%", label: "GYMNASIUM" },
] as const;

function getRiskMeta(score: number) {
  if (score >= 76) {
    return {
      label: "Critical" as const,
      color: "#ef4444",
      soft: "rgba(239,68,68,0.16)",
      glow: "rgba(239,68,68,0.32)",
    };
  }
  if (score >= 51) {
    return {
      label: "High" as const,
      color: "#f59e0b",
      soft: "rgba(245,158,11,0.16)",
      glow: "rgba(245,158,11,0.28)",
    };
  }
  if (score >= 26) {
    return {
      label: "Moderate" as const,
      color: "#a78bfa",
      soft: "rgba(124,58,237,0.18)",
      glow: "rgba(124,58,237,0.28)",
    };
  }
  return {
    label: "Low" as const,
    color: "#10b981",
    soft: "rgba(16,185,129,0.14)",
    glow: "rgba(16,185,129,0.22)",
  };
}

function formatTrend(trend: string) {
  if (trend.startsWith("+")) return "Increasing";
  if (trend.startsWith("-")) return "Decreasing";
  return "Stable";
}

export default function RiskMap() {
  const [filter, setFilter] = useState<RiskFilter>("All");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("risk");
  const [selectedId, setSelectedId] = useState<number | string | null>(null);

  const zones = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...heatmapZones]
      .filter((zone) => {
        const riskLabel = getRiskMeta(zone.risk).label;
        const matchesFilter = filter === "All" || riskLabel === filter;
        const matchesSearch =
          !normalizedSearch ||
          zone.name.toLowerCase().includes(normalizedSearch) ||
          String(zone.action ?? "").toLowerCase().includes(normalizedSearch);

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (sortMode === "incidents") return b.incidents - a.incidents;
        if (sortMode === "name") return a.name.localeCompare(b.name);
        return b.risk - a.risk;
      });
  }, [filter, search, sortMode]);

  const selectedZone =
    heatmapZones.find((zone) => zone.id === selectedId) ?? null;

  const summary = useMemo(() => {
    const totalIncidents = heatmapZones.reduce(
      (sum, zone) => sum + zone.incidents,
      0,
    );
    const critical = heatmapZones.filter((zone) => zone.risk >= 76).length;
    const high = heatmapZones.filter(
      (zone) => zone.risk >= 51 && zone.risk < 76,
    ).length;
    const averageRisk = heatmapZones.length
      ? Math.round(
          heatmapZones.reduce((sum, zone) => sum + zone.risk, 0) /
            heatmapZones.length,
        )
      : 0;

    return {
      totalZones: heatmapZones.length,
      totalIncidents,
      critical,
      high,
      averageRisk,
    };
  }, []);

  const chartData = selectedZone
    ? selectedZone.history.map((value, index) => ({
        day: `Point ${index + 1}`,
        risk: value,
      }))
    : [];

  const clearFilters = () => {
    setFilter("All");
    setSearch("");
    setSortMode("risk");
  };

  return (
    <main className="flex-1 min-w-0 overflow-y-auto bg-[#070b14] p-4 text-[#e2eaf8] sm:p-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00d4ff]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#6682b5]">
                Security intelligence / spatial overview
              </p>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-white sm:text-3xl">
              Campus Risk Map
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#7186aa]">
              Review reported risk levels by campus zone, inspect incident
              counts, and open a zone to view its recorded trend and response
              guidance.
            </p>
          </div>
          <div className="rounded-xl border border-[#1e3058] bg-[#0d1525] px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#6682b5]">
              Displayed dataset
            </p>
            <p className="mt-1 text-sm font-semibold text-[#dce8ff]">
              Project sample data
            </p>
            <p className="mt-1 text-[11px] text-[#7186aa]">
              Not a live sensor or emergency feed
            </p>
          </div>
        </header>

        <section
          aria-label="Campus risk summary"
          className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4"
        >
          <SummaryCard
            label="Mapped zones"
            value={summary.totalZones}
            detail="Zones in current dataset"
            accent="#00d4ff"
          />
          <SummaryCard
            label="Recorded incidents"
            value={summary.totalIncidents}
            detail="Sum of zone incident counts"
            accent="#a78bfa"
          />
          <SummaryCard
            label="Critical zones"
            value={summary.critical}
            detail={`${summary.high} additional high-risk zones`}
            accent="#ef4444"
          />
          <SummaryCard
            label="Average risk"
            value={`${summary.averageRisk}/100`}
            detail="Mean of zone risk scores"
            accent="#f59e0b"
          />
        </section>

        <section className="mb-4 rounded-xl border border-[#1e3058] bg-[#0d1525] p-3 sm:p-4">
          <div className="mb-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-sm font-semibold text-[#e2eaf8]">
                Filter and inspect zones
              </h2>
              <p className="mt-1 text-xs text-[#7186aa]">
                {zones.length} of {heatmapZones.length} zones match your view
              </p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="self-start rounded-lg border border-[#29416f] px-3 py-2 text-xs text-[#9db2d7] transition hover:border-[#00d4ff]/50 hover:text-[#00d4ff] lg:self-auto"
            >
              Reset filters
            </button>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search campus zones</span>
              <svg
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6682b5"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search zone or recommended action..."
                className="w-full rounded-lg border border-[#1e3058] bg-[#070b14] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#506487] focus:border-[#00d4ff]/60"
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-[#7186aa]">
              <span className="whitespace-nowrap">Sort by</span>
              <select
                value={sortMode}
                onChange={(event) =>
                  setSortMode(event.target.value as SortMode)
                }
                className="min-w-0 rounded-lg border border-[#1e3058] bg-[#070b14] px-3 py-2.5 text-xs text-[#dce8ff] outline-none focus:border-[#00d4ff]/60"
              >
                <option value="risk">Highest risk</option>
                <option value="incidents">Most incidents</option>
                <option value="name">Zone name</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2" aria-label="Risk filters">
            {RISK_FILTERS.map((item) => {
              const active = filter === item;
              const meta =
                item === "All"
                  ? null
                  : getRiskMeta(
                      item === "Critical"
                        ? 90
                        : item === "High"
                          ? 60
                          : item === "Moderate"
                            ? 35
                            : 10,
                    );

              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg border px-3 py-2 text-xs transition ${
                    active
                      ? "border-[#00d4ff]/50 bg-[#00d4ff]/10 text-[#00d4ff]"
                      : "border-[#1e3058] bg-[#070b14] text-[#7186aa] hover:border-[#35558c] hover:text-[#dce8ff]"
                  }`}
                >
                  {meta && (
                    <span
                      className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                  )}
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,0.8fr)]">
          <section className="min-w-0 overflow-hidden rounded-xl border border-[#1e3058] bg-[#0d1525]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e3058] px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-[#e2eaf8]">
                  Campus zone overlay
                </h2>
                <p className="mt-0.5 text-[11px] text-[#7186aa]">
                  Select a hotspot or a zone in the index for details
                </p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#8ca2c7]">
                {RISK_FILTERS.slice(1).map((item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: getRiskMeta(
                          item === "Critical"
                            ? 90
                            : item === "High"
                              ? 60
                              : item === "Moderate"
                                ? 35
                                : 10,
                        ).color,
                      }}
                    />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="grid-bg relative min-h-[390px] w-full overflow-hidden bg-[#070b14] sm:min-h-[520px]"
              role="group"
              aria-label="Illustrative campus zone map"
            >
              <div className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.08),transparent_65%)]" />
              </div>

              {BUILDINGS.map((building) => (
                <div
                  key={building.label}
                  className="absolute flex items-center justify-center rounded border border-[#29416f]/70 bg-[#0d1525]/75 px-1 text-center"
                  style={{
                    left: building.x,
                    top: building.y,
                    width: building.w,
                    height: building.h,
                  }}
                >
                  <span className="text-[7px] font-mono tracking-wider text-[#55719f] sm:text-[9px]">
                    {building.label}
                  </span>
                </div>
              ))}

              {zones.map((zone) => {
                const meta = getRiskMeta(zone.risk);
                const isSelected = selectedId === zone.id;
                const markerSize = Math.min(
                  34,
                  Math.max(18, 15 + zone.incidents * 0.45),
                );

                return (
                  <button
                    key={zone.id}
                    type="button"
                    aria-label={`${zone.name}, ${meta.label} risk, score ${zone.risk}, ${zone.incidents} incidents. Select for details.`}
                    aria-pressed={isSelected}
                    title={`${zone.name} · ${meta.label} · ${zone.risk}/100`}
                    onClick={() =>
                      setSelectedId(isSelected ? null : zone.id)
                    }
                    className="group absolute z-[2] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b14]"
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: markerSize + 18,
                      height: markerSize + 18,
                    }}
                  >
                    <span
                      className="absolute inset-0 rounded-full transition group-hover:scale-125"
                      style={{
                        background: meta.soft,
                        boxShadow:
                          isSelected || selectedId === null
                            ? `0 0 22px ${meta.glow}`
                            : "none",
                      }}
                    />
                    <span
                      className="relative rounded-full border-2 border-[#070b14] transition group-hover:scale-125"
                      style={{
                        width: markerSize,
                        height: markerSize,
                        backgroundColor: meta.color,
                        boxShadow: `0 0 12px ${meta.glow}`,
                      }}
                    />
                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#29416f] bg-[#0d1525] px-2.5 py-2 text-left shadow-xl group-hover:block group-focus-visible:block">
                      <span className="block text-xs font-semibold text-white">
                        {zone.name}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-[#9db2d7]">
                        {meta.label} · {zone.risk}/100 · {zone.incidents} incidents
                      </span>
                    </span>
                  </button>
                );
              })}

              {zones.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center">
                  <div className="rounded-xl border border-[#1e3058] bg-[#0d1525]/95 p-5">
                    <p className="text-sm font-semibold text-white">
                      No matching zones
                    </p>
                    <p className="mt-1 text-xs text-[#7186aa]">
                      Change the risk filter or search term.
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-3 text-xs text-[#00d4ff] hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-[#1e3058] px-4 py-2.5 text-[10px] text-[#60779f]">
              Map geometry is illustrative. Marker positions and zone labels
              come from the project's local heatmap dataset.
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#1e3058] bg-[#0d1525]">
            <div className="flex items-center justify-between border-b border-[#1e3058] px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-[#e2eaf8]">
                  Zone risk index
                </h2>
                <p className="mt-0.5 text-[11px] text-[#7186aa]">
                  Ordered by {sortMode === "risk" ? "risk score" : sortMode}
                </p>
              </div>
              <span className="rounded-md border border-[#1e3058] px-2 py-1 font-mono text-[10px] text-[#8ca2c7]">
                {zones.length} zones
              </span>
            </div>

            <div className="max-h-[520px] overflow-y-auto">
              {zones.map((zone, index) => {
                const meta = getRiskMeta(zone.risk);
                const active = selectedId === zone.id;

                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(active ? null : zone.id)
                    }
                    aria-pressed={active}
                    className={`block w-full border-b border-[#1e3058]/60 px-4 py-3.5 text-left transition ${
                      active
                        ? "bg-[#14223b]"
                        : "hover:bg-[#111e35]/70"
                    }`}
                  >
                    <span className="mb-2 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-[10px] text-[#506487]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="truncate text-xs font-medium text-[#e2eaf8]">
                          {zone.name}
                        </span>
                      </span>
                      <span
                        className="shrink-0 font-display text-sm font-bold"
                        style={{ color: meta.color }}
                      >
                        {zone.risk}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e3058]">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, zone.risk))}%`,
                            backgroundColor: meta.color,
                          }}
                        />
                      </span>
                      <span className="w-20 shrink-0 text-right font-mono text-[10px] text-[#7186aa]">
                        {zone.incidents} incidents
                      </span>
                    </span>
                    <span className="mt-2 flex items-center justify-between">
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider"
                        style={{
                          color: meta.color,
                          backgroundColor: meta.soft,
                        }}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-[#60779f]">
                        {active ? "Selected" : "View details →"}
                      </span>
                    </span>
                  </button>
                );
              })}
              {zones.length === 0 && (
                <p className="p-6 text-center text-xs text-[#7186aa]">
                  No zones match the current filters.
                </p>
              )}
            </div>
          </section>
        </div>

        {selectedZone && (
          <section
            aria-labelledby="zone-detail-title"
            className="mt-4 overflow-hidden rounded-xl border border-[#29416f] bg-[#0d1525]"
          >
            {(() => {
              const meta = getRiskMeta(selectedZone.risk);
              const trendStatus = formatTrend(selectedZone.trend);

              return (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1e3058] px-4 py-4 sm:px-5">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6682b5]">
                        Selected campus zone
                      </p>
                      <h2
                        id="zone-detail-title"
                        className="mt-1 text-lg font-bold text-white"
                      >
                        {selectedZone.name}
                      </h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2 py-1 text-[10px] font-semibold"
                          style={{
                            color: meta.color,
                            backgroundColor: meta.soft,
                          }}
                        >
                          {meta.label} risk
                        </span>
                        <span className="text-[10px] text-[#7186aa]">
                          Trend: {trendStatus} ({selectedZone.trend})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="rounded-lg border border-[#29416f] px-3 py-2 text-xs text-[#9db2d7] transition hover:border-[#00d4ff]/50 hover:text-white"
                    >
                      Close details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]">
                    <div className="min-w-0 rounded-lg border border-[#1e3058] bg-[#070b14] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-xs font-semibold text-[#dce8ff]">
                            Recorded risk history
                          </h3>
                          <p className="mt-1 text-[10px] text-[#60779f]">
                            Historical points supplied by the sample dataset
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-[#7186aa]">
                          {chartData.length} points
                        </span>
                      </div>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={190}>
                          <LineChart
                            data={chartData}
                            margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
                          >
                            <XAxis
                              dataKey="day"
                              tick={{ fill: "#60779f", fontSize: 9 }}
                              axisLine={{ stroke: "#1e3058" }}
                              tickLine={false}
                            />
                            <YAxis
                              domain={[0, 100]}
                              tick={{ fill: "#60779f", fontSize: 9 }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#0d1525",
                                border: "1px solid #29416f",
                                borderRadius: 8,
                                fontSize: 11,
                              }}
                              labelStyle={{ color: "#9db2d7" }}
                              itemStyle={{ color: meta.color }}
                            />
                            <Line
                              type="monotone"
                              dataKey="risk"
                              name="Risk score"
                              stroke={meta.color}
                              strokeWidth={2.5}
                              dot={{
                                r: 3,
                                fill: meta.color,
                                strokeWidth: 0,
                              }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="py-10 text-center text-xs text-[#7186aa]">
                          No historical risk points are available for this zone.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 content-start">
                      <MetricCard
                        label="Current risk score"
                        value={`${selectedZone.risk}/100`}
                        color={meta.color}
                      />
                      <MetricCard
                        label="Recorded incidents"
                        value={selectedZone.incidents}
                        color="#dce8ff"
                      />
                      <div className="col-span-2 rounded-lg border border-[#1e3058] bg-[#070b14] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-[#6682b5]">
                          Recommended response
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-[#dce8ff]">
                          {selectedZone.action ||
                            "No response guidance has been added for this zone."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
        )}

        <p className="mt-4 text-[10px] leading-relaxed text-[#506487]">
          Risk scores, incident totals, trends, and response guidance are
          displayed from <code>heatmapZones</code>. They should be treated as
          demonstration data unless your application connects them to a
          verified incident database and a documented scoring process.
        </p>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string | number;
  detail: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-[#1e3058] bg-[#0d1525] p-4">
      <div className="mb-3 h-1 w-9 rounded-full" style={{ background: accent }} />
      <p className="text-[10px] font-mono uppercase tracking-wider text-[#7186aa]">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-[10px] text-[#60779f]">{detail}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#1e3058] bg-[#070b14] p-3">
      <p className="text-[9px] font-mono uppercase tracking-wider text-[#6682b5]">
        {label}
      </p>
      <p className="mt-2 font-display text-xl font-bold" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

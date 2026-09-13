import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { stats, trendData, incidentTypeData, locationRiskData, incidents } from "../data/mockData";

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {sub && <span className="text-xs font-mono" style={{ color }}>{sub}</span>}
      </div>
      <div className="font-display font-bold text-3xl text-white leading-none mb-1">{value}</div>
      <div className="text-[#4a6090] text-xs tracking-wide uppercase font-medium">{label}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1525] border border-[#1e3058] rounded-lg p-3 text-xs">
      <p className="text-[#4a6090] font-mono mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [hoveredZone] = useState<null | number>(null);

  const riskColor = stats.riskScore >= 76 ? "#ef4444" : stats.riskScore >= 51 ? "#f59e0b" : stats.riskScore >= 26 ? "#7c3aed" : "#10b981";

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Operations Center</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Live · Updated 30s ago · Sep 13, 2026 — 08:41 UTC</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2">
            <div className="status-dot status-dot-green" />
            <span className="text-[#10b981] text-xs font-mono">All Systems Nominal</span>
          </div>
          <button className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] rounded-lg px-3 py-2 text-xs font-display font-semibold tracking-wide uppercase hover:bg-[#ef4444]/20 transition-colors">
            Emergency Protocol
          </button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Incidents" value={stats.totalIncidents.toLocaleString()}
          sub="+47 today" color="#00d4ff"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        />
        <StatCard
          label="Open Incidents" value={stats.openIncidents}
          sub="↑ 12% vs yesterday" color="#f59e0b"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>}
        />
        <StatCard
          label="Critical Now" value={stats.criticalIncidents}
          sub="Immediate action" color="#ef4444"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
        />
        <StatCard
          label="Resolved Today" value={stats.resolvedToday}
          sub={`Avg ${stats.avgResolutionHours}h`} color="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>}
        />
      </div>

      {/* Middle row: trend chart + risk ring + anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Incident trend */}
        <div className="lg:col-span-2 bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">Incident Trend — 10 Days</h2>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00d4ff] inline-block" /> Total</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block" /> Critical</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981] inline-block" /> Resolved</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gCrit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e3058" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="incidents" name="Total" stroke="#00d4ff" strokeWidth={2} fill="url(#gTotal)"/>
              <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} fill="url(#gCrit)"/>
              <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={1.5} fill="none" strokeDasharray="4 2"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Risk score */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 flex flex-col">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Campus Risk Score</h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="#1e3058" strokeWidth="8" fill="none"/>
                <circle
                  cx="50" cy="50" r="42" stroke={riskColor}
                  strokeWidth="8" fill="none"
                  strokeDasharray={`${(stats.riskScore / 100) * 263.9} 263.9`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${riskColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-4xl" style={{ color: riskColor }}>{stats.riskScore}</span>
                <span className="text-[#4a6090] text-xs font-mono">/ 100</span>
              </div>
            </div>
            <span className="badge badge-high text-sm px-3 py-1 mb-4">HIGH RISK</span>
            <div className="w-full space-y-2">
              {[
                { label: "Location Factor", val: 78 },
                { label: "Frequency Factor", val: 62 },
                { label: "Severity Factor", val: 71 },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="text-[#4a6090] text-xs font-mono w-28 flex-shrink-0">{f.label}</span>
                  <div className="flex-1 h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${f.val}%`, background: riskColor, opacity: 0.7 }} />
                  </div>
                  <span className="text-xs font-mono text-[#e2eaf8] w-6 text-right">{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: pie chart + top locations + recent incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Incident types */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">By Incident Type</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={incidentTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                {incidentTypeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {incidentTypeData.slice(0, 4).map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[#4a6090] text-xs">{d.name}</span>
                </div>
                <span className="text-xs font-mono text-[#e2eaf8]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top risk locations */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Top Risk Locations</h2>
          <div className="space-y-3">
            {locationRiskData.slice(0, 5).map((loc, i) => {
              const color = loc.riskScore >= 76 ? "#ef4444" : loc.riskScore >= 51 ? "#f59e0b" : "#7c3aed";
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#e2eaf8] truncate max-w-[140px]">{loc.location}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color }}>{loc.riskScore}</span>
                      <span className={`text-xs font-mono ${loc.trend.startsWith("+") ? "text-[#ef4444]" : "text-[#10b981]"}`}>{loc.trend}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#1e3058] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${loc.riskScore}%`, background: color, opacity: 0.7 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent incidents */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Recent Incidents</h2>
          <div className="space-y-2.5">
            {incidents.slice(0, 5).map(inc => {
              const sevColor = inc.severity === "Critical" ? "#ef4444" : inc.severity === "High" ? "#f59e0b" : "#7c3aed";
              return (
                <div key={inc.id} className="flex items-start gap-2.5 py-2 border-b border-[#1e3058]/50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: sevColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#e2eaf8] truncate">{inc.type}</p>
                    <p className="text-xs text-[#4a6090] font-mono truncate">{inc.location}</p>
                  </div>
                  <span className={`badge badge-${inc.severity.toLowerCase()} flex-shrink-0`}>{inc.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

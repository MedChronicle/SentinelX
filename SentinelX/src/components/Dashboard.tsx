import { useApp } from "../context/AppContext";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { stats, trendData, incidentTypeData, locationRiskData } from "../data/mockData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1525] border border-[#1e3058] rounded-lg p-3 text-xs">
      <p className="text-[#4a6090] font-mono mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}</p>)}
    </div>
  );
};

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {sub && <span className="text-xs font-mono" style={{ color }}>{sub}</span>}
      </div>
      <div className="font-display font-bold text-3xl text-white leading-none mb-1">{value}</div>
      <div className="text-[#4a6090] text-xs tracking-wide uppercase font-medium">{label}</div>
    </div>
  );
}

function StudentDashboard() {
  const { user, incidents } = useApp();
  const myReports = incidents.filter(i => i.reporterEmail === user?.email);
  const resolved = myReports.filter(i => i.status === "Resolved" || i.status === "Closed").length;
  const semesterScore = Math.min(100, myReports.length * 20 + resolved * 10);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Student Safety Portal · SentinelX Campus Platform</p>
        </div>
        <div className="flex items-center gap-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg px-3 py-2">
          <div className="status-dot status-dot-green" />
          <span className="text-[#10b981] text-xs font-mono">Campus: Safe</span>
        </div>
      </div>

      {/* Safety engagement score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-[#0d1525] to-[#111e35] border border-[#1e3058] rounded-xl p-6 flex flex-col items-center text-center">
          <p className="text-[#4a6090] text-xs font-mono uppercase tracking-wider mb-3">Campus Safety Score</p>
          <div className="relative w-28 h-28 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" stroke="#1e3058" strokeWidth="8" fill="none"/>
              <circle cx="50" cy="50" r="42" stroke="#10b981" strokeWidth="8" fill="none"
                strokeDasharray={`${(semesterScore / 100) * 263.9} 263.9`} strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 6px #10b981)" }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-bold text-3xl text-[#10b981]">{semesterScore}</span>
              <span className="text-[#4a6090] text-xs font-mono">/ 100</span>
            </div>
          </div>
          <span className="badge badge-resolved mb-2">ACTIVE REPORTER</span>
          <p className="text-[#4a6090] text-xs font-mono">Report incidents to improve campus safety. Each report contributes to this score.</p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <StatCard label="Reports Filed" value={myReports.length} sub="This semester" color="#00d4ff"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}/>
          <StatCard label="Resolved" value={resolved} sub="Actioned by security" color="#10b981"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>}/>
          <StatCard label="Open Reports" value={myReports.filter(i => i.status === "Open").length} sub="Awaiting review" color="#f59e0b"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>}/>
          <div className="bg-[#0d1525] border border-[#00d4ff]/20 rounded-xl p-5 flex flex-col items-center justify-center card-hover cursor-pointer" onClick={() => {}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.8" className="mb-2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <p className="text-[#00d4ff] text-sm font-display font-semibold">Report Incident</p>
            <p className="text-[#4a6090] text-xs font-mono mt-0.5">Quick report</p>
          </div>
        </div>
      </div>

      {/* My reports */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-[#1e3058]">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">My Reports</h2>
        </div>
        {myReports.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2d4a7a" strokeWidth="1.5" className="mb-3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <p className="text-[#2d4a7a] text-sm font-display">No reports yet</p>
            <p className="text-xs font-mono text-[#1e3058] mt-1">Use the "Report Incident" button to file your first report</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1e3058]/50">
            {myReports.map(inc => (
              <div key={inc.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#111e35] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs text-[#00d4ff]">{inc.id}</span>
                    <span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status}</span>
                  </div>
                  <p className="text-sm text-[#e2eaf8] truncate">{inc.type}</p>
                  <p className="text-xs font-mono text-[#4a6090] truncate">{inc.location} · {inc.time}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campus safety tips */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
        <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Campus Safety Reminders</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { icon: "🔒", tip: "Always badge-in/out at secure zones. Never hold doors for unknown persons." },
            { icon: "📡", tip: "Report suspicious network activity on campus Wi-Fi to IT Security immediately." },
            { icon: "🚨", tip: "For emergencies, call the campus security hotline: ext. 9999 or use the SentinelX app." },
          ].map((t, i) => (
            <div key={i} className="bg-[#070b14] rounded-lg p-4 border border-[#1e3058]">
              <span className="text-2xl mb-2 block">{t.icon}</span>
              <p className="text-xs text-[#4a6090] leading-relaxed">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, incidents, alerts } = useApp();

  if (user?.role === "Student") return <StudentDashboard />;

  const riskColor = stats.riskScore >= 76 ? "#ef4444" : stats.riskScore >= 51 ? "#f59e0b" : "#10b981";
  const activeAlerts = alerts.filter(a => a.status === "Active").length;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Operations Center</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Live · Sep 13, 2026 — 08:41 UTC · {user?.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#0d1525] border border-[#1e3058] rounded-lg px-3 py-2">
            <div className="status-dot status-dot-green" />
            <span className="text-[#10b981] text-xs font-mono">All Systems Nominal</span>
          </div>
          <div className="flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg px-3 py-2">
            <span className="status-dot status-dot-red" />
            <span className="text-[#ef4444] text-xs font-mono">{activeAlerts} Active Alerts</span>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Incidents" value={incidents.length.toLocaleString()} sub="+47 today" color="#00d4ff"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}/>
        <StatCard label="Open Incidents" value={incidents.filter(i => i.status === "Open").length} sub="↑ 12%" color="#f59e0b"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>}/>
        <StatCard label="Critical Now" value={incidents.filter(i => i.severity === "Critical").length} sub="Immediate action" color="#ef4444"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}/>
        <StatCard label="Resolved Today" value={stats.resolvedToday} sub={`Avg ${stats.avgResolutionHours}h`} color="#10b981"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>}/>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Incident Trend — 10 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.15}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gCrit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e3058" strokeDasharray="3 3"/>
              <XAxis dataKey="date" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="incidents" name="Total" stroke="#00d4ff" strokeWidth={2} fill="url(#gTotal)"/>
              <Area type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} fill="url(#gCrit)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 flex flex-col">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Campus Risk Score</h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" stroke="#1e3058" strokeWidth="8" fill="none"/>
                <circle cx="50" cy="50" r="42" stroke={riskColor} strokeWidth="8" fill="none"
                  strokeDasharray={`${(stats.riskScore / 100) * 263.9} 263.9`} strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${riskColor})` }}/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-4xl" style={{ color: riskColor }}>{stats.riskScore}</span>
                <span className="text-[#4a6090] text-xs font-mono">/ 100</span>
              </div>
            </div>
            <span className="badge badge-high text-sm px-3 py-1 mb-4">HIGH RISK</span>
            {[{ label: "Location", val: 78 }, { label: "Frequency", val: 62 }, { label: "Severity", val: 71 }].map(f => (
              <div key={f.label} className="w-full flex items-center gap-2 mb-1.5">
                <span className="text-[#4a6090] text-xs font-mono w-20">{f.label}</span>
                <div className="flex-1 h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${f.val}%`, background: riskColor, opacity: 0.7 }}/>
                </div>
                <span className="text-xs font-mono text-[#e2eaf8] w-6 text-right">{f.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">By Type</h2>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart><Pie data={incidentTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
              {incidentTypeData.map((d, i) => <Cell key={i} fill={d.color}/>)}
            </Pie><Tooltip content={<CustomTooltip />}/></PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {incidentTypeData.slice(0, 4).map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: d.color }}/><span className="text-[#4a6090] text-xs">{d.name}</span></div>
                <span className="text-xs font-mono text-[#e2eaf8]">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Top Risk Locations</h2>
          <div className="space-y-3">
            {locationRiskData.slice(0, 5).map((loc, i) => {
              const c = loc.riskScore >= 76 ? "#ef4444" : loc.riskScore >= 51 ? "#f59e0b" : "#7c3aed";
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#e2eaf8] truncate max-w-[140px]">{loc.location}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: c }}>{loc.riskScore}</span>
                      <span className={`text-xs font-mono ${loc.trend.startsWith("+") ? "text-[#ef4444]" : "text-[#10b981]"}`}>{loc.trend}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#1e3058] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${loc.riskScore}%`, background: c, opacity: 0.7 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Recent Incidents</h2>
          <div className="space-y-2.5">
            {incidents.slice(0, 5).map(inc => {
              const sevColor = inc.severity === "Critical" ? "#ef4444" : inc.severity === "High" ? "#f59e0b" : "#7c3aed";
              return (
                <div key={inc.id} className="flex items-start gap-2.5 py-2 border-b border-[#1e3058]/50 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: sevColor }}/>
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

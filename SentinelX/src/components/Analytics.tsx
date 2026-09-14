import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { trendData, incidentTypeData, locationRiskData } from "../data/mockData";

const hourlyData = [
  { hour: "00", incidents: 3 }, { hour: "02", incidents: 5 }, { hour: "04", incidents: 8 },
  { hour: "06", incidents: 12 }, { hour: "08", incidents: 22 }, { hour: "10", incidents: 18 },
  { hour: "12", incidents: 25 }, { hour: "14", incidents: 20 }, { hour: "16", incidents: 28 },
  { hour: "18", incidents: 35 }, { hour: "20", incidents: 30 }, { hour: "22", incidents: 15 },
];

const resolutionData = [
  { type: "Unauthorized Access", avgHours: 6.2 },
  { type: "Network Security", avgHours: 3.4 },
  { type: "Suspicious Activity", avgHours: 4.8 },
  { type: "Infrastructure", avgHours: 8.1 },
  { type: "Environmental", avgHours: 2.9 },
  { type: "Emergency", avgHours: 1.2 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1525] border border-[#1e3058] rounded-lg p-3 text-xs">
      <p className="text-[#4a6090] font-mono mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Analytics</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Incident intelligence · Last 30 days</p>
        </div>
        <div className="flex items-center gap-2">
          {["7D", "30D", "90D", "1Y"].map((r, i) => (
            <button key={r} className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${i === 1 ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]" : "bg-[#0d1525] border-[#1e3058] text-[#4a6090] hover:border-[#2a4580]"}`}>{r}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Incident trend */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">10-Day Incident Volume</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e3058" strokeDasharray="3 3"/>
              <XAxis dataKey="date" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Area type="monotone" dataKey="incidents" name="Incidents" stroke="#00d4ff" strokeWidth={2} fill="url(#gradTotal)"/>
              <Line type="monotone" dataKey="critical" name="Critical" stroke="#ef4444" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly distribution */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Incidents by Hour of Day</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e3058" strokeDasharray="3 3"/>
              <XAxis dataKey="hour" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`}/>
              <YAxis tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Bar dataKey="incidents" name="Incidents" radius={[3, 3, 0, 0]}>
                {hourlyData.map((_, i) => (
                  <Cell key={i} fill={parseInt(_.hour) >= 18 || parseInt(_.hour) <= 4 ? "#ef4444" : "#00d4ff"} fillOpacity={0.7}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[#4a6090] text-xs font-mono mt-2">
            <span className="text-[#ef4444]">■</span> Night hours (18:00–04:00) show elevated activity
          </p>
        </div>

        {/* Incident types */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Incident Type Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incidentTypeData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="#1e3058" strokeDasharray="3 3" horizontal={false}/>
              <XAxis type="number" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#4a6090", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Bar dataKey="value" name="Count" radius={[0, 3, 3, 0]}>
                {incidentTypeData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.8}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Avg resolution time */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">Avg. Resolution Time (hours)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={resolutionData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="#1e3058" strokeDasharray="3 3" horizontal={false}/>
              <XAxis type="number" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`}/>
              <YAxis type="category" dataKey="type" width={120} tick={{ fill: "#4a6090", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Bar dataKey="avgHours" name="Avg Hours" fill="#7c3aed" fillOpacity={0.7} radius={[0, 3, 3, 0]}/>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[#4a6090] text-xs font-mono mt-2">SLA target: 4h for High, 2h for Critical</p>
        </div>
      </div>

      {/* Location risk table */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e3058]">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">Location Risk Analysis</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e3058]">
              {["Location", "Total Incidents", "Risk Score", "7-Day Trend", "Action"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[#4a6090] text-xs font-mono uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locationRiskData.map(loc => {
              const c = loc.riskScore >= 76 ? "#ef4444" : loc.riskScore >= 51 ? "#f59e0b" : "#7c3aed";
              return (
                <tr key={loc.location} className="border-b border-[#1e3058]/50 hover:bg-[#111e35] transition-colors">
                  <td className="px-5 py-3.5 text-sm text-[#e2eaf8]">{loc.location}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-[#e2eaf8]">{loc.incidents}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${loc.riskScore}%`, background: c }} />
                      </div>
                      <span className="text-sm font-mono font-bold" style={{ color: c }}>{loc.riskScore}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-mono font-medium ${loc.trend.startsWith("+") ? "text-[#ef4444]" : "text-[#10b981]"}`}>
                      {loc.trend}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-xs font-mono text-[#00d4ff] hover:text-[#00d4ff]/70 transition-colors">View Details →</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

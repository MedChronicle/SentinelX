import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { mlInsights } from "../data/mockData";

const modelPerf = [
  { metric: "Accuracy", RF: 87, LR: 74, XGB: 89 },
  { metric: "Precision", RF: 84, LR: 71, XGB: 86 },
  { metric: "Recall", RF: 82, LR: 68, XGB: 84 },
  { metric: "F1-Score", RF: 83, LR: 69, XGB: 85 },
  { metric: "AUC-ROC", RF: 91, LR: 78, XGB: 93 },
];

const featureImportance = [
  { feature: "Hour of Day", importance: 0.24 },
  { feature: "Location", importance: 0.21 },
  { feature: "Incident Type", importance: 0.18 },
  { feature: "Severity", importance: 0.14 },
  { feature: "Day of Week", importance: 0.11 },
  { feature: "Hist. Frequency", importance: 0.08 },
  { feature: "Resolution Time", importance: 0.04 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1525] border border-[#1e3058] rounded-lg p-3 text-xs">
      <p className="text-[#4a6090] font-mono mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function MLInsights() {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">ML Insights</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Predictive analytics · Last retrain: Sep 13, 04:00 UTC</p>
        </div>
        <div className="flex items-center gap-2 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-lg px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          <span className="text-[#a78bfa] text-xs font-mono">8 anomalies detected today</span>
        </div>
      </div>

      {/* Model performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-1">Model Performance Comparison</h2>
          <p className="text-[#4a6090] text-xs font-mono mb-4">Cross-validated on 80/20 train-test split · 10-fold CV</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={modelPerf} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e3058" strokeDasharray="3 3"/>
              <XAxis dataKey="metric" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={[60, 100]}/>
              <Tooltip content={<CustomTooltip />}/>
              <Bar dataKey="RF" name="Random Forest" fill="#00d4ff" fillOpacity={0.8} radius={[3, 3, 0, 0]}/>
              <Bar dataKey="XGB" name="XGBoost" fill="#7c3aed" fillOpacity={0.8} radius={[3, 3, 0, 0]}/>
              <Bar dataKey="LR" name="Logistic Reg." fill="#4a6090" fillOpacity={0.8} radius={[3, 3, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00d4ff]" /> Random Forest</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> XGBoost</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4a6090]" /> Logistic Reg.</span>
          </div>
        </div>

        {/* Feature importance */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-1">Feature Importance</h2>
          <p className="text-[#4a6090] text-xs font-mono mb-4">XGBoost model · SHAP values</p>
          <div className="space-y-3">
            {featureImportance.map((f, i) => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#e2eaf8]">{f.feature}</span>
                  <span className="text-xs font-mono text-[#7c3aed]">{(f.importance * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${f.importance * 100}%`,
                      background: `linear-gradient(90deg, #7c3aed, #00d4ff)`,
                      opacity: 1 - i * 0.08,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active anomalies */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-[#1e3058] flex items-center justify-between">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">Active Anomaly Detections</h2>
          <span className="badge badge-moderate">Isolation Forest + XGBoost</span>
        </div>
        <div className="divide-y divide-[#1e3058]/50">
          {mlInsights.map((insight, i) => {
            const conf = insight.confidence;
            const confColor = conf >= 85 ? "#ef4444" : conf >= 70 ? "#f59e0b" : "#7c3aed";
            return (
              <div key={i} className="px-5 py-4 hover:bg-[#111e35] transition-colors">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${confColor}15`, border: `1px solid ${confColor}30` }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={confColor} strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display font-semibold text-[#e2eaf8] text-sm">{insight.type}</span>
                      <span className="badge" style={{ background: `${confColor}15`, color: confColor, border: `1px solid ${confColor}30` }}>
                        {insight.confidence}% conf.
                      </span>
                      <span className="badge badge-closed">{insight.model}</span>
                    </div>
                    <p className="text-xs font-mono text-[#00d4ff] mb-1">{insight.location}</p>
                    <p className="text-xs text-[#4a6090] leading-relaxed">{insight.detail}</p>
                    <p className="text-xs font-mono text-[#2d4a7a] mt-2">Flagged: {insight.flagged}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: confColor }}
                    >
                      <span className="font-display font-bold text-lg" style={{ color: confColor }}>{insight.confidence}</span>
                    </div>
                    <p className="text-[#4a6090] text-xs font-mono mt-1">score</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Model status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { model: "Random Forest", version: "v3.2.1", accuracy: "87%", status: "Active", incidents: 1284, last: "04:00 UTC" },
          { model: "XGBoost Risk", version: "v2.0.4", accuracy: "89%", status: "Active", incidents: 1284, last: "04:00 UTC" },
          { model: "Isolation Forest", version: "v1.8.2", accuracy: "—", status: "Active", incidents: 1284, last: "04:00 UTC" },
        ].map(m => (
          <div key={m.model} className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-display font-semibold text-[#e2eaf8]">{m.model}</span>
              <div className="flex items-center gap-1.5">
                <div className="status-dot status-dot-green" />
                <span className="text-[#10b981] text-xs font-mono">{m.status}</span>
              </div>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between"><span className="text-[#4a6090]">Version</span><span className="text-[#e2eaf8]">{m.version}</span></div>
              <div className="flex justify-between"><span className="text-[#4a6090]">Accuracy</span><span className="text-[#00d4ff]">{m.accuracy}</span></div>
              <div className="flex justify-between"><span className="text-[#4a6090]">Training set</span><span className="text-[#e2eaf8]">{m.incidents.toLocaleString()} incidents</span></div>
              <div className="flex justify-between"><span className="text-[#4a6090]">Last retrain</span><span className="text-[#e2eaf8]">{m.last}</span></div>
            </div>
            <button className="w-full mt-4 border border-[#7c3aed]/30 text-[#a78bfa] rounded-lg py-2 text-xs font-mono hover:bg-[#7c3aed]/10 transition-colors">
              Retrain Model
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

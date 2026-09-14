import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { mlInsights } from "../data/mockData";

const modelPerf = [
  { metric: "Accuracy", RF: 87, LR: 74, XGB: 89 },
  { metric: "Precision", RF: 84, LR: 71, XGB: 86 },
  { metric: "Recall", RF: 82, LR: 68, XGB: 84 },
  { metric: "F1-Score", RF: 83, LR: 69, XGB: 85 },
  { metric: "AUC-ROC", RF: 91, LR: 78, XGB: 93 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1525] border border-[#1e3058] rounded-lg p-3 text-xs">
      <p className="text-[#4a6090] font-mono mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }} className="font-mono">{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function MLInsights() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      {/* Disclaimer */}
      <div className="mb-5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-xl px-5 py-3 flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-[#f59e0b] text-xs font-mono">
          <strong>Important:</strong> These are <strong>risk indicators for decision support</strong>, not certainties. Predictions do not determine culpability. Treat all outputs as probabilistic guidance only.
        </p>
      </div>

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
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 mb-4">
        <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-1">Model Performance Comparison</h2>
        <p className="text-[#4a6090] text-xs font-mono mb-4">Cross-validated · 80/20 split · 10-fold CV</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={modelPerf} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#1e3058" strokeDasharray="3 3"/>
            <XAxis dataKey="metric" tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill: "#4a6090", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} domain={[60, 100]}/>
            <Tooltip content={<CustomTooltip />}/>
            <Bar dataKey="RF" name="Random Forest" fill="#00d4ff" fillOpacity={0.8} radius={[3, 3, 0, 0]}/>
            <Bar dataKey="XGB" name="XGBoost" fill="#7c3aed" fillOpacity={0.8} radius={[3, 3, 0, 0]}/>
            <Bar dataKey="LR" name="Logistic Reg." fill="#4a6090" fillOpacity={0.8} radius={[3, 3, 0, 0]}/>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs font-mono">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00d4ff]" /> Random Forest</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> XGBoost</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4a6090]" /> Logistic Reg.</span>
        </div>
      </div>

      {/* Anomaly detections with expandable SHAP */}
      <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-[#1e3058] flex items-center justify-between">
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide">Active Anomaly Detections</h2>
          <span className="badge badge-moderate">Click to explain</span>
        </div>
        <div className="divide-y divide-[#1e3058]/50">
          {mlInsights.map((insight, i) => {
            const conf = insight.confidence;
            const confColor = conf >= 85 ? "#ef4444" : conf >= 70 ? "#f59e0b" : "#7c3aed";
            const isExp = expanded === i;
            return (
              <div key={i}>
                <div
                  className="px-5 py-4 hover:bg-[#111e35] transition-colors cursor-pointer"
                  onClick={() => setExpanded(isExp ? null : i)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${confColor}15`, border: `1px solid ${confColor}30` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={confColor} strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-display font-semibold text-[#e2eaf8] text-sm">{insight.type}</span>
                        <span className="badge" style={{ background: `${confColor}15`, color: confColor, border: `1px solid ${confColor}30` }}>{insight.confidence}% conf.</span>
                        <span className="badge badge-closed">{insight.model}</span>
                      </div>
                      <p className="text-xs font-mono text-[#00d4ff] mb-1">{insight.location}</p>
                      <p className="text-xs text-[#4a6090] leading-relaxed">{insight.detail}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center" style={{ borderColor: confColor }}>
                        <span className="font-display font-bold text-lg" style={{ color: confColor }}>{insight.confidence}</span>
                      </div>
                      <p className="text-[#4a6090] text-xs font-mono mt-1">score</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-14">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4a6090" strokeWidth="2" className={`transition-transform ${isExp ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                    <span className="text-xs font-mono text-[#4a6090]">{isExp ? "Hide" : "Why this prediction?"}</span>
                  </div>
                </div>

                {isExp && (
                  <div className="px-5 pb-4 bg-[#070b14] border-t border-[#1e3058]/50">
                    <p className="text-[#4a6090] text-xs font-mono uppercase mt-4 mb-3">SHAP Feature Importance — {insight.model}</p>
                    <div className="space-y-2.5">
                      {insight.shap.map((f, j) => (
                        <div key={j}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#e2eaf8]">{f.feature}</span>
                            <span className="text-xs font-mono" style={{ color: confColor }}>{f.value}%</span>
                          </div>
                          <div className="h-2 bg-[#1e3058] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${f.value * 3}%`, background: `linear-gradient(90deg, ${confColor}80, ${confColor})` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[#2d4a7a] text-xs font-mono mt-3 italic">Feature importance shows relative contribution to prediction — not causal certainty.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Model status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { model: "Random Forest", version: "v3.2.1", accuracy: "87%", status: "Active", trained: 1284 },
          { model: "XGBoost Risk", version: "v2.0.4", accuracy: "89%", status: "Active", trained: 1284 },
          { model: "Isolation Forest", version: "v1.8.2", accuracy: "—", status: "Active", trained: 1284 },
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
              <div className="flex justify-between"><span className="text-[#4a6090]">Training set</span><span className="text-[#e2eaf8]">{m.trained.toLocaleString()} incidents</span></div>
            </div>
            <button className="w-full mt-4 border border-[#7c3aed]/30 text-[#a78bfa] rounded-lg py-2 text-xs font-mono hover:bg-[#7c3aed]/10 transition-colors">Retrain Model</button>
          </div>
        ))}
      </div>
    </div>
  );
}

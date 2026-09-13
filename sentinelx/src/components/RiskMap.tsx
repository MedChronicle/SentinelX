import { useState } from "react";
import { heatmapZones } from "../data/mockData";

const RISK_FILTERS = ["All", "Critical", "High", "Moderate", "Low"];

function getRiskColor(score: number) {
  if (score >= 76) return { bg: "rgba(239,68,68,0.25)", border: "#ef4444", text: "#ef4444", glow: "rgba(239,68,68,0.4)" };
  if (score >= 51) return { bg: "rgba(245,158,11,0.2)", border: "#f59e0b", text: "#f59e0b", glow: "rgba(245,158,11,0.3)" };
  if (score >= 26) return { bg: "rgba(124,58,237,0.2)", border: "#7c3aed", text: "#a78bfa", glow: "rgba(124,58,237,0.3)" };
  return { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#10b981", glow: "rgba(16,185,129,0.2)" };
}

function getRiskType(score: number) {
  if (score >= 76) return "Critical";
  if (score >= 51) return "High";
  if (score >= 26) return "Moderate";
  return "Low";
}

export default function RiskMap() {
  const [filter, setFilter] = useState("All");
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<typeof heatmapZones[0] | null>(null);

  const visible = heatmapZones.filter(z => filter === "All" || getRiskType(z.risk) === filter);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">Risk Heatmap</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Live campus threat visualization · {visible.length} zones shown</p>
        </div>
        <div className="flex items-center gap-2">
          {RISK_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                filter === f
                  ? "bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]"
                  : "bg-[#0d1525] border-[#1e3058] text-[#4a6090] hover:border-[#2a4580]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map canvas */}
        <div className="lg:col-span-2 bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e3058] flex items-center justify-between">
            <span className="font-display text-sm font-semibold text-[#e2eaf8] tracking-wide">Campus Grid — Threat Overlay</span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Critical ≥76</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> High ≥51</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#7c3aed]" /> Moderate ≥26</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Low</span>
            </div>
          </div>
          <div
            className="relative w-full bg-[#070b14] grid-bg"
            style={{ height: 480 }}
          >
            {/* Campus zones (abstract grid buildings) */}
            {[
              { x: "5%", y: "5%", w: "30%", h: "25%", label: "ADMIN WING" },
              { x: "40%", y: "5%", w: "25%", h: "20%", label: "IT HUB" },
              { x: "70%", y: "5%", w: "28%", h: "30%", label: "RESEARCH BLOCK" },
              { x: "5%", y: "40%", w: "20%", h: "30%", label: "HOSTEL A" },
              { x: "30%", y: "35%", w: "35%", h: "25%", label: "ACADEMIC CORE" },
              { x: "70%", y: "40%", w: "28%", h: "20%", label: "LABS — WING D" },
              { x: "10%", y: "78%", w: "35%", h: "18%", label: "PARKING LOT B" },
              { x: "50%", y: "72%", w: "22%", h: "24%", label: "CAFETERIA" },
              { x: "76%", y: "68%", w: "22%", h: "28%", label: "GYMNASIUM" },
            ].map((b, i) => (
              <div
                key={i}
                className="absolute border border-[#1e3058]/60 rounded flex items-center justify-center"
                style={{ left: b.x, top: b.y, width: b.w, height: b.h, background: "rgba(13,21,37,0.5)" }}
              >
                <span className="text-[#2d4a7a] text-[9px] font-mono tracking-widest uppercase">{b.label}</span>
              </div>
            ))}

            {/* Threat hotspots */}
            {visible.map(zone => {
              const c = getRiskColor(zone.risk);
              const isHov = hovered === zone.id;
              const radius = 12 + zone.incidents / 10;
              return (
                <div
                  key={zone.id}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  onMouseEnter={() => setHovered(zone.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(zone)}
                >
                  {/* Ripple */}
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: radius * 2 + 20,
                      height: radius * 2 + 20,
                      top: -(radius + 10),
                      left: -(radius + 10),
                      background: c.bg,
                      border: `1px solid ${c.border}30`,
                      boxShadow: isHov ? `0 0 20px ${c.glow}` : undefined,
                      transition: "all 0.2s",
                    }}
                  />
                  {/* Core dot */}
                  <div
                    className="relative rounded-full flex items-center justify-center"
                    style={{
                      width: radius,
                      height: radius,
                      background: c.border,
                      boxShadow: `0 0 10px ${c.glow}`,
                      transition: "all 0.2s",
                      transform: isHov ? "scale(1.3)" : "scale(1)",
                    }}
                  />
                  {/* Label */}
                  {isHov && (
                    <div
                      className="absolute bottom-full left-1/2 mb-2 bg-[#0d1525] border border-[#1e3058] rounded-lg px-2 py-1.5 text-xs whitespace-nowrap z-10 pointer-events-none"
                      style={{ transform: "translateX(-50%)" }}
                    >
                      <p className="font-mono" style={{ color: c.text }}>{zone.name}</p>
                      <p className="text-[#4a6090] font-mono">Risk: <span style={{ color: c.text }}>{zone.risk}</span> · {zone.incidents} incidents</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Zone list */}
        <div className="bg-[#0d1525] border border-[#1e3058] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1e3058]">
            <span className="font-display text-sm font-semibold text-[#e2eaf8] tracking-wide">Zone Risk Index</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
            {heatmapZones
              .sort((a, b) => b.risk - a.risk)
              .map(zone => {
                const c = getRiskColor(zone.risk);
                const isSelected = selected?.id === zone.id;
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelected(zone)}
                    className={`px-4 py-3.5 border-b border-[#1e3058]/50 cursor-pointer transition-all ${isSelected ? "bg-[#111e35]" : "hover:bg-[#111e35]/50"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#e2eaf8] font-medium leading-tight">{zone.name}</span>
                      <span className="font-display font-bold text-sm ml-2 flex-shrink-0" style={{ color: c.text }}>{zone.risk}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${zone.risk}%`, background: c.border, opacity: 0.8 }} />
                      </div>
                      <span className="text-[#4a6090] text-xs font-mono flex-shrink-0">{zone.incidents} inc.</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Selected zone detail */}
      {selected && (
        <div className="mt-4 bg-[#0d1525] border border-[#1e3058] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-[#e2eaf8] text-lg">{selected.name}</h3>
              <span className={`badge badge-${getRiskType(selected.risk).toLowerCase()} mt-1`}>{getRiskType(selected.risk)} Risk Zone</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#4a6090] hover:text-[#e2eaf8]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Risk Score", value: selected.risk + " / 100" },
              { label: "Total Incidents", value: selected.incidents },
              { label: "Risk Classification", value: getRiskType(selected.risk) },
            ].map(s => (
              <div key={s.label} className="bg-[#070b14] rounded-lg p-3 border border-[#1e3058] text-center">
                <p className="font-display font-bold text-2xl text-[#e2eaf8]">{s.value}</p>
                <p className="text-[#4a6090] text-xs font-mono mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

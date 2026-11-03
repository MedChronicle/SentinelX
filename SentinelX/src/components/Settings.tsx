import { useState } from "react";

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

function Toggle({ on, onClick, color }: { on: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="relative w-11 h-6 rounded-full transition-all duration-300 active:scale-90"
      style={{
        background: on ? color : "#1e3058",
        boxShadow: on ? `0 0 14px ${color}66` : "none",
      }}
    >
      <span
        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
        style={{
          transform: on ? "translateX(20px)" : "translateX(0)",
          transition: `transform 0.4s ${SPRING}`,
        }}
      />
    </button>
  );
}

export default function Settings() {
  const [slaHigh, setSlaHigh] = useState("4");
  const [slaCrit, setSlaCrit] = useState("2");
  const [mlThresh, setMlThresh] = useState("70");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [autoEscalate, setAutoEscalate] = useState(true);
  const [mlEnabled, setMlEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const rise = (i: number) => ({ animation: `rise-in 0.6s ease-out ${i * 0.1}s both` });
  const cardCls =
    "bg-[#0d1525] border border-[#1e3058] rounded-xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#2a4580] hover:shadow-[0_8px_30px_#00d4ff14]";

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#070b14]">
      <div className="flex items-center justify-between mb-6" style={rise(0)}>
        <div>
          <h1 className="font-display text-2xl font-bold text-white tracking-wide">System Settings</h1>
          <p className="text-[#4a6090] text-xs font-mono mt-0.5">Platform configuration · Admin access required</p>
        </div>
        <button
          onClick={save}
          className={`btn-primary relative overflow-hidden rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
            saved ? "bg-[#10b981] text-white" : ""
          }`}
        >
          {saved ? (
            <>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: "check-pop 0.5s ease-out both" }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Changes
            </>
          )}
          <span
            className="absolute inset-y-0 left-0 w-1/3 bg-white/25 pointer-events-none"
            style={{ animation: "shimmer 2.8s ease-in-out infinite" }}
          />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SLA configuration */}
        <div className={cardCls} style={rise(1)}>
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-1">SLA Configuration</h2>
          <p className="text-[#4a6090] text-xs font-mono mb-5">Response time targets per severity level</p>
          <div className="space-y-4">
            {[
              { label: "Critical Incidents", value: slaCrit, set: setSlaCrit, color: "#ef4444", unit: "hours" },
              { label: "High Incidents", value: slaHigh, set: setSlaHigh, color: "#f59e0b", unit: "hours" },
            ].map(s => (
              <div key={s.label}>
                <label className="text-xs font-mono text-[#4a6090] uppercase block mb-1.5">{s.label} SLA</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={s.value}
                    onChange={e => s.set(e.target.value)}
                    className="w-20 bg-[#070b14] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2 text-sm font-mono text-[#e2eaf8] outline-none text-center transition-all duration-300 focus:scale-110 focus:shadow-[0_0_16px_#00d4ff44]"
                  />
                  <span className="text-[#4a6090] text-sm font-mono">{s.unit}</span>
                  <div className="flex-1 h-1.5 bg-[#1e3058] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(((Number(s.value) || 0) / 12) * 100, 100)}%`,
                        background: s.color,
                        opacity: 0.8,
                        boxShadow: `0 0 10px ${s.color}`,
                        transition: `width 0.6s ${SPRING}`,
                        animation: "bar-glow 2s ease-in-out infinite",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ML configuration */}
        <div className={cardCls} style={rise(2)}>
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-1">ML & Risk Engine</h2>
          <p className="text-[#4a6090] text-xs font-mono mb-5">Anomaly detection and prediction thresholds</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-mono text-[#4a6090] uppercase block mb-1.5">Anomaly Confidence Threshold</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50" max="95" value={mlThresh}
                  onChange={e => setMlThresh(e.target.value)}
                  className="flex-1 accent-[#7c3aed]"
                />
                <span
                  key={mlThresh}
                  className="font-mono text-sm text-[#a78bfa] w-10 text-right inline-block"
                  style={{ animation: "pop 0.25s ease-out" }}
                >
                  {mlThresh}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-[#e2eaf8]">ML Predictions Enabled</p>
                <p className="text-xs font-mono text-[#4a6090]">Random Forest + XGBoost active</p>
              </div>
              <Toggle on={mlEnabled} onClick={() => setMlEnabled(!mlEnabled)} color="#7c3aed" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-[#e2eaf8]">Auto-Retrain Schedule</p>
                <p className="text-xs font-mono text-[#4a6090]">Daily at 04:00 UTC</p>
              </div>
              <select className="bg-[#070b14] border border-[#1e3058] rounded-lg px-2 py-1.5 text-xs font-mono text-[#e2eaf8] outline-none transition-all duration-200 hover:border-[#00d4ff] focus:shadow-[0_0_12px_#00d4ff44]">
                <option>Daily</option><option>Weekly</option><option>Manual</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className={cardCls} style={rise(3)}>
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-1">Notifications</h2>
          <p className="text-[#4a6090] text-xs font-mono mb-5">Alert delivery channels</p>
          <div className="space-y-4">
            {[
              { label: "Email Alerts", sub: "Immediate email for Critical/High", val: emailAlerts, set: setEmailAlerts },
              { label: "SMS Alerts", sub: "SMS for Critical incidents only", val: smsAlerts, set: setSmsAlerts },
              { label: "Auto-Escalation", sub: "Auto-escalate after SLA breach", val: autoEscalate, set: setAutoEscalate },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm text-[#e2eaf8]">{n.label}</p>
                  <p className="text-xs font-mono text-[#4a6090]">{n.sub}</p>
                </div>
                <Toggle on={n.val} onClick={() => n.set(!n.val)} color="#00d4ff" />
              </div>
            ))}
          </div>
        </div>

        {/* OAuth settings */}
        <div className={cardCls} style={rise(4)}>
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-1">Authentication</h2>
          <p className="text-[#4a6090] text-xs font-mono mb-5">OAuth 2.0 and security settings</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#070b14] rounded-lg border border-[#1e3058] transition-all duration-200 hover:border-[#4285F4] hover:scale-[1.02]">
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: "float 2.4s ease-in-out infinite" }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-[#e2eaf8]">Google OAuth 2.0</p>
                <p className="text-xs font-mono text-[#4a6090]">campus.edu domain restricted</p>
              </div>
              <span className="badge badge-resolved" style={{ animation: "pop 2.5s ease-in-out infinite" }}>
                Connected
              </span>
            </div>
            {[
              { label: "OAuth Domain Restriction", value: "@vitstudent.ac.in" },
              { label: "Session Timeout", value: "8 hours" },
              { label: "JWT Secret Rotation", value: "Every 30 days" },
              { label: "MFA Requirement", value: "Admin roles" },
            ].map((s, i) => (
              <div
                key={s.label}
                className="flex items-center justify-between py-2 border-b border-[#1e3058]/50 last:border-0 transition-transform duration-200 hover:translate-x-1"
                style={{ animation: `rise-in 0.5s ease-out ${0.6 + i * 0.08}s both` }}
              >
                <span className="text-xs font-mono text-[#4a6090]">{s.label}</span>
                <span className="text-xs font-mono text-[#e2eaf8]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="lg:col-span-2 bg-[#0d1525] border border-[#1e3058] rounded-xl p-5" style={rise(5)}>
          <h2 className="font-display font-semibold text-[#e2eaf8] tracking-wide mb-4">System Health</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { service: "REST API", status: "Online", uptime: "99.98%", latency: "42ms", color: "#10b981" },
              { service: "ML Engine", status: "Online", uptime: "99.92%", latency: "180ms", color: "#10b981" },
              { service: "Oracle DB", status: "Online", uptime: "99.99%", latency: "8ms", color: "#10b981" },
              { service: "Alert Queue", status: "Online", uptime: "100%", latency: "12ms", color: "#10b981" },
            ].map((s, i) => (
              <div
                key={s.service}
                className="bg-[#070b14] border border-[#1e3058] rounded-lg p-4 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-[#10b981] hover:shadow-[0_0_20px_#10b98133]"
                style={{ animation: `rise-in 0.5s ease-out ${0.7 + i * 0.12}s both` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-display font-semibold text-[#e2eaf8]">{s.service}</span>
                  <div className="relative w-2.5 h-2.5">
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ background: s.color, animation: `ping-ring 1.8s ease-out ${i * 0.3}s infinite` }}
                    />
                    <span className="absolute inset-0 rounded-full" style={{ background: s.color }} />
                  </div>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#4a6090]">Uptime</span>
                    <span style={{ color: s.color }}>{s.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4a6090]">Latency</span>
                    <span className="text-[#e2eaf8]">{s.latency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

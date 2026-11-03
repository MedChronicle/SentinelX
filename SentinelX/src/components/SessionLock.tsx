import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function SessionLock() {
  const { user, unlock } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0); // re-triggers shake animation

  function handleUnlock() {
    // Any non-empty input unlocks in demo
    if (pin.length > 0) {
      unlock();
      setPin("");
      setError(false);
    } else {
      setError(true);
      setShakeKey(k => k + 1);
    }
  }

  const typing = pin.length > 0;
  const stagger = (i: number) => ({
    animation: `rise-in 0.6s ease-out ${i * 0.1}s both`,
  });

  return (
    <div className="fixed inset-0 bg-[#020610]/95 backdrop-blur-sm z-[300] flex items-center justify-center overflow-hidden">
      {/* drifting grid */}
      <div
        className="absolute inset-0 grid-bg opacity-30"
        style={{ animation: "grid-drift 6s linear infinite" }}
      />

      <div className="relative text-center">
        {/* dancing lock with pulsing rings */}
        <div className="relative w-20 h-20 mx-auto mb-6" style={stagger(0)}>
          {[0, 0.8].map(delay => (
            <span
              key={delay}
              className="absolute inset-0 rounded-2xl border border-[#00d4ff]"
              style={{ animation: `ring-pulse 2.4s ease-out ${delay}s infinite` }}
            />
          ))}
          <div
            className="relative w-20 h-20 rounded-2xl bg-[#0d1525] border border-[#1e3058] flex items-center justify-center shadow-[0_0_30px_#00d4ff33]"
            style={{ animation: "lock-dance 2.2s ease-in-out infinite" }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path
                d="M7 11V7a5 5 0 0110 0v4"
                style={{
                  transition: "transform 0.3s",
                  transform: typing ? "translateY(-3px)" : "none",
                  animation: typing ? "shackle-open 0.8s ease-in-out infinite" : "none",
                }}
              />
            </svg>
          </div>
        </div>

        <h2 className="font-display text-2xl font-bold text-white tracking-wide mb-1" style={stagger(1)}>
          Session Locked
        </h2>
        <p className="text-[#4a6090] text-sm font-mono mb-2" style={stagger(2)}>
          Inactive for 15 minutes
        </p>
        <p className="text-[#e2eaf8] text-sm mb-8" style={stagger(3)}>
          {user?.name} · {user?.email}
        </p>

        <div
          key={shakeKey}
          className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-80"
          style={
            shakeKey > 0
              ? { animation: "shake 0.45s ease-in-out" }
              : stagger(4)
          }
        >
          <p className="text-[#4a6090] text-xs font-mono uppercase tracking-wider mb-4">
            Re-authenticate to continue
          </p>

          <button
            onClick={() => unlock()}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-[#1e3058] hover:border-[#2a4580] text-[#e2eaf8] rounded-xl py-3 px-4 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 mb-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-medium">Unlock with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#1e3058]" />
            <span className="text-[#4a6090] text-xs font-mono">OR</span>
            <div className="flex-1 h-px bg-[#1e3058]" />
          </div>

          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            placeholder="Enter password"
            className={`w-full bg-[#0a1020] border rounded-lg px-4 py-3 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono mb-3 transition-all duration-300 focus:scale-[1.03] focus:shadow-[0_0_18px_#00d4ff44] ${
              error ? "border-[#ef4444]" : "border-[#1e3058] focus:border-[#00d4ff]"
            }`}
          />
          {error && (
            <p className="text-[#ef4444] text-xs font-mono mb-3" style={{ animation: "rise-in 0.3s ease-out" }}>
              Enter your password to unlock
            </p>
          )}

          <button
            onClick={handleUnlock}
            className="btn-primary relative overflow-hidden w-full rounded-lg py-3 text-sm uppercase tracking-widest transition-transform duration-150 hover:scale-[1.03] active:scale-95"
          >
            <span className="relative z-10">Unlock Session</span>
            <span
              className="absolute inset-y-0 left-0 w-1/3 bg-white/25 pointer-events-none"
              style={{ animation: "shimmer 2.6s ease-in-out infinite" }}
            />
          </button>
        </div>

        <p className="text-[#2d4a7a] text-xs font-mono mt-4" style={stagger(6)}>
          All activity is logged and monitored
        </p>
      </div>
    </div>
  );
}

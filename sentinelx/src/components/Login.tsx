import { useEffect, useRef, useState } from "react";
import {
  authenticateDemoAccount,
  decodeGoogleCredential,
  resolveRole,
  toAppUser,
  type AppUser,
  type GoogleCredentialResponse,
} from "../lib/auth";

interface Props {
  onLogin: (user: AppUser) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login({ onLogin }: Props) {
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function handleCredentialResponse(response: GoogleCredentialResponse) {
      setGoogleLoading(true);
      setGoogleError(null);
      try {
        const profile = decodeGoogleCredential(response.credential);
        const role = resolveRole(profile.email);
        onLogin(toAppUser(profile.name, profile.email, role));
      } catch {
        setGoogleError("Couldn't read your Google account details. Please try again.");
        setGoogleLoading(false);
      }
    }

    let cancelled = false;
    const interval = window.setInterval(() => {
      if (cancelled) return;
      if (window.google?.accounts?.id) {
        window.clearInterval(interval);
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: true,
        });
        if (buttonHostRef.current) {
          window.google.accounts.id.renderButton(buttonHostRef.current, {
            type: "standard",
            theme: "filled_black",
            size: "large",
            shape: "pill",
            width: 320,
            text: "continue_with",
          });
        }
        setGoogleReady(true);
      }
    }, 100);

    const timeout = window.setTimeout(() => {
      cancelled = true;
      window.clearInterval(interval);
      if (!window.google?.accounts?.id) {
        setGoogleError("Google Sign-In couldn't load. Check your connection and reload.");
      }
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [onLogin]);

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Enter both your campus email and password.");
      return;
    }

    setFormLoading(true);
    window.setTimeout(() => {
      const account = authenticateDemoAccount(email, password);
      if (!account) {
        setFormError("Invalid campus email or password.");
        setFormLoading(false);
        return;
      }
      onLogin(toAppUser(account.name, account.email, account.role));
    }, 500);
  }

  return (
    <div className="min-h-screen bg-[#070b14] grid-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm mx-4 animate-fade-up">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-xl bg-[#0d1525] border border-[#1e3058] flex items-center justify-center glow-cyan">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 3L4 9v8c0 6.6 5.1 12.8 12 14 6.9-1.2 12-7.4 12-14V9L16 3z" stroke="#00d4ff" strokeWidth="1.5" fill="rgba(0,212,255,0.08)" strokeLinejoin="round"/>
                <path d="M11 16l3.5 3.5L21 12" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="22" cy="9" r="3" fill="#ef4444" className="animate-blink"/>
              </svg>
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-widest text-white uppercase">
            Sentinel<span className="text-[#00d4ff]">X</span>
          </h1>
          <p className="text-[#4a6090] text-xs font-mono mt-1 tracking-widest uppercase">
            Campus Safety &amp; Risk Analytics
          </p>
        </div>

        <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-8">
          <h2 className="font-display text-lg font-semibold text-[#e2eaf8] tracking-wide mb-1">
            Secure Sign-In
          </h2>
          <p className="text-[#4a6090] text-xs mb-8">
            Authorized personnel only. All access is logged and monitored.
          </p>

          {googleLoading ? (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[#1e3058] border-t-[#00d4ff] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-[#e2eaf8] text-sm font-medium">Signing you in</p>
                <p className="text-[#4a6090] text-xs mt-1 font-mono">Verifying Google session…</p>
              </div>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-blink" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {GOOGLE_CLIENT_ID ? (
                <div className="mb-1 flex justify-center">
                  <div ref={buttonHostRef} />
                  {!googleReady && (
                    <p className="text-[#4a6090] text-xs font-mono mt-2">Loading Google Sign-In…</p>
                  )}
                </div>
              ) : (
                <div className="w-full rounded-xl border border-dashed border-[#1e3058] bg-white/[0.02] px-4 py-3.5 text-center mb-4">
                  <p className="text-[#e2eaf8] text-xs font-medium">Google Sign-In isn't configured</p>
                  <p className="text-[#4a6090] text-[11px] mt-1 font-mono">Set VITE_GOOGLE_CLIENT_ID in .env</p>
                </div>
              )}

              {googleError && (
                <p className="text-[#ef4444] text-xs text-center mt-2 mb-2">{googleError}</p>
              )}

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#1e3058]" />
                <span className="text-[#4a6090] text-xs font-mono">OR</span>
                <div className="flex-1 h-px bg-[#1e3058]" />
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Campus email address"
                  autoComplete="email"
                  className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-4 py-3 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none transition-colors font-mono"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-4 py-3 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none transition-colors font-mono"
                />
                {formError && <p className="text-[#ef4444] text-xs">{formError}</p>}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn-primary w-full rounded-lg py-3 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? "Signing In…" : "Sign In"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-[#2d4a7a] text-xs mt-6 font-mono">
          Session encrypted · Access audited · v2.4.1
        </p>
      </div>
    </div>
  );
}

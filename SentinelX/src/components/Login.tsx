import { useState } from "react";
import type { User } from "../context/AppContext";

const googleAccounts: User[] = [
  { name: "Dr. Priya Sharma", email: "p.sharma@vitstudent.ac.in", role: "Administrator", avatar: "PS" },
  { name: "Lt. Kavita Nair", email: "k.nair@vitstudent.ac.in", role: "Security Officer", avatar: "KN" },
  { name: "Dr. Meera Iyer", email: "m.iyer@vitstudent.ac.in", role: "Analyst", avatar: "MI" },
  { name: "Rohan Verma", email: "r.verma@vitstudent.ac.in", role: "Staff", avatar: "RV" },
  { name: "Ananya Gupta", email: "a.gupta@vitstudent.ac.in", role: "Student", avatar: "AG" },
];

const ALLOWED_EMAIL_PATTERN = /^[A-Z0-9._%+-]+@vitstudent\.ac\.in$/i;

const ROLE_COLORS: Record<string, string> = {
  Administrator: "#ef4444",
  "Security Officer": "#00d4ff",
  Analyst: "#7c3aed",
  Staff: "#10b981",
  Student: "#f59e0b",
};

interface Props {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleAccountSelect(account: User) {
    if (!ALLOWED_EMAIL_PATTERN.test(account.email)) {
      setShowPicker(false);
      setAuthError("Access denied. Use a valid @vitstudent.ac.in account.");
      return;
    }
    setAuthError("");
    setSelectedAccount(account);
    setShowPicker(false);
    setLoading(true);
    setTimeout(() => onLogin(account), 1800);
  }

  function handleEmailSignIn() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!ALLOWED_EMAIL_PATTERN.test(normalizedEmail)) {
      setAuthError("Access denied. Only @vitstudent.ac.in email addresses are allowed.");
      return;
    }
    if (!password.trim()) {
      setAuthError("Enter your password to continue.");
      return;
    }

    const knownAccount = googleAccounts.find(account => account.email === normalizedEmail);
    const localName = normalizedEmail
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    const generatedName = localName || "VIT Student";
    const account: User = knownAccount ?? {
      name: generatedName,
      email: normalizedEmail,
      role: "Student",
      avatar: generatedName
        .split(" ")
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };

    setAuthError("");
    setSelectedAccount(account);
    setLoading(true);
    setTimeout(() => onLogin(account), 1000);
  }

  function handleSignUp() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim().replace(/\s+/g, " ");
    if (normalizedName.length < 2) {
      setAuthError("Enter your full name.");
      return;
    }
    if (!ALLOWED_EMAIL_PATTERN.test(normalizedEmail)) {
      setAuthError("Registration is only available to @vitstudent.ac.in addresses.");
      return;
    }
    if (password.length < 8) {
      setAuthError("Create a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    const account: User = {
      name: normalizedName,
      email: normalizedEmail,
      role: "Student",
      avatar: normalizedName
        .split(" ")
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
    setAuthError("");
    setSelectedAccount(account);
    setLoading(true);
    setTimeout(() => onLogin(account), 1000);
  }

  function switchMode(mode: "signin" | "signup") {
    setAuthMode(mode);
    setAuthError("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen bg-[#070b14] grid-bg flex items-center justify-center relative overflow-y-auto py-8">
      <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm mx-4 animate-fade-up">
        <div className="flex flex-col items-center mb-7">
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
          <div className="grid grid-cols-2 gap-1 bg-[#070b14] border border-[#1e3058] rounded-lg p-1 mb-5">
            {(["signin", "signup"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => switchMode(mode)}
                className={`rounded-md py-2 text-xs font-mono uppercase tracking-wider transition-colors ${authMode === mode ? "bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20" : "text-[#4a6090] border border-transparent hover:text-[#e2eaf8]"}`}
              >
                {mode === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <h2 className="font-display text-lg font-semibold text-[#e2eaf8] tracking-wide mb-1">
            {authMode === "signin" ? "Secure Sign-In" : "Create Student Account"}
          </h2>
          <p className="text-[#4a6090] text-xs mb-6">
            {authMode === "signin"
              ? "Use your authorized @vitstudent.ac.in account. All access is logged."
              : "Registration is open to verified VIT student email addresses."}
          </p>

          {loading ? (
            <div className="flex flex-col items-center py-6 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[#1e3058] border-t-[#00d4ff] animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-[#e2eaf8] text-sm font-medium">{authMode === "signup" ? "Creating student account" : "Authenticating securely"}</p>
                <p className="text-[#4a6090] text-xs mt-1 font-mono">{selectedAccount?.email}</p>
                <p className="text-[#2d4a7a] text-xs mt-0.5 font-mono">Role: {selectedAccount?.role}</p>
              </div>
              <div className="flex gap-1 mt-2">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-blink" style={{ animationDelay: `${i * 0.3}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {authMode === "signin" && <button
                onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-[#1e3058] hover:border-[#2a4580] text-[#e2eaf8] rounded-xl py-3.5 px-4 transition-all duration-200 group mb-4"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium">Continue with Google</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="ml-auto opacity-40 group-hover:opacity-70 transition-opacity">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>}

              {authMode === "signin" && <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#1e3058]" />
                <span className="text-[#4a6090] text-xs font-mono">OR</span>
                <div className="flex-1 h-px bg-[#1e3058]" />
              </div>}

              <div className="space-y-3">
                {authMode === "signup" && (
                  <input
                    type="text"
                    value={fullName}
                    onChange={event => { setFullName(event.target.value); setAuthError(""); }}
                    placeholder="Full name"
                    autoComplete="name"
                    className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-4 py-3 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none transition-colors"
                  />
                )}
                <input
                  type="email"
                  value={email}
                  onChange={event => { setEmail(event.target.value); setAuthError(""); }}
                  onKeyDown={event => event.key === "Enter" && (authMode === "signin" ? handleEmailSignIn() : handleSignUp())}
                  placeholder="name@vitstudent.ac.in"
                  autoComplete="email"
                  className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-4 py-3 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none transition-colors font-mono"
                />
                <input
                  type="password"
                  value={password}
                  onChange={event => { setPassword(event.target.value); setAuthError(""); }}
                  onKeyDown={event => event.key === "Enter" && handleEmailSignIn()}
                  placeholder="Password"
                  autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                  className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-4 py-3 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none transition-colors font-mono"
                />
                {authMode === "signup" && (
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={event => { setConfirmPassword(event.target.value); setAuthError(""); }}
                    onKeyDown={event => event.key === "Enter" && handleSignUp()}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="w-full bg-[#0a1020] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-4 py-3 text-sm text-[#e2eaf8] placeholder-[#2d4a7a] outline-none transition-colors font-mono"
                  />
                )}
                {authError && (
                  <div role="alert" className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg px-3 py-2.5 text-xs text-[#ef4444] font-mono">
                    {authError}
                  </div>
                )}
                <button onClick={authMode === "signin" ? handleEmailSignIn : handleSignUp} className="btn-primary w-full rounded-lg py-3 text-sm uppercase tracking-widest">
                  {authMode === "signin" ? "Sign In" : "Create Student Account"}
                </button>
              </div>

              {/* Role quick-access hint */}
              <p className="text-center text-[#2d4a7a] text-xs font-mono mt-4">
                {authMode === "signin" ? "New VIT accounts receive Student access by default" : "Student role · VIT Vellore safety access"}
              </p>
            </>
          )}
        </div>

        <p className="text-center text-[#2d4a7a] text-xs mt-6 font-mono">Session encrypted · Access audited · v2.4.1</p>
      </div>

      {showPicker && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0d1525] border border-[#1e3058] rounded-2xl p-6 w-[340px] animate-fade-up">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <p className="text-[#e2eaf8] text-sm font-semibold">Choose an account</p>
            </div>
            <p className="text-[#4a6090] text-xs mb-4 pl-6">to continue to SentinelX</p>
            <div className="space-y-1.5">
              {googleAccounts.map(acc => {
                const rc = ROLE_COLORS[acc.role] || "#4a6090";
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleAccountSelect(acc)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#111e35] transition-colors text-left group border border-transparent hover:border-[#1e3058]"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xs"
                      style={{ background: `${rc}20`, border: `1px solid ${rc}40`, color: rc }}
                    >
                      {acc.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e2eaf8] truncate">{acc.name}</p>
                      <p className="text-xs text-[#4a6090] font-mono truncate">{acc.email}</p>
                    </div>
                    <span className="badge text-[10px] px-1.5 flex-shrink-0" style={{ background: `${rc}15`, color: rc, border: `1px solid ${rc}30` }}>
                      {acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1e3058]">
              <button onClick={() => setShowPicker(false)} className="w-full text-[#4a6090] text-xs hover:text-[#e2eaf8] transition-colors py-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

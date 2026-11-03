import { useEffect, useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { User } from "../context/AppContext";

const demoAccounts: User[] = [
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
  Analyst: "#a78bfa",
  Staff: "#10b981",
  Student: "#f59e0b",
};

type AuthMode = "signin" | "signup";
type Props = { onLogin: (user: User) => void };

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getNameFromEmail(email: string) {
  const name = email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return name || "VIT Student";
}

function ShieldMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" aria-hidden="true">
      <path
        d="M20 3.5 5.5 10v9.1c0 8 6.1 15.2 14.5 17.4 8.4-2.2 14.5-9.4 14.5-17.4V10L20 3.5Z"
        stroke="#00d4ff"
        strokeWidth="1.6"
        fill="rgba(0,212,255,.08)"
      />
      <path d="m13.5 20 4.2 4.2 9-9.3" stroke="#00d4ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30.5" cy="10" r="3" fill="#ef4444" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  trailing,
  onKeyDown,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  trailing?: React.ReactNode;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7890b8]">{label}</span>
      <span className="flex items-center rounded-xl border border-[#263b60] bg-[#080f1d] transition focus-within:border-[#00d4ff] focus-within:ring-2 focus-within:ring-[#00d4ff]/10">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-[#e2eaf8] outline-none placeholder:text-[#425779]"
        />
        {trailing}
      </span>
    </label>
  );
}

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredAccounts = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    if (!query) return demoAccounts;
    return demoAccounts.filter((account) =>
      [account.name, account.email, account.role].some((value) => value.toLowerCase().includes(query)),
    );
  }, [pickerSearch]);

  // Clear the pending demo transition if the component unmounts.
  useEffect(() => {
    if (!loading || !selectedAccount) return;
    const timeout = window.setTimeout(() => onLogin(selectedAccount), 850);
    return () => window.clearTimeout(timeout);
  }, [loading, selectedAccount, onLogin]);

  function resetMessages() {
    setError("");
    setNotice("");
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    resetMessages();
  }

  function beginLogin(account: User) {
    setSelectedAccount(account);
    setLoading(true);
    setShowPicker(false);
    setPickerSearch("");
    resetMessages();
  }

  function validateEmail(value: string) {
    return ALLOWED_EMAIL_PATTERN.test(value.trim());
  }

  function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setError("Access is restricted to valid @vitstudent.ac.in email addresses.");
      return;
    }
    if (password.length === 0) {
      setError("Enter your password to continue.");
      return;
    }

    const knownAccount = demoAccounts.find((account) => account.email.toLowerCase() === normalizedEmail);
    const name = getNameFromEmail(normalizedEmail);
    const account: User = knownAccount ?? {
      name,
      email: normalizedEmail,
      role: "Student",
      avatar: getInitials(name),
    };
    beginLogin(account);
  }

  function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim().replace(/\s+/g, " ");

    if (normalizedName.length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!validateEmail(normalizedEmail)) {
      setError("Registration is available only to @vitstudent.ac.in addresses.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError("For this demo, include at least one letter and one number in your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    if (demoAccounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
      setError("This demo account already exists. Sign in or use another student email.");
      return;
    }

    const account: User = {
      name: normalizedName,
      email: normalizedEmail,
      role: "Student",
      avatar: getInitials(normalizedName),
    };
    beginLogin(account);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (mode === "signin") handleSignIn(event);
    else handleSignUp(event);
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setShowPicker(false);
      setError("");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060a12] px-4 py-10 text-[#e2eaf8]">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.07] blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[520px] w-[520px] rounded-full bg-violet-600/[0.07] blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{
        backgroundImage: "linear-gradient(rgba(30,48,88,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(30,48,88,.45) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
        maskImage: "linear-gradient(to bottom, black, transparent 85%)",
      }} />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#203455] bg-[#0b1220]/95 shadow-[0_30px_100px_rgba(0,0,0,.5)] lg:grid-cols-[1.02fr_.98fr]">
        <aside className="relative hidden min-h-[680px] flex-col justify-between overflow-hidden border-r border-[#203455] bg-[#0a1424] p-10 lg:flex">
          <div className="absolute -right-28 top-24 h-80 w-80 rounded-full border border-[#00d4ff]/10" />
          <div className="absolute -right-16 top-36 h-56 w-56 rounded-full border border-[#00d4ff]/10" />
          <div className="absolute bottom-20 left-10 h-48 w-48 rounded-full bg-cyan-500/[0.06] blur-3xl" />
          <div className="relative">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.08] shadow-[0_0_35px_rgba(0,212,255,.08)]">
                <ShieldMark />
              </div>
              <div>
                <p className="font-display text-2xl font-bold tracking-[0.18em] text-white">SENTINEL<span className="text-[#00d4ff]">X</span></p>
                <p className="mt-0.5 text-[9px] font-mono uppercase tracking-[0.25em] text-[#6d83a8]">Campus safety platform</p>
              </div>
            </div>
            <div className="mt-16 max-w-md">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#00d4ff]">Security operations / VIT Vellore</p>
              <h1 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white">
                A safer campus starts with <span className="text-[#00d4ff]">awareness.</span>
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-[#8295b5]">
                A central workspace for reporting incidents, reviewing alerts and coordinating campus safety activity.
              </p>
            </div>
          </div>

          <div className="relative space-y-3">
            {[
              { number: "01", title: "Report", description: "Capture and submit campus incidents." },
              { number: "02", title: "Review", description: "Help authorized teams assess incoming reports." },
              { number: "03", title: "Respond", description: "Track assignments and incident progress." },
            ].map((item) => (
              <div key={item.number} className="flex items-center gap-4 rounded-xl border border-[#1d3152] bg-[#0d1a2d]/80 p-3.5">
                <span className="font-mono text-xs text-[#00d4ff]">{item.number}</span>
                <div>
                  <p className="text-xs font-semibold text-[#dce7f8]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#687fa3]">{item.description}</p>
                </div>
              </div>
            ))}
            <p className="pt-3 text-[10px] font-mono tracking-wide text-[#526887]">SENTINELX · ACCESS PORTAL · DEMO BUILD</p>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col justify-center px-6 py-8 sm:px-10 lg:px-11">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#00d4ff]/30 bg-[#00d4ff]/[0.08]">
              <ShieldMark />
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-[0.16em] text-white">SENTINEL<span className="text-[#00d4ff]">X</span></p>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#6d83a8]">Campus safety platform</p>
            </div>
          </div>

          <div className="mb-7">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#00d4ff]">Authorized access</p>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#7186a8]">
              {mode === "signin"
                ? "Sign in with your VIT student email to continue."
                : "Register for student access using your VIT email address."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-[#203455] bg-[#070d18] p-1">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => switchMode(item)}
                aria-pressed={mode === item}
                className={`rounded-lg px-3 py-2.5 text-xs font-semibold transition ${mode === item ? "border border-[#00d4ff]/25 bg-[#00d4ff]/10 text-[#00d4ff] shadow-sm" : "text-[#7186a8] hover:bg-white/[0.03] hover:text-white"}`}
              >
                {item === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-[330px] flex-col items-center justify-center text-center" role="status" aria-live="polite">
              <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#203455] border-t-[#00d4ff]" />
                <ShieldMark />
              </div>
              <p className="text-sm font-semibold text-white">{mode === "signup" ? "Preparing your student account" : "Verifying access"}</p>
              <p className="mt-2 max-w-xs break-all font-mono text-[11px] text-[#7186a8]">{selectedAccount?.email}</p>
              <span className="mt-3 rounded-full border border-[#00d4ff]/20 bg-[#00d4ff]/[0.07] px-3 py-1 text-[10px] text-[#00d4ff]">
                {selectedAccount?.role}
              </span>
            </div>
          ) : (
            <>
              {mode === "signin" && (
                <>
                  <button
                    type="button"
                    onClick={() => { setShowPicker(true); resetMessages(); }}
                    className="group mb-4 flex w-full items-center gap-3 rounded-xl border border-[#263b60] bg-white/[0.035] px-4 py-3.5 text-left transition hover:border-[#49658e] hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/40"
                  >
                    <GoogleMark />
                    <span className="flex-1 text-sm font-medium text-[#dce7f8]">Choose a demo account</span>
                    <span className="text-xs text-[#6f84a5] transition group-hover:translate-x-0.5">→</span>
                  </button>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#203455]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#526887]">or use email</span>
                    <div className="h-px flex-1 bg-[#203455]" />
                  </div>
                </>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {mode === "signup" && (
                  <Field
                    id="full-name"
                    label="Full name"
                    value={fullName}
                    onChange={(value) => { setFullName(value); setError(""); }}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    onKeyDown={handleFormKeyDown}
                  />
                )}

                <Field
                  id="email"
                  label="VIT email address"
                  type="email"
                  value={email}
                  onChange={(value) => { setEmail(value); setError(""); }}
                  placeholder="name@vitstudent.ac.in"
                  autoComplete="email"
                  onKeyDown={handleFormKeyDown}
                />

                <Field
                  id="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(value) => { setPassword(value); setError(""); }}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  onKeyDown={handleFormKeyDown}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="px-4 py-3 text-[11px] font-semibold text-[#7186a8] hover:text-[#00d4ff]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />

                {mode === "signup" && (
                  <Field
                    id="confirm-password"
                    label="Confirm password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(value) => { setConfirmPassword(value); setError(""); }}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    onKeyDown={handleFormKeyDown}
                  />
                )}

                {mode === "signin" && (
                  <div className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="text-[#637a9c]">Access restricted to VIT student email addresses</span>
                    <span className="shrink-0 text-[#00d4ff]">Student portal</span>
                  </div>
                )}

                {error && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-3.5 py-3 text-xs leading-5 text-red-300">
                    <span aria-hidden="true">!</span>
                    <span>{error}</span>
                  </div>
                )}
                {notice && (
                  <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-3.5 py-3 text-xs text-emerald-300">
                    {notice}
                  </div>
                )}

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#00c4eb] px-4 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#04111b] shadow-[0_8px_28px_rgba(0,196,235,.14)] transition hover:-translate-y-0.5 hover:bg-[#36d8f5] hover:shadow-[0_12px_32px_rgba(0,196,235,.22)] focus:outline-none focus:ring-2 focus:ring-[#00d4ff] focus:ring-offset-2 focus:ring-offset-[#0b1220]"
                >
                  {mode === "signin" ? "Sign in securely" : "Create student account"}
                  <span className="transition group-hover:translate-x-1">→</span>
                </button>
              </form>
              <p className="mt-5 text-center text-[10px] leading-5 text-[#526887]">
                {mode === "signin"
                  ? "New VIT accounts receive the Student role in this demo."
                  : "New registrations are assigned the Student role."}
              </p>
            </>
          )}

          <div className="mt-8 border-t border-[#203455] pt-5">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] font-mono uppercase tracking-[0.12em] text-[#526887]">
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Demo portal ready</span>
              <span>Role-based interface</span>
              <span>SentinelX · v2.5</span>
            </div>
            <p className="mt-3 text-center text-[9px] leading-4 text-[#405575]">
              Demonstration interface only. Connect a verified authentication service before using real accounts or passwords.
            </p>
          </div>
        </section>
      </div>

      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPicker(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-account-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-[#294268] bg-[#0c1525] shadow-2xl"
          >
            <div className="border-b border-[#203455] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/[0.08]">
                    <GoogleMark />
                  </div>
                  <div>
                    <h3 id="demo-account-title" className="text-sm font-semibold text-white">Select a demo identity</h3>
                    <p className="mt-1 text-[10px] text-[#7186a8]">Choose a role to preview its dashboard.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowPicker(false)} aria-label="Close account picker" className="rounded-lg px-2 py-1 text-lg text-[#7186a8] hover:bg-white/5 hover:text-white">×</button>
              </div>
              <input
                autoFocus
                value={pickerSearch}
                onChange={(event) => setPickerSearch(event.target.value)}
                onKeyDown={handleFormKeyDown}
                placeholder="Search name, email or role..."
                aria-label="Search demo accounts"
                className="mt-4 w-full rounded-xl border border-[#263b60] bg-[#070d18] px-4 py-3 text-xs text-white outline-none placeholder:text-[#526887] focus:border-[#00d4ff]"
              />
            </div>
            <div className="max-h-[min(55vh,390px)] space-y-1 overflow-y-auto p-3">
              {filteredAccounts.length ? filteredAccounts.map((account) => {
                const color = ROLE_COLORS[account.role] || "#7890b8";
                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => beginLogin(account)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-[#294268] hover:bg-[#132139] focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ color, background: `${color}18`, border: `1px solid ${color}45` }}>
                      {account.avatar}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-[#e2eaf8]">{account.name}</span>
                      <span className="mt-1 block truncate font-mono text-[10px] text-[#7186a8]">{account.email}</span>
                    </span>
                    <span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold" style={{ color, background: `${color}15`, border: `1px solid ${color}35` }}>
                      {account.role}
                    </span>
                  </button>
                );
              }) : (
                <p className="px-4 py-10 text-center text-xs text-[#7186a8]">No demo accounts match that search.</p>
              )}
            </div>
            <div className="border-t border-[#203455] px-5 py-3">
              <p className="text-[9px] leading-4 text-[#526887]">These are local demonstration identities, not Google OAuth accounts.</p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

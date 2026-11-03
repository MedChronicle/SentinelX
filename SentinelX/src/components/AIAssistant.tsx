import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAppState } from "../context/AppContext";
import { heatmapZones, incidentTypeData, mlInsights } from "../data/mockData";
import { SEVERITY_META, bySeverityThenScore, parseTs, type Alert, type Incident } from "../data/domain";

/* ───────────── Intent registry ───────────── */

interface Ctx {
  incidents: readonly Incident[];
  alerts: readonly Alert[];
  canAccess: (page: string) => boolean;
}

interface Intent {
  id: string;
  match: RegExp;
  /** The user needs access to at least one of these pages. Empty means open to everyone. */
  needs: readonly string[];
  /** Used in the "no access" reply */
  deniedLabel: string;
  example: string;
  answer: (c: Ctx) => string;
}

const SLA_HOURS = 4;
const isOpen = (i: Incident) => i.status !== "Resolved" && i.status !== "Closed";
const list = <T,>(items: readonly T[], f: (t: T, i: number) => string, sep = "\n\n") => items.map(f).join(sep);

/** Mock data is dated September 2026, so "now" is the newest incident timestamp rather than the real clock. */
function dataClock(incidents: readonly Incident[]): number {
  return incidents.reduce((max, i) => Math.max(max, parseTs(i.time)?.getTime() ?? 0), 0);
}

const INTENTS: Intent[] = [
  {
    id: "risk",
    match: /high[- ]?risk|risk(y)? location|riskiest/i,
    needs: ["riskmap", "analytics"],
    deniedLabel: "risk location data",
    example: "Show high-risk locations this week",
    answer: () => {
      const top = [...heatmapZones].sort((a, b) => b.risk - a.risk).slice(0, 3); // copy: never sort shared data in place
      return `Top 3 high-risk locations:\n\n${list(top, (z, i) =>
        `${i + 1}. **${z.name}** — risk ${z.risk}/100 (${z.trend})\n   ${z.incidents} incidents`)}\n\nSuggested action for **${top[0].name}**: ${top[0].action}`;
    },
  },
  {
    id: "types",
    match: /incident types?|most common|increased|trending|rising/i,
    needs: ["analytics"],
    deniedLabel: "analytics data",
    example: "Which incident type is most common?",
    answer: () => {
      const types = [...incidentTypeData].sort((a, b) => b.value - a.value).slice(0, 3);
      const rising = [...heatmapZones].sort((a, b) => parseFloat(b.trend) - parseFloat(a.trend)).slice(0, 3);
      return `Most common incident types:\n\n${list(types, (t, i) => `${i + 1}. **${t.name}** — ${t.value} incidents`, "\n")}` +
        `\n\nFastest-rising locations:\n\n${list(rising, (z) => `• **${z.name}** ${z.trend}`, "\n")}`;
    },
  },
  {
    id: "sla",
    match: /\bsla\b|unresolved|exceed|overdue|breach/i,
    needs: ["incidents"],
    deniedLabel: "incident data",
    example: "Which unresolved incidents exceeded SLA?",
    answer: ({ incidents }) => {
      const open = incidents.filter((i) => i.status === "Open" || i.status === "Investigating").sort(bySeverityThenScore);
      const now = dataClock(incidents);
      const breached = open
        .filter((i) => i.assigned === "Unassigned")
        .map((i) => ({ i, hours: (now - (parseTs(i.time)?.getTime() ?? now)) / 36e5 }))
        .filter((x) => x.hours > SLA_HOURS);
      const sla = breached.length
        ? `Past the ${SLA_HOURS}h assignment SLA:\n\n${list(breached, ({ i, hours }) => `• **${i.id}** — unassigned for ${Math.round(hours)}h`, "\n")}`
        : `No unassigned incidents are past the ${SLA_HOURS}h SLA.`;
      return `${open.length} incidents are open or under investigation:\n\n${list(open.slice(0, 4), (i) =>
        `• **${i.id}** — ${i.type} (${i.severity})\n  Assigned: ${i.assigned} · ${i.time}`)}\n\n${sla}`;
    },
  },
  {
    id: "critical",
    match: /critical|urgent/i,
    needs: ["incidents"],
    deniedLabel: "incident data",
    example: "How many critical incidents are open?",
    answer: ({ incidents }) => {
      const crit = incidents.filter((i) => i.severity === "Critical" && isOpen(i));
      if (!crit.length) return "There are no open critical incidents.";
      return `${crit.length} open critical incident${crit.length > 1 ? "s" : ""}:\n\n${list(crit, (i) =>
        `• **${i.id}** — ${i.type}\n  Status: ${i.status} · risk ${i.riskScore}`)}`;
    },
  },
  {
    id: "alerts",
    match: /alerts?/i,
    needs: ["alerts"],
    deniedLabel: "alert data",
    example: "Show active alerts",
    answer: ({ alerts }) => {
      const active = alerts.filter((a) => a.status === "Active")
        .sort((a, b) => SEVERITY_META[a.severity].rank - SEVERITY_META[b.severity].rank);
      if (!active.length) return "There are no active alerts right now.";
      return `${active.length} active alerts:\n\n${list(active.slice(0, 4), (a) =>
        `• **${a.id}** [${a.severity}] — ${a.rule}\n  ${a.description}`)}${active.length > 4 ? `\n\n…and ${active.length - 4} more.` : ""}`;
    },
  },
  {
    id: "ml",
    match: /\b(anomal\w*|ml|machine learning|predict\w*)\b/i,
    needs: ["ml"],
    deniedLabel: "ML Insights (Analyst or Administrator access)",
    example: "Any ML anomalies?",
    answer: () => {
      const top = [...mlInsights].sort((a, b) => b.confidence - a.confidence).slice(0, 3);
      return `${mlInsights.length} ML insights flagged. Highest confidence:\n\n${list(top, (m) =>
        `• **${m.type}** at ${m.location} — ${m.confidence}% (${m.model})\n  ${m.detail}`)}\n\nThese are **risk indicators**, not certainties.`;
    },
  },
  {
    id: "help",
    match: /\bhelp\b|what can you/i,
    needs: [],
    deniedLabel: "",
    example: "Help",
    answer: (c) => {
      const ok = INTENTS.filter((i) => i.id !== "help" && (!i.needs.length || i.needs.some(c.canAccess)));
      return `I can answer questions about campus safety data you’re authorized to see. Try:\n\n${list(ok, (i) => `• “${i.example}”`, "\n")}\n\n_Answers follow your role’s permissions, so some data may be hidden._`;
    },
  },
];

function respond(query: string, ctx: Ctx): string {
  const intent = INTENTS.find((i) => i.match.test(query));
  if (!intent) return `I’m not sure how to answer that. Type “help” to see what I can look up.`;
  if (intent.needs.length && !intent.needs.some(ctx.canAccess)) return `You don’t have access to ${intent.deniedLabel}.`;
  return intent.answer(ctx);
}

/* ───────────── UI ───────────── */

interface Message { id: string; from: "user" | "ai"; text: string }

/** Renders **bold** and _italic_ instead of stripping the markers. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold text-white">{p.slice(2, -2)}</strong>
        : p.length > 2 && p.startsWith("_") && p.endsWith("_") ? <em key={i} className="text-text-muted">{p.slice(1, -1)}</em>
        : p)}
    </>
  );
}

const newId = () => crypto.randomUUID();
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function AIAssistant() {
  const { user, incidents, alerts, canAccess } = useAppState();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [{
    id: newId(), from: "ai",
    text: `Hello, ${user?.name?.split(" ").filter((w) => !/\.$/.test(w))[0] ?? "there"}. I can answer questions about campus safety data you’re authorized to see. Pick a question below or type “help”.`,
  }]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ctxRef = useRef<Ctx>({ incidents, alerts, canAccess });
  ctxRef.current = { incidents, alerts, canAccess }; // answers use data as of when they're produced

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, typing]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // Starter questions only for what this role may ask
  const suggestions = useMemo(
    () => INTENTS.filter((i) => i.id !== "help" && i.needs.some(canAccess)).slice(0, 3).map((i) => i.example),
    [canAccess],
  );

  function ask(raw: string) {
    const q = raw.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { id: newId(), from: "user", text: q }]);
    setInput("");
    setTyping(true);
    timer.current = setTimeout(() => {
      setMessages((m) => [...m, { id: newId(), from: "ai", text: respond(q, ctxRef.current) }]);
      setTyping(false);
    }, 600 + Math.random() * 400);
  }

  function close() { setOpen(false); fabRef.current?.focus(); }
  function onPanelKeyDown(e: KeyboardEvent) { if (e.key === "Escape") close(); }

  return (
    <>
      <button
        ref={fabRef}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="assistant-panel"
        aria-label={open ? "Close SentinelX AI" : "Ask SentinelX AI"}
        title="Ask SentinelX AI"
        className="fixed bottom-6 right-6 z-150 w-14 h-14 rounded-full bg-linear-to-br from-cyan to-purple flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgb(0_212_255/0.3)]"
      >
        <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-bg)" strokeWidth="2.5">
          {open ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /><circle cx="9" cy="10" r="1" fill="var(--color-bg)" /><circle cx="12" cy="10" r="1" fill="var(--color-bg)" /><circle cx="15" cy="10" r="1" fill="var(--color-bg)" /></>}
        </svg>
      </button>

      {open && (
        <div id="assistant-panel" role="dialog" aria-label="SentinelX AI assistant" onKeyDown={onPanelKeyDown}
             className="fixed bottom-24 right-6 z-150 w-[min(20rem,calc(100vw-3rem))] h-[min(460px,calc(100dvh-8rem))] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden animate-fade-up shadow-[0_0_40px_rgb(0_0_0/0.6)]">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-cyan/30 to-purple/30 border border-border flex items-center justify-center">
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-display font-semibold text-text tracking-wide">SentinelX AI</p>
              <p className="text-[10px] font-mono text-green">● Online · {user?.role} access</p>
            </div>
          </div>

          <div role="log" aria-live="polite" className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line border text-text ${
                  m.from === "user" ? "bg-cyan/15 border-cyan/20" : "bg-surface-2 border-border"}`}>
                  <RichText text={m.text} />
                </div>
              </div>
            ))}

            {messages.length === 1 && suggestions.length > 0 && (
              <div className="flex flex-col items-start gap-1.5">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => ask(s)}
                          className="text-left text-xs font-mono text-cyan border border-cyan/25 rounded-lg px-2.5 py-1.5 hover:bg-cyan/10 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-surface-2 border border-border rounded-xl px-3 py-2 flex gap-1">
                  <span className="sr-only">Assistant is typing</span>
                  {[0, 1, 2].map((i) => (
                    <div key={i} aria-hidden className="w-1.5 h-1.5 rounded-full bg-cyan animate-blink" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={(e: FormEvent) => { e.preventDefault(); ask(input); }} className="p-3 border-t border-border">
            <div className="flex gap-2">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                     aria-label="Message" placeholder="Ask about campus safety…" autoComplete="off"
                     className="flex-1 bg-bg border border-border focus:border-cyan rounded-lg px-3 py-2 text-xs text-text placeholder-text-dim outline-none font-mono" />
              <button type="submit" disabled={!input.trim() || typing} aria-label="Send message"
                      className="w-9 h-9 rounded-lg bg-cyan/20 border border-cyan/30 text-cyan flex items-center justify-center hover:bg-cyan/30 transition-colors disabled:opacity-30">
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="text-text-dim text-[10px] font-mono mt-1.5 text-center">Risk indicators only — not certainties</p>
          </form>
        </div>
      )}
    </>
  );
}

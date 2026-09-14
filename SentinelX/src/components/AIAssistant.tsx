import { useState, useRef, useEffect } from "react";
import { useApp, PAGE_PERMISSIONS } from "../context/AppContext";
import { heatmapZones, locationRiskData, incidentTypeData } from "../data/mockData";

interface Message {
  from: "user" | "ai";
  text: string;
}

function getAnswer(query: string, role: string, incidents: any[], alerts: any[]): string {
  const q = query.toLowerCase();
  const allowedPages = PAGE_PERMISSIONS[role as keyof typeof PAGE_PERMISSIONS] ?? [];

  if (q.includes("high-risk") || q.includes("high risk") || q.includes("risk location")) {
    if (!allowedPages.includes("riskmap") && !allowedPages.includes("analytics")) return "⚠️ You don't have access to risk location data.";
    const top = heatmapZones.sort((a, b) => b.risk - a.risk).slice(0, 3);
    return `Top 3 high-risk locations this week:\n\n${top.map((z, i) => `${i + 1}. **${z.name}** — Risk Score: ${z.risk}/100 (${z.trend})\n   ${z.incidents} incidents`).join("\n\n")}\n\nRecommend prioritizing ${top[0].name} for immediate patrol.`;
  }

  if (q.includes("incident type") || q.includes("increased") || q.includes("most common")) {
    const sorted = [...incidentTypeData].sort((a, b) => b.value - a.value);
    return `Top incident types this month:\n\n${sorted.slice(0, 3).map((t, i) => `${i + 1}. **${t.name}** — ${t.value} incidents`).join("\n")}\n\n**${sorted[0].name}** is the highest category. Network Security alerts rose 18% this week.`;
  }

  if (q.includes("sla") || q.includes("unresolved") || q.includes("exceeded")) {
    const open = incidents.filter(i => i.status === "Open" || i.status === "Investigating");
    return `${open.length} incidents currently open or under investigation:\n\n${open.slice(0, 4).map(i => `• **${i.id}** — ${i.type} (${i.severity})\n  Assigned: ${i.assigned} · ${i.time}`).join("\n\n")}\n\nINC-2883 and INC-2889 have **exceeded SLA** (unassigned >4h).`;
  }

  if (q.includes("critical") || q.includes("urgent")) {
    const crits = incidents.filter(i => i.severity === "Critical");
    return `${crits.length} critical incidents:\n\n${crits.map(i => `• **${i.id}** — ${i.type}\n  Status: ${i.status} · Risk: ${i.riskScore}`).join("\n\n")}`;
  }

  if (q.includes("alert") || q.includes("active alert")) {
    if (!allowedPages.includes("alerts")) return "⚠️ You don't have access to alert data.";
    const active = alerts.filter(a => a.status === "Active");
    return `${active.length} active alerts right now:\n\n${active.slice(0, 4).map(a => `• **${a.id}** [${a.severity}] — ${a.rule}\n  ${a.description}`).join("\n\n")}`;
  }

  if (q.includes("help") || q.includes("what can you")) {
    return `I can answer questions about campus safety data you're authorized to see. Try:\n\n• "Show high-risk locations this week"\n• "Which incident type increased the most?"\n• "Which unresolved incidents exceeded SLA?"\n• "How many critical incidents are open?"\n• "Show active alerts"\n\n_I respect your role permissions — some data may not be visible to all roles._`;
  }

  if (q.includes("anomaly") || q.includes("ml") || q.includes("prediction")) {
    if (!allowedPages.includes("ml") && role !== "Administrator") return "⚠️ ML Insights require Analyst or Administrator access.";
    return `ML engine detected **8 anomalies** today:\n\n• Isolation Forest flagged unusual port-scan at IT Hub (94% confidence)\n• Random Forest predicts elevated risk at Server Room within 6h (87%)\n• Time-Series ARIMA shows +8% weekly trend in Parking Lot B\n\nAll predictions are **risk indicators**, not certainties.`;
  }

  return `I'm not sure how to answer that. Try asking about:\n• High-risk locations\n• Incident trends\n• SLA breaches\n• Active alerts\n• ML anomalies\n\nType "help" to see all supported queries.`;
}

export default function AIAssistant() {
  const { user, incidents, alerts, canAccess } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "ai", text: `Hello, ${user?.name?.split(" ")[0] ?? "there"}. I'm the SentinelX AI assistant. I can answer questions about campus safety data you're authorized to see. Type "help" to get started.` }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const q = input.trim();
    if (!q) return;
    setMessages(prev => [...prev, { from: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const answer = getAnswer(q, user?.role ?? "Student", incidents, alerts);
      setMessages(prev => [...prev, { from: "ai", text: answer }]);
      setTyping(false);
    }, 800 + Math.random() * 400);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-[150] w-14 h-14 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#7c3aed] flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
        style={{ boxShadow: "0 0 30px rgba(0,212,255,0.3)" }}
        title="Ask SentinelX AI"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#070b14" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#070b14" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            <circle cx="9" cy="10" r="1" fill="#070b14"/><circle cx="12" cy="10" r="1" fill="#070b14"/><circle cx="15" cy="10" r="1" fill="#070b14"/>
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-[150] w-80 bg-[#0d1525] border border-[#1e3058] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up"
          style={{ height: 460, boxShadow: "0 0 40px rgba(0,0,0,0.6)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e3058] bg-[#070b14]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff]/30 to-[#7c3aed]/30 border border-[#1e3058] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-display font-semibold text-[#e2eaf8] tracking-wide">SentinelX AI</p>
              <p className="text-[10px] font-mono text-[#10b981]">● Online · {user?.role} access</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    m.from === "user"
                      ? "bg-[#00d4ff]/15 border border-[#00d4ff]/20 text-[#e2eaf8]"
                      : "bg-[#111e35] border border-[#1e3058] text-[#e2eaf8]"
                  }`}
                >
                  {m.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-[#111e35] border border-[#1e3058] rounded-xl px-3 py-2 flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-blink" style={{ animationDelay: `${i*0.2}s` }}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#1e3058]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask about campus safety…"
                className="flex-1 bg-[#070b14] border border-[#1e3058] focus:border-[#00d4ff] rounded-lg px-3 py-2 text-xs text-[#e2eaf8] placeholder-[#2d4a7a] outline-none font-mono"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-lg bg-[#00d4ff]/20 border border-[#00d4ff]/30 text-[#00d4ff] flex items-center justify-center hover:bg-[#00d4ff]/30 transition-colors disabled:opacity-30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            <p className="text-[#2d4a7a] text-[10px] font-mono mt-1.5 text-center">Risk indicators only — not certainties</p>
          </div>
        </div>
      )}
    </>
  );
}

import { useApp } from "../context/AppContext";

const ICONS = {
  success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
};

const BORDER_COLORS = { success: "#10b981", error: "#ef4444", warning: "#f59e0b", info: "#00d4ff" };

export default function Toasts() {
  const { toasts, dismissToast } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-[#0d1525] border rounded-xl px-4 py-3 flex items-start gap-3 shadow-2xl pointer-events-auto animate-fade-up"
          style={{ borderColor: BORDER_COLORS[t.type], boxShadow: `0 0 20px ${BORDER_COLORS[t.type]}20` }}
        >
          <span className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#e2eaf8] font-display">{t.title}</p>
            {t.message && <p className="text-xs text-[#4a6090] mt-0.5 line-clamp-2">{t.message}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-[#4a6090] hover:text-[#e2eaf8] flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      ))}
    </div>
  );
}

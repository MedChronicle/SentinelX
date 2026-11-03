import { useEffect, useState, type CSSProperties } from "react";
import { useAppActions, useAppState } from "../context/AppContext";
import type { Toast } from "../context/AppContext";

/** Keep in sync with TOAST_MS in AppContext.tsx, which does the actual dismissing. */
const AUTO_DISMISS_MS = 5000;

type ToastType = Toast["type"];

const TONE: Record<ToastType, string> = {
  success: "var(--color-green)",
  error: "var(--color-red)",
  warning: "var(--color-amber)",
  info: "var(--color-cyan)",
};

/** One icon component, coloured through currentColor, instead of four hard-coded SVGs. */
const ICON_PATHS: Record<ToastType, React.ReactNode> = {
  success: <polyline points="20 6 9 17 4 12" />,
  error: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
};

function ToastIcon({ type }: { type: ToastType }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[type]}
    </svg>
  );
}

/** Shrinks over the auto-dismiss time so people can see how long a message will stay. */
function Countdown({ ms }: { ms: number }) {
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRunning(true)); // start after first paint so the transition runs
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden rounded-b-xl">
      <div className="h-full w-full bg-(--tone) opacity-60"
           style={{ transformOrigin: "left", transform: `scaleX(${running ? 0 : 1})`, transition: `transform ${ms}ms linear` }} />
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      // Errors interrupt screen readers; everything else waits its turn
      role={toast.type === "error" ? "alert" : "status"}
      className="relative bg-surface border rounded-xl px-4 py-3 flex items-start gap-3 shadow-2xl pointer-events-auto animate-fade-up"
      style={{
        "--tone": TONE[toast.type],
        borderColor: "var(--tone)",
        boxShadow: "0 0 20px color-mix(in oklab, var(--tone) 12%, transparent)",
      } as CSSProperties}
    >
      <span className="shrink-0 mt-0.5 text-(--tone)"><ToastIcon type={toast.type} /></span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text font-display">{toast.title}</p>
        {toast.message && <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{toast.message}</p>}
      </div>
      <button onClick={() => onDismiss(toast.id)} aria-label={`Dismiss notification: ${toast.title}`}
              className="text-text-muted hover:text-text shrink-0 rounded">
        <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <Countdown ms={AUTO_DISMISS_MS} />
    </div>
  );
}

export default function Toasts() {
  const { toasts } = useAppState();
  const { dismissToast } = useAppActions();

  // The container always renders, so screen readers have already registered the live region when a toast arrives
  return (
    <section aria-label="Notifications"
             className="fixed bottom-6 right-6 z-200 flex flex-col gap-2 pointer-events-none w-[min(340px,calc(100vw-3rem))]">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />)}
    </section>
  );
}

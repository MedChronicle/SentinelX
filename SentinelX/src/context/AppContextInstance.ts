import { createContext, useContext } from "react";
import type { User } from "./AppContext"; // type-only import, erased at build time, so no runtime cycle

/**
 * Context identity lives in this non-component module so Fast Refresh never
 * swaps it out while consumers from the previous render still hold the old one.
 */

/** Fields App.tsx relies on today. Extend with whatever else your provider exposes. */
export interface AppContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  isLocked: boolean;
  showLogoutModal: boolean;
  setShowLogoutModal: (open: boolean) => void;
  /** Seconds left before the session expires */
  sessionExpiry: number;
}

/** null means "no provider above", which the hook turns into a clear error. */
export const AppContext = createContext<AppContextValue | null>(null);
AppContext.displayName = "AppContext";

/** Strict consumer: callers get a non-null, fully typed value or an immediate, readable failure. */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) {
    throw new Error("useApp must be called inside <AppProvider>. Check that the component is rendered under it.");
  }
  return ctx;
}

/**
 * Reusable factory for any future context (theme, toasts, filters), same pattern, one line:
 *   const [ToastContext, useToast] = createStrictContext<ToastValue>("Toast");
 */
export function createStrictContext<T>(name: string) {
  const Context = createContext<T | null>(null);
  Context.displayName = name;

  function useStrictContext(): T {
    const value = useContext(Context);
    if (value === null) throw new Error(`use${name} must be called inside <${name}Provider>.`);
    return value;
  }

  return [Context, useStrictContext] as const;
}

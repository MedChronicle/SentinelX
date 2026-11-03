/// <reference types="vite/client" />

/* -------------------------------------------------------------------------- */
/*  Build-time constants (defined in vite.config.ts under `define`)           */
/* -------------------------------------------------------------------------- */

declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string

/* -------------------------------------------------------------------------- */
/*  Environment variables (only VITE_-prefixed ones reach client code)        */
/* -------------------------------------------------------------------------- */

interface ImportMetaEnv {
  /** Base URL of your backend API, e.g. https://api.example.com */
  readonly VITE_API_URL?: string
  /** Free-form label for the deployment, e.g. "staging" or "production" */
  readonly VITE_APP_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/* -------------------------------------------------------------------------- */
/*  Globals added by index.html                                               */
/* -------------------------------------------------------------------------- */

interface Window {
  /** Applies and saves the theme. Defined by the inline script in index.html. */
  __setTheme?: (mode: 'light' | 'dark' | 'system') => void
}

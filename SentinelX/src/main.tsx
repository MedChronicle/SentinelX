import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from './App'
import './index.css'

/* -------------------------------------------------------------------------- */
/*  Error boundary: a render error shows a recovery screen instead of a blank  */
/*  page. Styles reuse the --boot-* variables defined in index.html.           */
/* -------------------------------------------------------------------------- */

type BoundaryState = { error: Error | null }

class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError('render', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
          background: 'var(--boot-bg, #fff)',
          color: 'var(--boot-fg, #111827)',
          font: '500 14px/1.5 system-ui, sans-serif',
        }}
      >
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 16 }}>Something went wrong.</p>
          <p style={{ margin: '0 0 16px', color: 'var(--boot-muted, #6b7280)', fontWeight: 400 }}>
            Try again, or reload the page if the problem continues.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button type="button" onClick={() => this.setState({ error: null })} style={buttonStyle}>
              Try again
            </button>
            <button type="button" onClick={() => location.reload()} style={buttonStyle}>
              Reload
            </button>
          </div>
          {import.meta.env.DEV && (
            <pre
              style={{
                marginTop: 16,
                maxWidth: '90vw',
                overflow: 'auto',
                textAlign: 'left',
                fontSize: 12,
              }}
            >
              {this.state.error.stack ?? this.state.error.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}

const buttonStyle = {
  border: 0,
  borderRadius: 8,
  padding: '8px 16px',
  background: 'var(--boot-accent, #6366f1)',
  color: '#fff',
  font: 'inherit',
  cursor: 'pointer',
} as const

/* -------------------------------------------------------------------------- */
/*  Central error reporting: one place to plug in Sentry, LogRocket, etc.     */
/* -------------------------------------------------------------------------- */

function reportError(source: string, error: unknown, extra?: string | null) {
  console.error(`[${source}]`, error, extra ?? '')
  // Example: Sentry.captureException(error, { extra: { source, componentStack: extra } })
}

/* -------------------------------------------------------------------------- */
/*  Mount                                                                     */
/* -------------------------------------------------------------------------- */

const container = document.getElementById('root')
if (!container) {
  throw new Error('Missing #root element. Check that index.html contains <div id="root"></div>.')
}

// Reuse the same root across hot reloads so state and warnings don't pile up in dev.
const globalRef = window as unknown as { __appRoot?: Root }
const root =
  globalRef.__appRoot ??
  createRoot(container, {
    onUncaughtError: (error) => reportError('uncaught', error),
    onCaughtError: (error) => reportError('caught', error),
    onRecoverableError: (error) => reportError('recoverable', error),
  })
globalRef.__appRoot = root

root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

if (import.meta.env.DEV) {
  console.info(`App v${__APP_VERSION__} (dev) built ${__BUILD_TIME__}`)
}

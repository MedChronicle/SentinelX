# SentinelX

**Campus Safety & Risk Analytics dashboard** — a role-based security operations console for tracking incidents, alerts, and risk across a campus.

> **Note:** SentinelX is a front-end prototype. All data is mock data held in browser memory, and authentication is simulated. There is no backend, and nothing is persisted between page reloads. See [Limitations](#limitations).

## Features

- **Dashboard** — live operations overview with key metrics and quick navigation
- **Incidents** — create, filter, assign, comment on, and change the status of incidents; export the filtered list to CSV
- **Risk Map** — campus heatmap of high-risk zones with trend indicators
- **Analytics** — incident trends and breakdowns by type and location (Recharts)
- **Alerts** — acknowledge, dismiss, or escalate alerts; new alerts are generated periodically to simulate a live feed
- **ML Insights** — risk predictions and model output views
- **Audit Trail** — hash-chained activity log with a chain verification tool
- **User Management** — view users and roles
- **Settings** — SLA thresholds, notification toggles, and security configuration
- **AI Assistant** — floating chat panel that answers questions about incidents, alerts, and risk locations, respecting the signed-in user's role
- **Session security** — 15-minute inactivity countdown, session lock screen, and a sign-out confirmation

## Role-Based Access

Page access depends on the signed-in user's role:

| Page             | Administrator | Security Officer | Analyst | Staff | Student |
| ---------------- | :-----------: | :--------------: | :-----: | :---: | :-----: |
| Dashboard        |       ✅       |        ✅         |    ✅    |   ✅   |    ✅    |
| Incidents        |       ✅       |        ✅         |    ✅    |   ✅   |    ✅    |
| Risk Map         |       ✅       |        ✅         |    ✅    |       |         |
| Analytics        |       ✅       |                  |    ✅    |       |         |
| Alerts           |       ✅       |        ✅         |         |   ✅   |         |
| ML Insights      |       ✅       |                  |    ✅    |       |         |
| Audit Trail      |       ✅       |        ✅         |         |       |         |
| User Management  |       ✅       |                  |         |       |         |
| Settings         |       ✅       |                  |         |       |         |

Pages a role can't access show an "Access Restricted" screen. The permission map lives in `PAGE_PERMISSIONS` in `src/context/AppContext.tsx`.

## Tech Stack

- [React 19](https://react.dev) + TypeScript
- [Vite 8](https://vite.dev)
- [Tailwind CSS 4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [Recharts](https://recharts.org) for charts
- pnpm for package management

## Getting Started

### Prerequisites

- Node.js 22
- pnpm 10 (`npm i -g pnpm`)

### Install and run

```bash
pnpm install
pnpm dev
```

The dev server starts at **http://localhost:8443**. To use a different port:

```bash
PORT=3000 pnpm dev
```

### Other commands

| Command        | What it does                                |
| -------------- | ------------------------------------------- |
| `pnpm dev`     | Start the development server                |
| `pnpm build`   | Production build to `dist/` |
| `pnpm preview` | Serve the production build locally          |
| `pnpm format`  | Format the code with oxfmt                  |

To type-check without building: `npx tsc --noEmit`.

## Signing In

Sign-in is simulated. Only `@vitstudent.ac.in` addresses are accepted, and **any non-empty password works**.

| Email                       | Role             |
| --------------------------- | ---------------- |
| `p.sharma@vitstudent.ac.in` | Administrator    |
| `k.nair@vitstudent.ac.in`   | Security Officer |
| `m.iyer@vitstudent.ac.in`   | Analyst          |
| `r.verma@vitstudent.ac.in`  | Staff            |
| `a.gupta@vitstudent.ac.in`  | Student          |

You can also use **Continue with Google** to pick one of these accounts from a mock account chooser. Any other `@vitstudent.ac.in` email, including new sign-ups, gets the **Student** role.

## Project Structure

```
SentinelX/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── src/
    ├── main.tsx              # App entry point
    ├── App.tsx               # Layout, page routing, permission checks
    ├── index.css             # Tailwind import, fonts, theme styles
    ├── context/
    │   ├── AppContext.tsx    # Global state: user, incidents, alerts, audit log, session
    │   └── AppContextInstance.ts
    ├── data/
    │   └── mockData.ts       # All sample incidents, alerts, users, zones, charts
    └── components/
        ├── Login.tsx
        ├── Sidebar.tsx
        ├── Dashboard.tsx
        ├── Incidents.tsx
        ├── RiskMap.tsx
        ├── Analytics.tsx
        ├── Alerts.tsx
        ├── MLInsights.tsx
        ├── AuditTrail.tsx
        ├── UserManagement.tsx
        ├── Settings.tsx
        ├── AIAssistant.tsx
        ├── SessionLock.tsx
        └── Toast.tsx
```

## Limitations

- **No backend or database.** State resets on every reload.
- **Simulated authentication.** Passwords aren't checked, and role is determined by email. Don't deploy this as a real access-control system.
- **Mock data.** Incidents, alerts, users, and ML predictions are all sample data from `src/data/mockData.ts`.
- **Rule-based AI Assistant.** It matches keywords in your question (for example "critical", "alerts", "high-risk locations") against the in-memory data. It does not call an AI model.
- **Fixed header date.** The date in the top bar is hardcoded demo text, not the real time.
- **Settings are display-only** in several places (for example the session timeout row shows 8 hours, while the actual inactivity timer is 15 minutes).
- **Google Fonts** are loaded from the web, so fonts fall back to system defaults when offline.

## Ideas for Next Steps

- Add a real backend and database (for example Oracle SQL or PostgreSQL) for incidents, users, and the audit log
- Replace simulated login with real OAuth restricted to the campus domain
- Persist the audit hash chain server-side so tampering is detectable across sessions
- Swap the rule-based assistant for a real model-backed one
- Code-split the bundle (it currently exceeds Vite's 500 kB chunk warning)

# 🛡️ SentinelX

### Intelligent Security Operations & Incident Response Dashboard

SentinelX is a modern **Security Operations Center (SOC) dashboard** designed to help security teams monitor alerts, investigate incidents, visualize organizational risk, analyze security trends, and maintain an auditable incident-response workflow.

The platform combines a centralized security dashboard with **incident management, risk visualization, analytics, ML-driven insights, alerts, and audit tracking** in a single interface.

> **SentinelX is currently a frontend-focused prototype using structured mock security data, with a roadmap toward real-time SIEM integration, backend services, machine learning pipelines, and cryptographic audit verification.**

---

## 🚀 Key Features

### 📊 Security Dashboard

* Centralized security operations overview
* Active incident monitoring
* Security alert statistics
* Risk indicators
* Incident severity distribution
* Security activity summaries
* Real-time-style dashboard experience

### 🚨 Incident Management

* View and track security incidents
* Severity classification
* Incident status tracking
* Analyst assignment
* Incident investigation workflow
* Incident metadata and timelines

### 🗺️ Risk Map

* Visual representation of security risks
* Geographic risk monitoring
* High-risk location identification
* Security-event visualization

### 📈 Security Analytics

* Incident trends
* Alert statistics
* Risk analysis
* Security activity patterns
* Interactive charts and visualizations

### 🔔 Alert Management

* Centralized security alerts
* Alert severity classification
* Alert status monitoring
* Security-event overview

### 🤖 ML Insights

Designed as the foundation for future machine-learning-powered security analysis.

Planned capabilities include:

* Anomaly detection
* Threat classification
* Risk prediction
* Incident prioritization
* Suspicious activity detection
* Security trend forecasting

### 🔐 Audit Trail

SentinelX includes an audit-focused interface designed for future integration with **tamper-evident security records and cryptographic verification**.

Future implementations can provide:

* Hash-based audit records
* Event integrity verification
* Tamper detection
* Immutable audit history
* Cryptographic chain-of-custody

### 👥 User Management

Role-based users are supported in the current prototype, including:

* Administrator
* Security Officer
* Analyst
* Staff
* Student

### ⚙️ Settings

Centralized application configuration and user settings.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      SentinelX       │
                         │   Security Dashboard │
                         └──────────┬───────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
      │   Alerts    │       │  Incidents  │       │  Risk Map   │
      └─────────────┘       └─────────────┘       └─────────────┘
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │    Analytics    │
                           └────────┬────────┘
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                  ┌─────────────┐       ┌─────────────┐
                  │ ML Insights │       │ Audit Trail │
                  └─────────────┘       └─────────────┘
                                   
                         Future Backend Layer
                                    │
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
        ┌──────────┐           ┌──────────┐          ┌──────────┐
        │   SIEM   │           │ Database │          │ ML Model │
        └──────────┘           └──────────┘          └──────────┘
```

---

# 🧰 Tech Stack

| Technology                   | Purpose                        |
| ---------------------------- | ------------------------------ |
| **React 19**                 | Frontend framework             |
| **TypeScript**               | Type-safe development          |
| **Vite**                     | Development and build tooling  |
| **Tailwind CSS v4**          | UI styling                     |
| **Recharts**                 | Data visualization             |
| **Google Identity Services** | Optional Google authentication |
| **Netlify**                  | Deployment                     |
| **Vercel**                   | Deployment                     |

---

# 📁 Project Structure

```text
sentinelx/
│
├── src/
│   ├── components/
│   │   ├── Analytics.tsx
│   │   ├── Alerts.tsx
│   │   ├── AuditTrail.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Incidents.tsx
│   │   ├── Login.tsx
│   │   ├── MLInsights.tsx
│   │   ├── RiskMap.tsx
│   │   ├── Settings.tsx
│   │   ├── Sidebar.tsx
│   │   └── UserManagement.tsx
│   │
│   ├── data/
│   │   └── mockData.ts
│   │
│   ├── lib/
│   │   └── auth.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── netlify.toml
├── vercel.json
├── tsconfig.json
└── README.md
```

---

# 💻 Getting Started

## Prerequisites

Make sure you have:

* Node.js 22+
* pnpm 10+
* Git

Check your versions:

```bash
node --version
pnpm --version
```

---

## Installation

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd sentinelx
```

Install dependencies:

```bash
pnpm install
```

Create the environment file:

```bash
cp .env.example .env
```

Start the development server:

```bash
pnpm dev
```

The application will be available through the local Vite development server.

---

# 🔑 Authentication

SentinelX currently supports two authentication paths:

### Demo Authentication

The prototype includes predefined demo accounts for testing different roles.

| Role             | Email                 | Password      |
| ---------------- | --------------------- | ------------- |
| Administrator    | `p.sharma@campus.edu` | `admin123`    |
| Security Officer | `k.nair@campus.edu`   | `security123` |
| Analyst          | `m.iyer@campus.edu`   | `analyst123`  |
| Staff            | `a.rao@campus.edu`    | `staff123`    |
| Student          | `r.verma@campus.edu`  | `student123`  |

> These credentials are for demonstration purposes only and must not be used in a production environment.

### Google Sign-In

Google authentication can be enabled using a Google OAuth Client ID.

Add the following variable to `.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Google authentication requires the deployed application's domain to be configured as an authorized JavaScript origin.

---

# 📊 Current Data Model

The current version uses structured mock security data.

The architecture is intentionally designed so that mock data can later be replaced with a backend API.

```text
Mock Data
    │
    ▼
React Components
    │
    ▼
Dashboard / Analytics / Incidents
    │
    ▼
Future REST API
    │
    ├── PostgreSQL / Oracle
    ├── SIEM
    ├── ML Service
    └── Cryptographic Audit Service
```

---

# 🔐 Security Architecture — Future Direction

A major goal of SentinelX is to evolve from a dashboard prototype into a complete security monitoring and incident-response platform.

The planned security architecture includes:

### SIEM Integration

Integrate SentinelX with SIEM platforms to ingest:

* Authentication events
* Network events
* Endpoint alerts
* Firewall events
* IDS/IPS alerts
* Suspicious activities

### Cryptographic Audit Trail

Security-critical events can be protected using cryptographic hashing.

Example conceptual flow:

```text
Event 1
  │
  ▼
SHA-256 Hash
  │
  ▼
Event 2 + Previous Hash
  │
  ▼
SHA-256 Hash
  │
  ▼
Event 3 + Previous Hash
  │
  ▼
Tamper-Evident Chain
```

If an historical event is modified, subsequent hash verification can detect the change.

### Role-Based Access Control

Future backend authorization can enforce permissions based on:

```text
Administrator
      │
      ├── User Management
      ├── Security Configuration
      └── Full Audit Access

Security Officer
      │
      ├── Incident Management
      └── Security Monitoring

Analyst
      │
      ├── Investigation
      ├── Analytics
      └── ML Insights

Staff / Student
      │
      └── Limited Access
```

---

# 🤖 Machine Learning Roadmap

The ML module is intended to become one of the core intelligence layers of SentinelX.

Potential models include:

### Anomaly Detection

Detect unusual behavior in:

* Login activity
* Network traffic
* User behavior
* System events

### Threat Classification

Automatically classify alerts into categories such as:

```text
Malware
Phishing
Brute Force
DDoS
Unauthorized Access
Data Exfiltration
Insider Threat
Suspicious Activity
```

### Risk Prediction

Generate a dynamic risk score based on:

```text
Threat Severity
       +
Asset Criticality
       +
Historical Incidents
       +
User Behavior
       +
Alert Frequency
       =
Overall Risk Score
```

### Intelligent Incident Prioritization

ML models can help security analysts identify which incidents require immediate attention.

---

# 🛣️ Roadmap

## Phase 1 — Dashboard Prototype ✅

* [x] React dashboard
* [x] Security overview
* [x] Incident management UI
* [x] Alerts
* [x] Analytics
* [x] Risk map
* [x] ML insights interface
* [x] Audit trail interface
* [x] User management
* [x] Demo authentication

## Phase 2 — Backend

* [ ] REST API
* [ ] Persistent database
* [ ] Real authentication
* [ ] Role-based authorization
* [ ] Incident CRUD operations
* [ ] Alert ingestion
* [ ] Secure session management

## Phase 3 — Security Intelligence

* [ ] SIEM integration
* [ ] IDS/IPS integration
* [ ] Real-time alert ingestion
* [ ] Automated threat classification
* [ ] Anomaly detection
* [ ] Risk scoring
* [ ] ML-based incident prioritization

## Phase 4 — Cryptographic Integrity

* [ ] SHA-256 audit hashing
* [ ] Hash-chain implementation
* [ ] Tamper detection
* [ ] Cryptographic verification
* [ ] Secure chain-of-custody records

## Phase 5 — Production Platform

* [ ] Real-time WebSocket updates
* [ ] Distributed event processing
* [ ] Advanced RBAC
* [ ] Security notifications
* [ ] Automated incident response
* [ ] Security reports
* [ ] Cloud deployment
* [ ] Monitoring and observability

---

# 🌐 Deployment

SentinelX is configured for deployment on both **Netlify** and **Vercel**.

### Build

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

The production build is generated inside:

```text
dist/
```

---

# ⚠️ Current Limitations

SentinelX is currently a **frontend prototype**.

The following components are not yet production-ready:

* Mock security data
* Local demo authentication
* No persistent backend database
* No real SIEM ingestion
* No production ML inference pipeline
* No server-side authentication verification
* No real-time security event stream
* No cryptographically enforced audit ledger

These limitations are intentional and form the basis of the project's future development roadmap.

---

# 🎯 Project Objectives

SentinelX aims to address several common challenges faced by security teams:

1. **Fragmented security information**
   Bring incidents, alerts, analytics, and risk information into one interface.

2. **Slow incident prioritization**
   Use intelligent risk scoring and ML-assisted analysis.

3. **Limited visibility**
   Provide centralized dashboards and geographic risk visualization.

4. **Audit integrity**
   Introduce cryptographic mechanisms to detect unauthorized modification of security records.

5. **Scalability**
   Design the frontend architecture so it can later connect to distributed backend services and real-time security infrastructure.

---

# 🔮 Future Enhancements

Potential long-term capabilities include:

* Real-time SOC monitoring
* Automated threat hunting
* AI-assisted incident investigation
* Natural-language security queries
* Automated incident-response playbooks
* MITRE ATT&CK mapping
* Threat intelligence feeds
* CVE vulnerability integration
* Endpoint telemetry
* Network traffic analysis
* Security posture scoring
* Predictive threat analytics
* Cryptographically verifiable incident reports
* Post-quantum cryptographic support for future secure communications

---

# 🧪 Development

Format the project using:

```bash
pnpm format
```

Build the project:

```bash
pnpm build
```

Run locally:

```bash
pnpm dev
```

---

# 🤝 Contributing

Contributions are welcome.

A typical workflow:

```bash
git checkout -b feature/new-feature
```

Make your changes, test the application, and commit:

```bash
git add .
git commit -m "Add new security feature"
```

Push the branch:

```bash
git push origin feature/new-feature
```

Then open a Pull Request.

---

# 📜 License

This project is intended for educational, research, and development purposes.

Add an appropriate open-source license before distributing the project publicly.

---

# 👨‍💻 Project Status

**Status:** 🚧 Active Development

SentinelX is currently evolving from a frontend SOC dashboard prototype toward a complete intelligent security monitoring and incident-response platform.

### Vision

> **Detect → Analyze → Prioritize → Investigate → Verify → Respond**

SentinelX aims to bring these stages together into a unified security operations platform.

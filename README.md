# 🛡️ SentinelX

## Intelligent Campus Safety & Risk Analytics Platform

SentinelX is a modern, industry-style Security Operations and Campus Safety dashboard built to centralize incident reporting, security alerts, risk visualization, analytics, ML-assisted insights, user access control, and auditable incident-response workflows.

The current release is a **frontend-focused functional prototype** built with React, TypeScript, Vite, Tailwind CSS, and Recharts. It uses structured mock data while implementing realistic dashboard interactions, role-based views, incident workflows, alert actions, session controls, an AI assistant, ML insight visualizations, and a tamper-evident audit-chain interface.

> **Important:** SentinelX currently demonstrates the product and workflow layer. Backend APIs, Oracle persistence, production authentication, real SIEM ingestion, and production ML inference remain future integration layers.

---

## ✨ What's Implemented

This version is significantly beyond a static dashboard. The current build includes:

- Role-based access and navigation
- Five user roles
- Functional incident reporting
- Incident search and multi-filtering
- Incident status updates
- Incident assignment/reassignment
- Incident comments and investigation timeline
- CSV incident export
- Live-style alert generation
- Alert acknowledgement
- Alert escalation
- Alert dismissal with mandatory reason
- Configurable alert-rule interface
- Campus risk heatmap
- Risk-zone filtering and replay controls
- Analytics dashboard with interactive charts
- ML model comparison
- Anomaly detection interface
- SHAP-style feature-importance explanations
- Permission-aware SentinelX AI assistant
- Tamper-evident audit hash-chain visualization
- Audit-chain integrity verification
- Audit filtering and inspection
- Automatic audit logging for important actions
- Session inactivity lock
- Session countdown
- Demo session unlock
- Toast notifications
- User management interface
- Role permission matrix
- User invitation interface
- System settings
- SLA configuration
- ML/risk configuration controls
- Notification settings
- OAuth/security settings interface
- System-health monitoring interface
- Dedicated Student "My Reports" experience
- Responsive dark SOC-style interface

---

# 🚀 Core Modules

## 1. 📊 Security Dashboard

The main dashboard provides a centralized security overview.

### Current capabilities

- Open incident count
- Critical incident count
- Active alert count
- Campus risk score
- Top risk locations
- Incident activity
- Security summaries
- Role-specific dashboard experience

Students receive a simplified dashboard focused on their own reports.

---

## 2. 🚨 Incident Management

SentinelX includes a complete frontend incident workflow.

### Incident information

Each incident can contain:

- Incident ID
- Incident type
- Description
- Location
- Severity
- Reporter
- Reporter email
- Assigned personnel
- Status
- Timestamp
- Risk score
- Evidence/reference
- Investigation timeline
- Comments

### Incident statuses

```text
Open
Investigating
Escalated
Resolved
Closed
```

### Implemented actions

- Report a new incident
- Search incidents
- Filter by type
- Filter by severity
- Filter by status
- Filter by location
- Filter by date range
- View incident details
- Change incident status
- Reassign incidents
- Add investigation comments
- Export filtered incidents as CSV

---

## 3. ⚠️ Alert Management

SentinelX includes a centralized alert-management workflow.

### Alert statuses

```text
Active
Acknowledged
Dismissed
Resolved
```

### Implemented actions

Authorized users can:

- Acknowledge alerts
- Escalate alerts
- Dismiss alerts
- Provide a dismissal reason
- View alert details

Important alert actions automatically generate audit records.

### Current alert rules

The interface includes rules for:

- Critical incident → immediate escalation
- Repeated location → elevated risk
- SLA exceeded → escalation
- ML anomaly cluster → alert generation
- High-risk zone monitoring

Some rules are currently represented as configurable prototype logic/UI rather than a production event-processing engine.

---

# 🗺️ Risk Map

The Risk Map provides a visual campus threat overview.

### Current capabilities

- Campus risk zones
- Risk score visualization
- Incident density
- Critical/High/Moderate/Low zones
- Location details
- Risk trends
- Recommended actions
- Location-based filtering
- Incident-type filtering
- Severity filtering
- Date/replay controls
- Historical risk-style visualization

The map is currently a frontend visualization based on structured campus risk data.

---

# 📈 Security Analytics

The Analytics module provides security intelligence through interactive charts.

### Current analytics

- 10-day incident volume
- Incidents by hour
- Incident type distribution
- Average resolution time
- SLA targets
- Location risk analysis
- Incident trends
- Risk distribution

The analytics layer is designed so that the current mock datasets can later be replaced with database/API data.

---

# 🤖 ML Insights

SentinelX includes an ML-oriented decision-support interface.

### Current model views

- Random Forest
- XGBoost
- Logistic Regression
- Isolation Forest

### Current evaluation display

The prototype visualizes:

- Accuracy
- Precision
- Recall
- F1-score
- AUC-ROC
- Model comparison
- Training-set size
- Model version
- Model status

### Current anomaly interface

Detected insights can be expanded to show:

- Prediction type
- Confidence score
- Location
- Model used
- Explanation
- SHAP-style feature importance

### Responsible AI

ML outputs are explicitly presented as:

> **Risk indicators for decision support, not certainties.**

They are not intended to establish culpability or make deterministic claims about crime or individual behavior.

The current ML page is a **prototype visualization using structured data**, not a live production inference pipeline.

---

# 🧠 SentinelX AI Assistant

SentinelX includes a built-in AI-assistant interface for security-data queries.

The assistant can answer supported questions such as:

```text
Show high-risk locations this week.
Which incident type increased the most?
Which unresolved incidents exceeded SLA?
How many critical incidents are there?
Show active alerts.
```

### Permission awareness

The assistant checks the current user's role and authorized pages before returning protected categories of information.

This establishes the foundation for a future backend-connected AI assistant with database-level authorization.

> The current assistant uses predefined application logic and structured data. It is not yet connected to an external LLM or production database.

---

# 🔐 Audit Trail

One of the major SentinelX features is the audit-trail interface.

Important actions generate audit records containing information such as:

- Audit ID
- User
- Action
- Entity
- Previous value
- New value
- Timestamp
- IP/reference
- Hash
- Previous hash

### Current audit events include

```text
INCIDENT_CREATED
INCIDENT_STATUS_CHANGED
INCIDENT_ASSIGNED
ALERT_GENERATED
ALERT_ACKNOWLEDGED
ALERT_DISMISSED
USER_ROLE_MODIFIED
ML_PREDICTION_STORED
```

### Hash-chain visualization

The audit interface links each record to the previous hash:

```text
Audit Record 1
      ↓
Hash 1
      ↓
Audit Record 2 + Previous Hash
      ↓
Hash 2
      ↓
Audit Record 3 + Previous Hash
      ↓
Tamper-Evident Chain
```

The interface includes a **Verify Chain Integrity** action that checks the relationship between stored hashes.

### Current limitation

The frontend prototype generates demonstration hash values locally. It is **not yet a production SHA-256 cryptographic ledger**.

Future backend implementation can replace this with:

- SHA-256 hashing
- Server-side verification
- Digital signatures
- Immutable storage
- Cryptographic chain-of-custody
- Secure audit retention

---

# 👥 Role-Based Access Control

SentinelX currently defines five roles:

| Role | Main Access |
|---|---|
| Administrator | Full platform access |
| Security Officer | Incidents, alerts, risk monitoring, audit |
| Analyst | Analytics, ML, risk monitoring, incidents |
| Staff | Dashboard, incidents, alerts |
| Student | Dashboard and personal incident reports |

### Administrator

Access to:

- Dashboard
- Incidents
- Risk Map
- Analytics
- Alerts
- ML Insights
- Audit Trail
- User Management
- Settings

### Security Officer

Access to:

- Dashboard
- Incident Management
- Risk Map
- Alerts
- Audit Trail

### Analyst

Access to:

- Dashboard
- Analytics
- ML Insights
- Risk Map
- Incidents

### Staff

Access to:

- Dashboard
- Incidents
- Alerts

### Student

Access to:

- Dashboard
- My Reports

The current role system is implemented at the frontend/application level. Server-side authorization is a planned backend feature.

---

# 🔑 Authentication & Session Security

The current prototype provides a role-based demonstration sign-in flow.

### Demo accounts

| Role | Account |
|---|---|
| Administrator | p.sharma@campus.edu |
| Security Officer | k.nair@campus.edu |
| Analyst | m.iyer@campus.edu |
| Staff | r.verma@campus.edu |
| Student | a.gupta@campus.edu |

The login screen presents a Google-style authentication flow for demonstration purposes.

### Session controls

SentinelX currently implements:

- 15-minute inactivity timeout
- Session countdown
- Automatic session lock
- Activity-based timer reset
- Session unlock screen
- Logout flow
- Access auditing UI

> Authentication is currently a frontend prototype. Password hashing, JWT/session validation, real Google OAuth verification, and server-side authentication are future backend responsibilities.

---

# 🔔 Toast & Notification System

SentinelX includes an application-wide notification system for important events.

Examples:

- Incident created
- Incident updated
- Incident reassigned
- Alert acknowledged
- Alert escalated
- Alert dismissed
- New simulated alert
- Configuration saved
- Validation errors

Notifications automatically disappear after a short period and can be dismissed manually.

---

# 👤 User Management

Administrators have a dedicated User Management interface.

### Current capabilities

- View users
- Filter by role
- View account status
- View user ID
- View last login
- View incident count
- Edit user interface
- Suspend user interface
- Invite users
- Google OAuth invitation option
- Role permission matrix

The current module is designed as the frontend foundation for a production identity and authorization service.

---

# ⚙️ System Settings

The Settings module provides centralized platform configuration.

### Current controls

#### SLA Configuration

- High-severity SLA
- Critical-severity SLA

#### ML & Risk Engine

- Anomaly confidence threshold
- ML predictions toggle
- Auto-escalation
- Retraining schedule interface

#### Notifications

- Email alerts
- SMS alerts

#### Authentication

- Google OAuth 2.0 status
- Campus-domain restriction display
- MFA requirement display

#### System Health

The interface monitors services such as:

- API Gateway
- Database
- ML Engine

with status, uptime, and latency indicators.

These are currently prototype configuration/status controls.

---

# 🏗️ Current Architecture

```text
                    ┌─────────────────────────┐
                    │       SentinelX         │
                    │  React Security Portal  │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
   Incidents                  Alerts                  Risk Map
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                                 ▼
                         Analytics Layer
                                 │
                  ┌──────────────┼──────────────┐
                  ▼              ▼              ▼
             ML Insights    AI Assistant    Audit Trail
                                 │
                                 ▼
                         Application State
                                 │
                                 ▼
                    Future Backend / REST API
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
        Oracle DB             SIEM              ML Service
```

---

# 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Frontend framework |
| TypeScript 5.7 | Type-safe development |
| Vite 8 | Development/build tooling |
| Tailwind CSS 4 | UI styling |
| Recharts 3 | Data visualization |
| Node.js 22+ | Runtime |
| pnpm 10+ | Package management |
| Git | Version control |

### Current dependency architecture

The application currently focuses on the frontend and does not yet require:

- FastAPI
- Oracle Database
- PostgreSQL
- External ML service
- External LLM API
- SIEM API

Those are planned integration layers.

---

# 📁 Project Structure

```text
sentinelx/
│
├── src/
│   ├── components/
│   │   ├── AIAssistant.tsx
│   │   ├── Alerts.tsx
│   │   ├── Analytics.tsx
│   │   ├── AuditTrail.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Incidents.tsx
│   │   ├── Login.tsx
│   │   ├── MLInsights.tsx
│   │   ├── RiskMap.tsx
│   │   ├── SessionLock.tsx
│   │   ├── Settings.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Toast.tsx
│   │   └── UserManagement.tsx
│   │
│   ├── context/
│   │   └── AppContext.tsx
│   │
│   ├── data/
│   │   └── mockData.ts
│   │
│   ├── imports/
│   │   └── pasted_text/
│   │       └── sentinelx-platform.md
│   │
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .figma/
├── .gitignore
├── .gitattributes
├── .mise.toml
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── AGENTS.md
└── CLAUDE.md
```

---

# 💻 Getting Started

## Prerequisites

Install:

- Node.js 22+
- pnpm 10+
- Git

Check versions:

```bash
node --version
pnpm --version
git --version
```

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

Start the development server:

```bash
pnpm dev
```

Open the local Vite development URL shown in the terminal.

---

# 🏭 Production Build

Build the application:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

Format the project:

```bash
pnpm format
```

The production output is generated in:

```text
dist/
```

---

# 🔄 Current Data Flow

The current version uses structured in-memory mock data.

```text
Mock Security Data
        ↓
React Application State
        ↓
Role-Based Components
        ↓
Dashboard / Incidents / Alerts
        ↓
Analytics / Risk Map / ML / AI
        ↓
Audit Trail
```

The application state is managed centrally through:

```text
src/context/AppContext.tsx
```

This provides shared state for:

- Current user
- Incidents
- Alerts
- Audit logs
- Toast notifications
- Session lock
- Session expiry
- Access permissions

---

# 🔐 Current Security Design

The prototype demonstrates security workflows but does not yet provide production-grade server-side security.

### Already demonstrated

- Role-based page permissions
- Role-specific UI
- Protected navigation
- Session inactivity locking
- Audit logging
- Tamper-evident chain visualization
- Permission-aware AI responses
- Alert action logging
- User-management permissions
- Security-focused configuration interface

### Planned production security

- Password hashing
- JWT authentication
- Secure refresh tokens
- Server-side RBAC
- API authorization
- Input validation
- SQL injection protection
- Rate limiting
- Secure session storage
- Secrets management
- SHA-256 audit hashing
- Digital signatures
- Immutable audit storage
- Zero-trust architecture

---

# 🧠 Future Backend Architecture

The planned production architecture is:

```text
React + TypeScript
        ↓
FastAPI REST API
        ↓
Authentication / Authorization
        ↓
Business Logic
        ↓
┌───────────────┬────────────────┬────────────────┐
│               │                │                │
▼               ▼                ▼                ▼
Oracle DB    Risk Engine      ML Service       Audit Service
                                  │
                                  ▼
                         SIEM / Event Sources
```

---

# 🗄️ Planned Oracle Database

The future backend will use Oracle Database as the primary relational database.

Planned entities include:

```text
USERS
ROLES
USER_ROLES
LOCATIONS
INCIDENTS
INCIDENT_TYPES
SEVERITY_LEVELS
INCIDENT_ASSIGNMENTS
ALERTS
RISK_SCORES
ML_PREDICTIONS
AUDIT_LOGS
SLA_RULES
ESCALATIONS
```

The database layer can later include:

- Primary keys
- Foreign keys
- Unique constraints
- Check constraints
- Indexes
- Views
- Sequences/identity columns
- Stored procedures
- Functions
- Carefully selected triggers

---

# 🤖 Planned ML Pipeline

The production ML layer is intended to process historical incidents using Python.

Potential pipeline:

```text
Historical Incident Data
        ↓
Data Cleaning
        ↓
Feature Engineering
        ↓
Train / Test Split
        ↓
Model Training
        ↓
Cross Validation
        ↓
Model Evaluation
        ↓
Risk / Anomaly Prediction
        ↓
Store Prediction
        ↓
SentinelX Dashboard
```

Potential models:

- Random Forest
- Logistic Regression
- XGBoost
- Isolation Forest
- Time-series forecasting

Potential features:

- Hour
- Day of week
- Month
- Location
- Incident type
- Severity
- Incident frequency
- Historical incidents
- Resolution time
- Recurrence

Future evaluation can include:

- Accuracy
- Precision
- Recall
- F1-score
- Confusion matrix
- ROC-AUC
- Feature importance
- Model comparison

For anomaly detection, evaluation should use appropriate anomaly metrics and validated anomaly datasets rather than blindly applying classification accuracy.

---

# 🚨 Planned SIEM Integration

Future versions can ingest security events from:

- Authentication systems
- Network infrastructure
- Firewalls
- IDS/IPS
- Endpoint systems
- Access-control systems
- Campus sensors
- Other SIEM platforms

The long-term goal is:

```text
Security Event
      ↓
SIEM / Event Stream
      ↓
SentinelX
      ↓
Correlation
      ↓
Risk Scoring
      ↓
Alert
      ↓
Incident
      ↓
Investigation
      ↓
Audit Verification
```

---

# 🛣️ Development Roadmap

## Phase 1 — Frontend SOC Prototype ✅

Implemented:

- React dashboard
- Role-based navigation
- Incident management
- Incident reporting
- Incident filtering
- Incident status workflow
- Incident assignment
- Comments/timeline
- CSV export
- Alerts
- Alert acknowledgement
- Alert escalation
- Alert dismissal
- Alert rules interface
- Risk Map
- Analytics
- ML Insights
- AI Assistant
- Audit Trail
- Audit-chain verification
- User Management
- Settings
- Session locking
- Toast notifications
- Student reporting view

## Phase 2 — Backend

Planned:

- FastAPI
- REST APIs
- Oracle Database
- Persistent data
- Server-side authentication
- JWT
- Backend RBAC
- Secure session management
- Incident CRUD APIs
- Alert APIs
- Analytics APIs

## Phase 3 — Security Intelligence

Planned:

- SIEM integration
- IDS/IPS integration
- Real-time event ingestion
- Event correlation
- Automated threat classification
- Anomaly detection
- Dynamic risk scoring
- ML-based incident prioritization

## Phase 4 — Cryptographic Integrity

Planned:

- SHA-256 audit hashing
- Server-side hash-chain generation
- Tamper detection
- Digital signatures
- Cryptographic verification
- Secure chain-of-custody records
- Immutable audit storage

## Phase 5 — Real-Time Platform

Planned:

- WebSockets
- Streaming events
- Distributed event processing
- Real-time notifications
- Automated response playbooks
- Cloud deployment
- Monitoring and observability

---

# 🔮 Future Enhancements

### Advanced AI / ML

- Deep learning
- Advanced anomaly detection
- Explainable AI
- Model monitoring
- Automated retraining
- Better risk forecasting

### Real-Time Processing

- WebSockets
- Event streaming
- Real-time alert ingestion
- Event-driven architecture

### IoT Integration

Potential integrations:

- CCTV metadata
- Door-access systems
- Environmental sensors
- Fire detection
- Smart lighting
- Occupancy sensors

Privacy-sensitive biometric or facial-recognition processing should only be introduced when there is a legitimate, lawful, and privacy-compliant requirement.

### Advanced GIS

- Historical risk maps
- Geospatial clustering
- Route-risk analysis
- Location-based alerts
- Temporal heatmaps

### Mobile Application

- Incident reporting
- Emergency alerts
- Notifications
- Location-based reporting

### Advanced Security

- Zero-trust architecture
- Digital signatures
- Immutable audit storage
- Security-event correlation
- Post-quantum cryptography experimentation
- Cryptographically verifiable incident reports

---

# 🧪 Testing Roadmap

Future production implementation should include:

- Unit tests
- API tests
- Database tests
- Authentication tests
- Authorization tests
- Incident workflow tests
- Alert-rule tests
- Risk-score tests
- ML pipeline tests
- Audit-chain integrity tests
- Security tests

---

# 🐳 Docker Roadmap

Future deployment can containerize:

```text
Frontend
Backend
Oracle / Database Layer
ML Service
Audit Service
```

A Docker Compose environment can provide a reproducible local development setup.

---

# 🎯 Project Objectives

SentinelX is designed around five major problems:

### Fragmented Security Information

Bring incidents, alerts, analytics, ML insights, and risk information into one platform.

### Slow Incident Prioritization

Use risk scoring, SLA monitoring, alerts, and ML-assisted analysis to help prioritize work.

### Limited Visibility

Provide centralized dashboards, analytics, and geographic risk visualization.

### Audit Integrity

Create a verifiable history of important security actions and prepare the system for cryptographic audit protection.

### Scalability

Build the frontend architecture so it can later connect to backend APIs, databases, SIEM infrastructure, ML services, and real-time event systems.

---

# 🔄 SentinelX Security Workflow

```text
        DETECT
          ↓
       ANALYZE
          ↓
      PRIORITIZE
          ↓
      INVESTIGATE
          ↓
        VERIFY
          ↓
        RESPOND
          ↓
        AUDIT
```

SentinelX brings these stages together into a unified security operations workflow.

---

# ⚠️ Current Limitations

The current release is a functional frontend prototype.

The following are **not yet production implementations**:

- Persistent backend database
- Oracle integration
- FastAPI backend
- Real SIEM ingestion
- Real-time external event stream
- Production ML inference
- External LLM integration
- Server-side authentication
- Production JWT authentication
- Real Google OAuth verification
- Production MFA
- Cryptographically secure server-side audit ledger
- SHA-256 audit-chain enforcement
- Immutable audit storage
- Production notification delivery

These limitations are intentional. The frontend establishes the product architecture and interaction model before backend and infrastructure integration.

---

# 📜 License

This project is intended for educational, research, and development purposes.

Add an appropriate open-source license before public distribution.

---

# 👨‍💻 Project Status

**Status: 🚧 Active Development**

SentinelX is currently evolving from a frontend SOC-style dashboard into a complete intelligent campus safety and security analytics platform.

### Current milestone

**Functional Frontend Security Operations Prototype ✅**

### Long-term vision

**Detect → Analyze → Prioritize → Investigate → Verify → Respond → Audit**

---

## ⭐ Why SentinelX?

SentinelX is designed to go beyond a traditional CRUD application.

It combines:

```text
Frontend Engineering
        +
Incident Response
        +
Risk Analytics
        +
Machine Learning
        +
AI-Assisted Analysis
        +
Role-Based Access
        +
Alert Management
        +
Audit Integrity
        +
Future SIEM Integration
        +
Future Oracle / Backend Infrastructure
```

The objective is to build a realistic security-operations product architecture where every component has a defined purpose and can evolve into a production backend-driven system.

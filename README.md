# AI Disaster Response & Resource Allocation System

An enterprise-grade, full-stack Emergency Operations Center (EOC) platform featuring explainable rule-based AI triage, Haversine geospatial dispatch, transactional logistics allocation, evacuation shelter management, operational alerting, field damage reassessment, real-time analytics, and an immutable audit trail.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Key Features](#4-key-features)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [User Roles & RBAC](#7-user-roles--rbac)
8. [Complete Operational Workflow](#8-complete-operational-workflow)
9. [Database Architecture & Schema](#9-database-architecture--schema)
10. [Rule-Based AI/NLP Triage Engine](#10-rule-based-ainlp-triage-engine)
11. [Haversine Great-Circle Dispatch](#11-haversine-great-circle-dispatch)
12. [Transactional Resource Allocation](#12-transactional-resource-allocation)
13. [Shelter Management & Evacuation Assignment](#13-shelter-management--evacuation-assignment)
14. [Operational Alerting & Notification Subsystem](#14-operational-alerting--notification-subsystem)
15. [Field Damage Assessment & Secondary Reassessment](#15-field-damage-assessment--secondary-reassessment)
16. [Disaster Intelligence & Analytics Center](#16-disaster-intelligence--analytics-center)
17. [Governance & Audit Trail Ledger](#17-governance--audit-trail-ledger)
18. [Comprehensive API Inventory](#18-comprehensive-api-inventory)
19. [Installation & Setup](#19-installation--setup)
20. [Environment Variables](#20-environment-variables)
21. [Database Setup & Migrations](#21-database-setup--migrations)
22. [Deterministic Seed Data](#22-deterministic-seed-data)
23. [Demonstration Accounts](#23-demonstration-accounts)
24. [Running the Application](#24-running-the-application)
25. [Verification & Regression Testing](#25-verification--regression-testing)
26. [Academic & Technical Limitations](#26-academic--technical-limitations)
27. [Future Roadmap & Enhancements](#27-future-roadmap--enhancements)

---

## 1. Project Overview
The **AI Disaster Response & Resource Allocation System** is a software engineering platform engineered to coordinate multi-agency emergency operations during large-scale crisis scenarios. Developed for emergency managers, first responders, and civilians, the system streamlines the full lifecycle of an emergency from initial citizen reporting to AI-assisted prioritization, tactical response dispatch, supply chain provisioning, shelter routing, on-scene damage appraisal, incident resolution, and post-incident governance.

## 2. Problem Statement
During severe disasters (earthquakes, structural collapses, floods, wildfires, industrial hazmat incidents), emergency dispatch systems frequently face severe bottlenecks:
- Cognitive overload for human 911 dispatchers sorting through thousands of simultaneous reports.
- Fragmented coordination between emergency medical units, search-and-rescue teams, and municipal logistics hubs.
- Stockouts of life-saving medical supplies and equipment due to lack of real-time inventory visibility and race conditions.
- Sub-optimal evacuation routing leading to overcrowded shelters and unfilled secondary facilities.
- Absence of verifiable operational audit histories to evaluate after-action performance.

## 3. Objectives
- Provide explainable, deterministic decision support through a rule-based AI triage engine.
- Calculate great-circle distances using the Haversine formula to rank and dispatch nearest specialized teams.
- Guarantee inventory integrity via atomic database transactions with row-level locks.
- Route civilian evacuees to nearest shelters without exceeding safety capacities.
- Deliver situational awareness through dark Emergency Operations Center (EOC) dashboards.
- Record an immutable audit log for every command decision, team deployment, and supply transaction.

## 4. Key Features
- **Civilian Reporting Portal**: Friction-free incident logging with GPS coordinate capture and casualty indicators.
- **Rule-Based AI/NLP Triage Engine**: Instant computation of severity scores (1–10), confidence percentages, and tactical recommendations.
- **Emergency Operations Center (EOC) Command HUD**: Real-time operational metrics, sortable incident streams, and tactical filter tools.
- **Haversine Smart Dispatch**: Proximity calculation and specialization matching for search & rescue, hazmat, flood, and medical teams.
- **Transactional Supply Allocation**: Concurrency-protected inventory allocations with automated depletion alerts.
- **Shelter Capacity Routing**: Dynamic occupancy tracking preventing overflow beyond facility limits.
- **Field Damage Assessment**: On-scene appraisal submission by field responders triggering secondary AI reassessment and severity escalation.
- **Multi-Level Alert System**: Automated Critical, Warning, and Info broadcast alerts with user acknowledgement tracking.
- **Disaster Intelligence & Analytics**: SQL aggregation time-series trends, resource utilization metrics, and spatial hotspot mapping.
- **Immutable Audit Ledger**: Governance logging tracing user, action, entity, details, and timestamp.
- **Demonstration Mode**: Pre-seeded canonical emergency scenario ("Building Collapse") and baseline environment control.

## 5. Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Axios, React Router v6, Recharts
- **Backend**: Node.js, Express.js, mysql2 (Connection Pool), JWT (jsonwebtoken), bcryptjs, Zod
- **Database**: MySQL 8.0+ (`ai_disaster_response`)
- **Architecture**: Decoupled Client-Server REST Architecture (API / Repository / Service / Controller Pattern)

## 6. System Architecture
```
                         ┌──────────────────────────────────────────┐
                         │       CIVILIAN / CITIZEN USER            │
                         └────────────────────┬─────────────────────┘
                                              │ Submit Disaster Report
                                              ▼
                         ┌──────────────────────────────────────────┐
                         │       RULE-BASED AI TRIAGE ENGINE        │
                         │ Severity (1-10) | Confidence | Cues     │
                         └────────────────────┬─────────────────────┘
                                              │
                                              ▼
                         ┌──────────────────────────────────────────┐
                         │   COMMAND CENTER / INCIDENT COMMANDER    │
                         └───────┬──────────────────┬───────────────┘
                                 │                  │
                ┌────────────────┼──────────────────┴───────────────┐
                ▼                ▼                                  ▼
      Response Teams        Resource Stockpiles               Shelter Facilities
      Haversine Dispatch    Transactional Allocation          Evacuation Routing
                │                │                                  │
                └────────────────┼──────────────────────────────────┘
                                 │
                                 ▼
                         ┌──────────────────────────────────────────┐
                         │       FIELD RESPONDER ON SCENE           │
                         │ Status Update | Damage Assessment Report │
                         └────────────────────┬─────────────────────┘
                                              │
                                              ▼
                         ┌──────────────────────────────────────────┐
                         │       SECONDARY AI REASSESSMENT          │
                         │ Escalation Check | Auto-Alert Generation │
                         └────────────────────┬─────────────────────┘
                                              │
                                              ▼
                         ┌──────────────────────────────────────────┐
                         │ DISASTER INTELLIGENCE & AUDIT TRAIL      │
                         │ Aggregated Analytics | Immutable Ledger  │
                         └────────────────────┬─────────────────────┘
                                              │
                                              ▼
                         ┌──────────────────────────────────────────┐
                         │           INCIDENT RESOLUTION            │
                         │ Team Release | History Preservation      │
                         └──────────────────────────────────────────┘
```

## 7. User Roles & RBAC
The system enforces strict Role-Based Access Control (RBAC) across four primary user personas:

| Role | Permissions & Operational Scope | Forbidden Operations |
|---|---|---|
| **Civilian** | Register, Login, Submit disaster reports, View personal reports, View public emergency alerts, View nearby shelters | Cannot dispatch teams, allocate resources, assign shelters, alter incident statuses, issue operational alerts, or access audit logs |
| **Responder** | Login, View assigned incidents, Update incident progress status, Submit on-scene damage reports, View operational alerts | Cannot manage system users, perform arbitrary dispatch, allocate logistics stockpiles, or access audit logs |
| **Commander** | Full operational command: Review incident streams, Dispatch teams via Haversine ranking, Allocate resources, Assign shelters, Review AI triage, Acknowledge alerts, Resolve incidents, View analytics & audit logs | Standard operational boundaries |
| **Admin** | Full system governance: User account management, System settings, Infrastructure diagnostics, Demo mode control, Comprehensive audit trail, Cross-domain analytics | Cannot bypass operational business validation |

## 8. Complete Operational Workflow
1. **Civilian Reporting**: Citizen reports an emergency (e.g. Building Collapse) with GPS coordinates and casualty indicators.
2. **AI Triage**: Rule engine analyzes description keywords, casualty counts, and damage indicators; calculates severity (e.g. 8/10), risk level (High), confidence (98%), and tactical cue matches.
3. **Command HUD Display**: Incident immediately streams into Commander's live operations HUD.
4. **Haversine Dispatch**: System calculates great-circle distance to all available response teams, filters matching specializations, ranks candidates, and deploys the optimal unit (team availability changes to 'Deployed').
5. **Supply Allocation**: Commander allocates necessary medical kits or generators; stock atomically decreases in MySQL with race condition protection.
6. **Shelter Routing**: Commander assigns evacuees to nearest shelter with capacity; facility available spaces atomically decrement.
7. **Responder On-Scene**: Dispatched responder arrives, updates status to "Active", and submits a Field Damage Assessment report.
8. **Secondary AI Reassessment**: Rule engine evaluates initial data + on-scene damage report; if conditions worsen, severity escalates (e.g. 8 -> 9), triggering an immediate Critical Operational Alert.
9. **Alert Acknowledgement**: Commander reviews and acknowledges the escalation broadcast.
10. **Incident Resolution**: Commander marks incident "Resolved"; all deployed teams are automatically released back to "Available".
11. **History Preservation**: Dispatch history, allocation history, shelter assignment history, damage reports, and AI predictions remain intact for auditing and analytics.

## 9. Database Architecture & Schema
The relational database `ai_disaster_response` contains 16 authoritative tables:
- `user`: System accounts (ID, name, email, phone, role, password hash).
- `incident`: Reported emergencies (ID, type, severity, description, coordinates, status, reported time).
- `response_team`: Specialized units (ID, name, leader, specialization, availability, coordinates).
- `resource`: Warehouse supplies (ID, name, category, quantity, availability, location).
- `shelter`: Emergency shelters (ID, name, capacity, available spaces, location).
- `ai_prediction`: Decision support evaluations (ID, incident ID, risk level, confidence, action, time).
- `damage_report`: Field assessments (ID, damage level, estimated loss, description, photo reference).
- `alert`: Broadcast notifications (ID, title, message, priority, alert time).
- `incident_dispatch`: N:M dispatch assignments (ID, incident ID, team ID, dispatch time, status).
- `resource_allocation`: Supply allocation records (ID, incident ID, resource ID, quantity, time, status).
- `incident_shelter`: Evacuation assignments (ID, incident ID, shelter ID, assigned spaces, time, status).
- `incident_alert`: Junction linking operational alerts to specific incidents.
- `alert_acknowledgement`: Multi-user alert acknowledgement ledger (ID, alert ID, user ID, timestamp).
- `incident_damage_report`: Junction linking field assessments to incidents.
- `audit_log`: Immutable audit ledger (ID, user ID, action, entity type, entity ID, details, timestamp).
- `volunteer`: Civilian relief volunteer registry.

## 10. Rule-Based AI/NLP Triage Engine
The AI triage engine is an explainable decision-support model operating on deterministic heuristics:
- **Keyword Extraction**: Identifies high-stress tokens (`trapped`, `collapse`, `fire`, `explosion`, `hazmat`, `casualties`).
- **Casualty & Population Weighting**: Scaled mathematical scoring based on reported casualties, injuries, and affected population.
- **Confidence Calculation**: Derived from report detail density, cue consistency, and corroborating indicators.
- **Secondary Reassessment**: Executes on subsequent damage reports, preserving prior predictions in historical records while detecting severity escalations.

## 11. Haversine Great-Circle Dispatch
Calculates spherical surface distance between incident coordinates $(\phi_1, \lambda_1)$ and team base locations $(\phi_2, \lambda_2)$:
$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
Candidates are ranked via a composite score:
$$\text{Score} = (\text{Specialization Match ? } 100 : 0) - d_{\text{km}}$$

## 12. Transactional Resource Allocation
All inventory updates are protected by database transactions using `SELECT ... FOR UPDATE` row-level locks:
- Prevents double-allocation and overdrafts.
- Automatically transitions resource status between `Available`, `Low Stock` ($\le 20$), and `Depleted` ($0$).
- Preserves full audit logs for allocations and releases.

## 13. Shelter Management & Evacuation Assignment
- Evaluates candidate shelters by occupancy status and distance.
- Decrements available spaces atomically.
- Rejects assignments exceeding facility capacity ($409\text{ Conflict}$).
- Automatically updates facility status (`Available`, `Near Capacity`, `Full`).

## 14. Operational Alerting & Notification Subsystem
- **Priority Tiers**: `Critical`, `Warning`, `Info`.
- **System Automated Triggers**:
  - High severity incidents ($\ge 7$).
  - Resource depletion (stock reaches 0).
  - Low stock warning (stock $\le 20$).
  - Shelter saturation (available spaces reach 0).
  - Incident severity escalation.
  - Incident resolution.
- **Deduplication Engine**: Prevents identical alerts within 10-minute operational windows.
- **Multi-User Acknowledgements**: Independent tracking per authorized officer.

## 15. Field Damage Assessment & Secondary Reassessment
- First responders log on-scene structural damage (`Minor`, `Moderate`, `Severe`, `Critical`), financial loss estimates, and photo references.
- Triggers secondary AI triage, appending a new evaluation to `ai_prediction`.
- If severity escalates, an automated `Critical` broadcast alert is dispatched to Command Center.

## 16. Disaster Intelligence & Analytics Center
Direct SQL aggregation powering executive decision metrics:
- **Incident Analytics**: Total, active, resolved, severity distribution (Low/Medium/High), and daily time-series trends.
- **Fleet Analytics**: Total teams, deployed units, available units, and utilization percentages.
- **Logistics Analytics**: Total items, low stock alerts, depleted items, and supply consumption rates.
- **Shelter Analytics**: Capacity, total evacuees housed, and overall regional occupancy percentage.
- **AI Intelligence**: Average confidence metric, low-confidence warning threshold ($< 70\%$), and dynamic heuristic insights engine.
- **Risk Hotspots**: Spatial coordinate clustering for geospatial visualization.

## 17. Governance & Audit Trail Ledger
An append-only `audit_log` records all operational events:
- Tracked actions: `USER_REGISTERED`, `USER_CREATED`, `USER_ROLE_UPDATED`, `INCIDENT_CREATED`, `INCIDENT_STATUS_CHANGED`, `INCIDENT_RESOLVED`, `TEAM_DISPATCHED`, `TEAM_RELEASED`, `RESOURCE_ALLOCATED`, `RESOURCE_RELEASED`, `SHELTER_ASSIGNED`, `SHELTER_RELEASED`, `DAMAGE_REPORT_SUBMITTED`, `ALERT_CREATED`, `ALERT_ACKNOWLEDGED`, `DEMO_SCENARIO_LOADED`, `DEMO_ENVIRONMENT_RESET`.
- Sanitized details (no passwords, tokens, or raw secrets recorded).

## 18. Comprehensive API Inventory

### Authentication & Users
- `POST /api/auth/register` — Civilian registration
- `POST /api/auth/login` — Universal login (JWT token return)
- `GET /api/auth/me` — Current user profile
- `GET /api/users` — Admin user management list
- `GET /api/users/:id` — Admin user detail
- `POST /api/users` — Admin create user with role
- `PATCH /api/users/:id/role` — Admin update user role

### Incidents & Command Operations
- `GET /api/dashboard/metrics` — Command Center live HUD metrics
- `POST /api/incidents` — Report new disaster incident (triggers AI triage)
- `GET /api/incidents` — Paginated, searchable, sortable incident stream
- `GET /api/incidents/:id` — Full incident detail (teams, resources, shelters, damage, alerts, timeline)
- `PATCH /api/incidents/:id/status` — Lifecycle transition (`Reported` $\to$ `Active` $\to$ `Contained` $\to$ `Resolved`)

### Teams & Haversine Dispatch
- `GET /api/response-teams` — Fleet inventory & availability
- `PATCH /api/response-teams/:id/status` — Operational status update
- `GET /api/incidents/:id/candidate-teams` — Haversine ranked candidate units
- `POST /api/incidents/:id/allocate-team` — Atomic dispatch transaction

### Resources & Logistics
- `GET /api/resources` — Stock inventory list
- `GET /api/resources/metrics` — Supply status indicators
- `PATCH /api/resources/:id/status` — Manual stock status override
- `POST /api/incidents/:id/allocate-resource` — Atomic resource allocation
- `POST /api/resource-allocations/:id/release` — Allocation release & inventory restoration

### Shelters & Evacuation
- `GET /api/shelters` — Shelter facilities list
- `GET /api/shelters/metrics` — Regional occupancy metrics
- `GET /api/incidents/:id/candidate-shelters` — Ranked evacuation shelters
- `POST /api/incidents/:id/assign-shelter` — Atomic evacuee assignment
- `POST /api/shelter-assignments/:id/release` — Shelter release

### Alerts & Notifications
- `GET /api/alerts` — Broadcast alerts stream
- `POST /api/alerts` — Issue operational broadcast
- `PATCH /api/alerts/:id/acknowledge` — User alert acknowledgement
- `GET /api/incidents/:id/alerts` — Incident-linked alerts
- `POST /api/incidents/:id/alerts` — Link operational alert to incident

### Damage Reports & Assessments
- `POST /api/incidents/:id/damage-reports` — Submit field damage assessment
- `GET /api/incidents/:id/damage-reports` — Incident damage assessments
- `GET /api/damage-reports/:id` — Specific damage assessment detail

### Analytics & AI Intelligence
- `GET /api/analytics/overview` — Master cross-domain operational intelligence
- `GET /api/analytics/incidents` — Incident volume and severity statistics
- `GET /api/analytics/resources` — Supply utilization and shortages
- `GET /api/analytics/teams` — Fleet deployment load
- `GET /api/analytics/shelters` — Regional shelter occupancy
- `GET /api/analytics/ai` — Rule engine confidence & dynamic insights
- `GET /api/analytics/hotspots` — Spatial incident coordinates

### Audit Ledger & Governance
- `GET /api/audit-logs` — Filterable, paginated audit ledger
- `GET /api/audit-logs/:id` — Specific audit event inspection

### Demonstration & Diagnostics
- `GET /api/health` — System status (API & MySQL database health)
- `GET /api/demo/status` — Demonstration mode readiness & metrics
- `POST /api/demo/load-scenario` — Inject canonical Building Collapse scenario
- `POST /api/demo/reset` — Reset operational baselines to pristine state

## 19. Installation & Setup
### Prerequisites
- Node.js (v18.0.0 or higher)
- MySQL Server (v8.0 or higher)
- npm (v9.0 or higher)

### Setup Steps
```bash
# Clone or navigate to the repository
cd c:\AI_Disaster

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

## 20. Environment Variables
Create `.env` inside `backend/`:
```env
PORT=5001
NODE_ENV=development

# MySQL Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_disaster_response

# Security
JWT_SECRET=your_super_secret_jwt_key_phase10
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5000
```

## 21. Database Setup & Migrations
1. Create database:
```sql
CREATE DATABASE IF NOT EXISTS ai_disaster_response;
```
2. Execute schema migrations:
```bash
# Execute Phase 8 & Phase 9 migrations
mysql -u root -p ai_disaster_response < backend/src/db/migration_phase8.sql
mysql -u root -p ai_disaster_response < backend/src/db/migration_phase9.sql
```

## 22. Deterministic Seed Data
Run the master demonstration seeder:
```bash
node backend/src/seed/seed_phase10_demo.js
```
Seeds:
- 4 primary demo users (Admin, Commander, Responder, Civilian).
- 6 response teams with valid GPS coordinates.
- 9 realistic resource categories.
- 6 evacuation shelters with varying capacities.
- Canonical Building Collapse demonstration incident.

## 23. Demonstration Accounts
All accounts share the unified evaluation password: `demo1234`

| Role | Email Address | Password | Intended Workflow |
|---|---|---|---|
| **Incident Commander** | `commander@demo.com` | `demo1234` | Full Command Center HUD, Haversine Dispatch, Supply Allocation, Shelter Assignment, Analytics |
| **Field Responder** | `responder@demo.com` | `demo1234` | Responder Hub, Assigned Incidents, Field Damage Assessment, Status Update |
| **System Administrator** | `admin@demo.com` | `demo1234` | User Management, System Oversight, Infrastructure Diagnostics, Audit Ledger |
| **Civilian Citizen** | `civilian@demo.com` | `demo1234` | Citizen Portal, Emergency Reporting, Public Alert Feeds, Nearby Shelter Query |

## 24. Running the Application
### Start Backend Server:
```bash
cd backend
npm run dev
# Server listening on http://localhost:5001
```

### Start Frontend Application:
```bash
cd frontend
npm run dev
# Vite development server active on http://localhost:5173
```

### Production Build:
```bash
cd frontend
npm run build
# Compiles production distribution with 0 errors
```

## 25. Verification & Regression Testing
Run the master Phase 10 end-to-end verification suite:
```bash
node backend/src/seed/verify_phase10.js
```
Validates all 34 integration points:
- Database connectivity & API health check.
- Multi-role authentication & registration.
- Civilian reporting & AI triage.
- Haversine great-circle calculation & concurrency-protected dispatch.
- Transactional supply allocation & overdraft prevention.
- Shelter capacity routing & overflow prevention.
- Responder damage reporting, secondary AI reassessment & severity escalation.
- Alert generation & acknowledgement.
- Incident resolution & automatic team release.
- Real-time SQL aggregation analytics & heuristic AI insights.
- Immutable audit event logging & administrative retrieval.
- Comprehensive RBAC security matrix.
- Relational data integrity & production frontend build.

### Full Regression Suite:
```bash
node backend/src/seed/verify_phase2_phase3.js
node backend/src/seed/verify_phase4.js
node backend/src/seed/verify_phase5.js
node backend/src/seed/verify_phase6.js
node backend/src/seed/verify_phase7.js
node backend/src/seed/verify_phase8.js
node backend/src/seed/verify_phase9.js
node backend/src/seed/verify_phase8_phase9_full_workflow.js
node backend/src/seed/verify_phase10.js
```

## 26. Academic & Technical Limitations
- **Rule-Based Decision Support**: The AI engine uses expert heuristic rules, NLP keyword extraction, and weighted severity models. It is **not** an autonomous deep-learning black box or generative predictive oracle.
- **External Integration Feeds**: Government NOAA weather feeds, real-world cellular SMS broadcasting, and external 911 dispatch CAD integrations are not simulated with live third-party APIs.
- **Hardware Telemetry**: GPS coordinates are statically recorded and great-circle derived; live real-time vehicle GPS transponder streaming is not implemented.
- **Scope**: Designed strictly as an academic full-stack software engineering laboratory project.

## 27. Future Roadmap & Enhancements
- Integration of live OpenStreetMap / Leaflet tile layers with real-time responder vehicle pins via WebSockets.
- Integration of Twilio SMS / Web Push emergency notification gateways.
- Integration of machine learning models (e.g. fine-tuned BERT or RoBERTa) for unstructured citizen report parsing.
- Multi-incident triage optimization using mixed-integer linear programming (MILP) for global fleet resource assignment.

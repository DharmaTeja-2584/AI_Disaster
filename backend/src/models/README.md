# Database Models — Entity Reference

This directory documents the 10 logical entities in the AI Disaster Response system.

> ⚠️ **IMPORTANT**: No SQL schemas exist here yet.
> The exact table definitions (columns, primary keys, foreign keys, constraints,
> indexes, junction tables) will be supplied separately and applied via migration scripts.
> Do NOT invent schemas. Do NOT create tables without the supplied definitions.

---

## The 10 System Entities

| # | Entity | Description |
|---|--------|-------------|
| 1 | **User** | System users — Civilian, Responder, Commander, Admin |
| 2 | **Incident** | A disaster event submitted by a Civilian |
| 3 | **Alert** | Operational alerts linked to incidents |
| 4 | **ResponseTeam** | Emergency response teams with specializations |
| 5 | **Volunteer** | Members belonging to ResponseTeams |
| 6 | **Shelter** | Evacuation shelters with capacity tracking |
| 7 | **DamageReport** | Detailed damage assessments per incident |
| 8 | **AIPrediction** | Rule-based AI triage results per incident |
| 9 | **ResourceAllocation** | Allocation records linking resources to incidents |
| 10 | **Resource** | Inventory of emergency resources (water, food, kits, etc.) |

---

## Core Relationships (Logical)

```
User
  └── 1:N  Incident

Incident
  ├── 1:N  Alert
  ├── N:M  ResponseTeam   (via junction table — schema TBD)
  ├── 1:N  ResourceAllocation
  ├── N:M  Shelter         (via junction table — schema TBD)
  └── 1:N  DamageReport

ResponseTeam
  └── 1:N  Volunteer

DamageReport
  └── 1:N  AIPrediction

ResourceAllocation
  └── N:1  Resource
```

---

## Repository Files (Created after schema supply)

```
/src/db/
  userRepository.js           ← User CRUD
  incidentRepository.js       ← Incident CRUD + filters
  aiPredictionRepository.js   ← AI triage results
  teamRepository.js           ← ResponseTeam management
  volunteerRepository.js      ← Volunteer management
  shelterRepository.js        ← Shelter + capacity operations
  resourceRepository.js       ← Resource inventory
  resourceAllocationRepository.js ← Allocation with transactions
  alertRepository.js          ← Alert CRUD + acknowledge
  damageReportRepository.js   ← Damage report CRUD
  dashboardRepository.js      ← Aggregate metrics queries
  analyticsRepository.js      ← Analytics + reporting queries
```

---

## Status Enumerations

### Incident Status
```
Reported → Triaged → Active → Contained → Resolved
```

### Team Status
```
Available | Deployed | Off-duty
```

### Resource Status
```
Available | Low Stock | Depleted | Unavailable
```

### Shelter Status
```
Available | Near Capacity | Full | Closed
```

### Alert Type
```
Critical | Warning | Info
```

### Priority
```
High (severity 7–10) | Medium (severity 4–6) | Low (severity 1–3)
```

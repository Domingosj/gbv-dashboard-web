# GCR Dashboard — Implementation Strategy

> **Document Purpose:** Master strategy document for the GCR GBV Case Management Dashboard.  
> **Data Source:** ActivityInfo API (1,422+ cases, 74 fields) + services_cleaned.csv (73 services, 18 districts)  
> **Architecture:** Next.js 14 (React/TypeScript), no database, API-fresh data with SWR client caching  
> **Author:** Domingos José Domingos | NCS Moçambique  
> **Version:** 1.0  
> **Last Updated:** May 2026

## Status Legend

Every feature below has a status indicator. These are updated as implementation progresses:

| Icon | Status | Meaning |
|---|---|---|
| 🔲 | **Not started** | Not yet implemented |
| 🔄 | **In progress** | Currently being built |
| ✅ | **Implemented** | Built, tested, deployed |
| ⏸️ | **Paused** | Started but blocked or deferred |
| ❌ | **Cancelled** | Will not be implemented |
| ⚪ | **Not applicable** | Cannot be built with current data |

---

## Table of Contents

1. [Data Availability Assessment](#1-data-availability-assessment)
2. [Feature × Data Matrix](#2-feature--data-matrix)
3. [Gap Analysis & Mitigations](#3-gap-analysis--mitigations)
4. [Visual Design System](#4-visual-design-system)
5. [Implementation Architecture](#5-implementation-architecture)
6. [Phased Implementation Plan](#6-phased-implementation-plan)
7. [Route / Navigation Design](#7-route--navigation-design)
8. [Component Tree](#8-component-tree)
9. [Development Tracking](#9-development-tracking)

---

## 1. Data Availability Assessment

### 1.1 Raw Fields from ActivityInfo

```
CASE METADATA
  record_id           ✓  Unique ActivityInfo record ID
  last_edit_time      ✓  Epoch timestamp of last edit
  case_id             ✓  Incident ID (e.g. "Beira-Ana da Alcina-00001")
  project             ✓  Project name (IMPower, ResiNorte, Tsogolo Tsicana, etc.)
  partner             ✓  Implementing partner
  case_manager        ✓  Case manager name (from nome_gestor.Name)
  source              ✓  Proveniência / source of case
  consent             ✓  Consentimento (consent given?)
  validated           ✓  O Caso foi Validado
  wants_followup      ✓  Gostaria de dar seguimento ao caso?
  referred_by         ✓  Who referred the survivor
  data_sharing_consent✓  Consent for data sharing

DATES
  incident_date       ✓  Data do incidente
  identification_date ✓  Data de identificação
  interview_date      ✓  Data de entrevista
  closure_date        ✓  Data do encerramento

DEMOGRAPHICS
  age_group           ✓  Faixa etária (0-11, 12-17, 18-25, 25-49, 50+)
  sex                 ✓  Sexo (Femenino, Masculino)
  marital_status      ✓  Estado Civil
  disability          ✓  Pessoa com deficiência (Sim/Não)
  vulnerabilities     ✓  Vulnerabilidades específicas
  origin_country      ✓  País de origem

LOCATION
  province            ✓  Província (from distrito.Province.name)
  district            ✓  Distrito (from distrito.Name)

INCIDENT
  violence_type       ✓  Tipo de violência (full string)
  violence_type_short ✓  Abbreviated (calculated)
  incident_description✓  Relato completo do incidente
  harmful_practice    ✓  Prática tradicional nociva?
  perpetrator_count   ✓  Número de alegado(s) perpetrador(es)
  perpetrator_sex     ✓  Sexo do alegado perpetrador
  perpetrator_age     ✓  Idade do perpetrador
  perpetrator_relationship ✓ Relação com sobrevivente

PSYCHOSOCIAL / SAFETY
  emotional_state     ✓  Estado emocional
  is_safe             ✓  Estará segura quando partir? (Sim/Não)
  why_not_safe        ✓  Porquê não está segura (free text)
  safety_measures     ✓  Medidas tomadas para segurança
  previous_incident   ✓  Incidente anterior de VBG?
  reported_elsewhere  ✓  Relatou noutro lugar?

REFERRAL STATUS (Sim/Não/Indisponível/Não aplicável)
  referred_medical        ✓  Serviços médicos
  referred_psychosocial   ✓  Serviços psicossociais
  referred_police         ✓  Polícia/segurança
  referred_legal          ✓  Serviços jurídicos
  referred_child_protection ✓ Protecção de menores
  referred_safe_house     ✓  Casa/Abrigo seguro
  referred_livelihood     ✓  Subsistência

REFERRAL DATES
  date_referred_medical      ✓
  date_referred_psychosocial ✓
  date_referred_police       ✓
  date_referred_safe_house   ✓

CASE STATUS
  case_status         ✓  Aberto / Encerrado
  closure_reason      ✓  Motivo do encerramento

CALCULATED FIELDS (computed client-side)
  days_since_identification  ✓  Calculated
  has_referral               ✓  Boolean: any referral made?
  risk_score                 ✓  0-100 (9-factor algorithm)
  priority_level             ✓  CRÍTICO/ALTO/MÉDIO/BAIXO
  priority_icon              ✓  🔴🟠🟡🟢
  final_priority             ✓  Weighted composite score
  referral_urgency           ✓  0-100 urgency score
  service_gaps               ✓  Count of unavailable services
  unsafe_penalty             ✓  +30 if unsafe
```

### 1.2 Services Data (from CSV)

```
Field               Status  Notes
organization        ✓       15 organizations
service_category    ✓       6 categories (VBG, Child Protection, etc.)
service_type        ✓       Type of service
province            ✓
district            ✓       18 districts
location            ✓       Specific location
focal_point_name    ✓       Contact person
focal_point_phone   ✓       Contact phone
focal_point_email   ✓       Sometimes empty
```

### 1.3 What ActivityInfo Does NOT Provide

These are features requested in the spec that the current ActivityInfo form does not capture:

```
NOT IN ACTIVITYINFO:
─────────────────────
▪ follow_up_date             — Next scheduled follow-up date
▪ last_contact_date          — Date of last caseworker contact
▪ case_action_plan_exists    — Whether a CAP was created
▪ safety_plan_exists         — Whether a safety plan was documented
▪ referral_completed         — Whether the referred service was actually received
▪ referral_completion_date   — Date service was received
▪ supervisor_name            — Caseworker supervisor assignment
▪ caseworker_notes           — Narrative case notes / updates
▪ outcome_score              — Psychosocial functionality scale score
▪ stigma_score               — Felt stigma scale score
▪ client_satisfaction        — Client feedback score
▪ incident_coordinates       — Exact GPS (privacy constraint — use district only)
```

---

## 2. Feature × Data Matrix

Every requested screen mapped to its data source.

### 2.1 TV Screens (Operational Dashboards)

#### Screen 1: Daily Operations Snapshot

| Indicator | Data Source | Status |
|---|---|---|
| Total active cases | `case_status === "Aberto"` | ✅ Available |
| New cases in last 7 days | `identification_date` filter | ✅ Available |
| Cases due for follow-up today | ❌ No follow-up date in ActivityInfo | ⚠️ Not available |
| Cases overdue for follow-up | ❌ No follow-up date | ⚠️ Not available |
| Cases identified but not yet referred | `has_referral === false` | ✅ Available |
| Cases referred but not yet closed | `has_referral === true && case_status === "Aberto"` | ✅ Available |
| High-risk cases requiring review | `priority_level === "CRÍTICO"` | ✅ Available |
| Cases not updated in 14+ days | `last_edit_time` (approximate) | ⚠️ Partial |

#### Screen 2: Case Manager Workload

| Indicator | Data Source | Status |
|---|---|---|
| Active cases per case manager | Group by `case_manager` where `case_status === "Aberto"` | ✅ Available |
| Follow-ups due per case manager | ❌ No follow-up date | ⚠️ Not available |
| Overdue cases per case manager | Proxy: cases with `days_since_identification > 30` | ⚠️ Approximate |
| High-risk cases per case manager | `priority_level === "CRÍTICO" || "ALTO"` per manager | ✅ Available |
| Avg days since last update | `last_edit_time` (epoch) | ⚠️ Approximate |
| Cases pending referral by manager | `has_referral === false` per manager | ✅ Available |
| Cases open 30/60/90+ days | `days_since_identification` bucketed | ✅ Available |

#### Screen 3: Risk, Safety, and Referral Gaps

| Indicator | Data Source | Status |
|---|---|---|
| High-risk cases count | `priority_level === "CRÍTICO"` | ✅ Available |
| Risk flags by type | Violence type, age group, unsafe | ✅ Available |
| Cases with unsafe return indicated | `is_safe === "Não"` | ✅ Available |
| Cases without safety plan/measure | `safety_measures` empty or missing | ✅ Available |
| Minor survivors + serious incident | `age_group` (0-11, 12-17) + `violence_type` | ✅ Available |
| Cases with previous GBV incident | `previous_incident === "Sim"` | ✅ Available |
| Cases perpetrator is family/caregiver | `perpetrator_relationship` analysis | ✅ Available |
| Critical referrals not completed | ❌ Referral completion not tracked | ⚠️ Not available |
| Referrals pending by type | `referred_* === "Sim"` without closure | ✅ Partial |

#### Screen 4: Referral and Case Progress Monitor

| Indicator | Data Source | Status |
|---|---|---|
| Referral completion rate | ❌ Not in ActivityInfo | ⚠️ Not available |
| Cases referred to medical | `referred_medical === "Sim"` | ✅ Available |
| Cases referred to PSS | `referred_psychosocial === "Sim"` | ✅ Available |
| Cases referred to legal | `referred_legal === "Sim"` | ✅ Available |
| Cases referred to police | `referred_police === "Sim"` | ✅ Available |
| Cases referred to child protection | `referred_child_protection === "Sim"` | ✅ Available |
| Cases referred to shelter | `referred_safe_house === "Sim"` | ✅ Available |
| Cases referred but not completed | ❌ Not tracked | ⚠️ Not available |
| Avg days from identification to referral | Calculate from `identification_date` to first `date_referred_*` | ✅ Available |
| Avg days from referral to closure | First `date_referred_*` to `closure_date` | ✅ Available |
| Cases closed by closure reason | `closure_reason` | ✅ Available |

### 2.2 Case Manager Interactive Workspace

#### Tab 1: My Dashboard

| Feature | Status |
|---|---|
| My active cases | ✅ Filter by `case_manager` |
| My follow-ups due | ⚠️ No follow-up date |
| My overdue cases | ⚠️ Proxy: days since identification |
| My high-risk cases | ✅ priority_level |
| My cases pending referral | ✅ has_referral |
| Today's priority list | ✅ Composite: risk + days + referral status |

#### Tab 2: My Cases (Searchable Table)

| Filter | Status |
|---|---|
| Case ID | ✅ Available |
| District | ✅ Available |
| Case type / Violence type | ✅ Available |
| Age group | ✅ Available |
| Status | ✅ case_status |
| Risk level | ✅ priority_level |
| Last update | ⚠️ `last_edit_time` |
| Follow-up due | ❌ Not available |
| Referral status | ✅ has_referral |
| Open 30/60/90 days | ✅ Calculated |

#### Tab 3: Case Detail / Survivor Journey

| Section | Status |
|---|---|
| Case overview | ✅ All fields |
| Key dates timeline | ✅ incident, identification, interview, closure |
| Risk and safety indicators | ✅ All |
| Referral status by service | ✅ referred_* fields |
| Follow-up history | ❌ Not tracked |
| Timeline of actions | ⚠️ Partial (dates available, no narrative) |
| Services already provided | ✅ referred_* === "Sim" |
| Services still pending | ⚠️ referred_* === "Sim" but no completion tracked |
| AI-generated case summary | ✅ Can implement with Claude |
| Link to ActivityInfo | ✅ |

#### Tab 4: Referral Assistant

| Feature | Status |
|---|---|
| Relevant services by case type | ✅ Services CSV has categories |
| Available providers by district | ✅ Services CSV |
| Eligibility criteria | ❌ Not in services CSV |
| Contact channel | ✅ Phone/email in CSV |
| Alternative providers | ✅ Fallback to district neighbors |

#### Tab 5: AI Assistant (Chat with Data)

| Query Type | Status |
|---|---|
| "Which cases need follow-up today?" | ⚠️ No follow-up dates — use days-since heuristic |
| "Which cases are referred but not closed?" | ✅ Available |
| "Summarize this case" | ✅ All case data available |
| "What referrals are still pending?" | ✅ referred_* fields |
| "What services in this district?" | ✅ Services CSV |

### 2.3 Supervisor Dashboards

| Feature | Status |
|---|---|
| Total active team cases | ✅ Available |
| Cases per case manager | ✅ Available |
| High-risk cases | ✅ Available |
| Cases overdue for follow-up | ⚠️ Proxy |
| Cases pending referral | ✅ Available |
| Cases open 30/60/90+ days | ✅ Available |
| Case closure rate | ✅ Available |
| Average time to referral | ✅ Available |
| Average time to closure | ✅ Available |
| Data quality monitoring | ✅ See 2.4 below |
| Supervision action queue | ✅ Composite |
| Risk and safeguarding overview | ✅ Composite |

### 2.4 Data Quality Monitor

| Indicator | Data Source | Status |
|---|---|---|
| Missing consent | `consent` empty | ✅ Available |
| Missing incident date | `incident_date` empty | ✅ Available |
| Missing interview date | `interview_date` empty | ✅ Available |
| Missing referral status | All `referred_*` empty | ✅ Available |
| Missing closure reason | `closure_reason` empty for closed | ✅ Available |
| Cases closed without key fields | Cross-field check | ✅ Available |
| Inconsistent dates | Closure before identification | ✅ Available |
| Cases not validated | `validated !== "Sim"` | ✅ Available |
| "Other" not specified | `violence_type === "Outro"` without detail | ✅ Available |

### 2.5 Project Manager / Coordination Dashboards

| Feature | Status |
|---|---|
| Cases by project | ✅ project field |
| Cases by province/district | ✅ Available |
| Cases by partner | ✅ partner field |
| Cases by age group / violence type | ✅ Available |
| Referral completion rate | ❌ Not available |
| Referral performance by service | ✅ Partial (referral counts, not completion) |
| Services most needed | ✅ referral patterns |
| Service gaps (unavailable) | ✅ service_gaps |
| Geographic map | ✅ District-level aggregation |
| Trends over time | ✅ Monthly bucketing |
| Seasonal changes | ✅ Multi-month analysis |
| District-level increases/decreases | ✅ Month-over-month comparison |

### 2.6 Organization-Wide / Executive Dashboard

| Feature | Status |
|---|---|
| Executive summary cards | ✅ All KPIs |
| AI-generated monthly summary | ✅ Can implement |
| Portfolio comparison (projects) | ✅ project field |
| Strategic protection analysis | ✅ Cross-field analysis |
| Resource allocation insights | ✅ Composite |
| Donor reporting | ✅ Aggregated, no PII |

---

## 3. Gap Analysis & Mitigations

### 3.1 Critical Gaps (Features Requested but Data Not Available)

| Gap | Impact | Mitigation |
|---|---|---|
| **Follow-up due dates** | Cannot show "due today" or "overdue for follow-up" | Use `days_since_identification` + risk score as proxy. Feature shows "cases not recently updated" instead. Consider adding `data_ultimo_contacto` field to ActivityInfo form. |
| **Referral completion status** | Cannot compute referral completion rate or "referred but not completed" | Use referral dates as proxy: if referred 30+ days ago and case still open, flag as "potentially incomplete." The current `calculateDaysSinceReferral()` already implements this. |
| **Case action plan existence** | Cannot track whether a CAP was created | Not in ActivityInfo. Would need a new ActivityInfo field or external tracking. For v1, skip this indicator. |
| **Case notes / narrative updates** | Cannot show "follow-up history" or "case timeline" | ActivityInfo has `last_edit_time` but no per-event narrative. For v1, show date-only timeline. |
| **Supervisor assignments** | Cannot filter by supervisor | Case managers are tracked but not their supervisors. Use the `partner` field as an organizational proxy for team grouping. |

### 3.2 Partial Data (Available with Caveats)

| Feature | Caveat | Implementation |
|---|---|---|
| Cases not updated in 14+ days | `last_edit_time` is the ActivityInfo record edit time, not a caseworker contact log | Use as approximate indicator. Accept ±1 day precision. |
| Overdue for follow-up | No scheduled follow-up date exists | Use `days_since_identification > 14 && has_referral === false` as "requires attention" heuristic |
| Time to referral | Only 4 of 8 referral types have dates | Calculate from the earliest available referral date. Document limitation. |
| Cases per partner | `partner` field exists but may not cover all orgs | Supplement with `project` field for organizational grouping. |
| Services CSV completeness | 73 services in 18 districts — may not reflect reality in all areas | Clearly label "according to registered services" and allow manual override notes. |

### 3.3 Data That Exists But Is Underused

The following fields are fetched from ActivityInfo but not yet displayed in the dashboard:

| Field | Current Status | Should Be Used For |
|---|---|---|
| `harmful_practice` | Not displayed | Child marriage / FGM tracking on Risk screen |
| `previous_incident` | Not displayed | Recurrence analysis on Trends |
| `reported_elsewhere` | Not displayed | Help-seeking behavior patterns on Trends |
| `perpetrator_relationship` | Used in risk score only | Distribution chart on Analytics |
| `perpetrator_age` | Not used | Perpetrator profile analysis |
| `disability` | Not displayed | Inclusion monitoring |
| `closure_reason` | Not displayed | Closure quality analysis on Data Quality |
| `validated` | Not displayed | Data quality tracking |
| `wants_followup` | Not displayed | Survivor engagement tracking |
| `source` / `referred_by` | Not displayed | Referral source analysis |
| `safety_measures` | Not displayed | Safety plan coverage tracking |

---

## 4. Visual Design System

> **Design Direction:** Modern, calm, humanitarian-tech dashboard.  
> Clean SaaS-inspired UI, but softer, more humane, less corporate, designed for sensitive decision-making.

### 4.1 Design Principles

| # | Principle | Meaning |
|---|---|---|
| 1 | **Calm before flashy** | The dashboard should reduce stress, not increase it |
| 2 | **Action before decoration** | Every component answers a decision question |
| 3 | **Sensitivity by design** | Protection data presented with dignity and control |
| 4 | **Standardization first** | All screens feel like part of the same family |
| 5 | **Content over role** | Tabs are named by the data/analysis they contain, not by who should see them. Any user can access any tab. |
| 6 | **AI should feel assistive, not dominant** | AI insight boxes support, never overpower |

### 4.2 Visual Personality

```
SHOULD FEEL LIKE:                    SHOULD NOT FEEL LIKE:
  Calm                                Aggressive command center
  Trustworthy                         Finance dashboard
  Clear                               Gaming interface
  Human-centered                      Police/security surveillance
  Safe                                Overly emotional protection poster
  Professional                        Cluttered BI report
  Intelligent
  Operational
  Ethical
  Focused
```

### 4.3 Color Palette

#### Core Brand Layer

| Token | Color | Hex | Usage |
|---|---|---|---|
| Primary Green | ![#256B5A](https://placehold.co/15x15/256B5A/256B5A.png) | `#256B5A` | Main accents, active states, primary buttons, progress |
| Secondary Sage | ![#5E9C8A](https://placehold.co/15x15/5E9C8A/5E9C8A.png) | `#5E9C8A` | Secondary charts, hover states, supporting visuals |
| Background | ![#F5F6F7](https://placehold.co/15x15/F5F6F7/F5F6F7.png) | `#F5F6F7` | Page background |
| Card Surface | ![#FFFFFF](https://placehold.co/15x15/FFFFFF/FFFFFF.png) | `#FFFFFF` | Cards, panels |
| Text Primary | ![#1F2933](https://placehold.co/15x15/1F2933/1F2933.png) | `#1F2933` | Headings, body |
| Text Secondary | ![#6B7280](https://placehold.co/15x15/6B7280/6B7280.png) | `#6B7280` | Labels, descriptions |

#### Semantic Colors

| Token | Color | Hex | Usage |
|---|---|---|---|
| Success / Green | ![#2E8B57](https://placehold.co/15x15/2E8B57/2E8B57.png) | `#2E8B57` | Completed, active, positive |
| Info / Blue | ![#4B7BE5](https://placehold.co/15x15/4B7BE5/4B7BE5.png) | `#4B7BE5` | AI insights, neutral guidance, trends |
| Warning / Amber | ![#D9A441](https://placehold.co/15x15/D9A441/D9A441.png) | `#D9A441` | Due soon, moderate risk, pending |
| Critical / Red | ![#C65A5A](https://placehold.co/15x15/C65A5A/C65A5A.png) | `#C65A5A` | Overdue, high-risk, urgent (never neon) |
| Inactive / Grey | ![#B8BEC6](https://placehold.co/15x15/B8BEC6/B8BEC6.png) | `#B8BEC6` | Placeholder, not started, unknown |

#### Color Use Rules

| Color | Use For |
|---|---|
| Green ✅ | Active navigation, primary CTA, positive completion, main brand accent, progress indicators |
| Amber ⚠️ | Due soon, moderate risk, pending follow-up, missing non-critical actions |
| Red 🔴 | Overdue, high-risk flag, critical referral gaps, urgent supervision attention |
| Blue ℹ️ | Informational insights, AI assistant, trend summary, neutral analytics |
| Grey ⬜ | Secondary interface, placeholders, not-started, inactive, unknown |

### 4.4 Typography

| Element | Size | Weight | Font |
|---|---|---|---|
| Page title | 28–32px | Bold | Inter |
| Section title | 18–22px | Semibold | Inter |
| Card metric | 28–40px | Bold | Inter |
| Label text | 12–14px | Medium | Inter |
| Body text | 14–16px | Regular | Inter |
| Small hint | 12px | Muted | Inter |

**Recommended font:** [Inter](https://fonts.google.com/specimen/Inter) — extremely clean, readable, scalable, perfect for dashboards.

### 4.5 Layout System

```
┌──────────┬──────────────────────────────────────────────┐
│          │  TOP BAR                                      │
│ SIDEBAR  │  Page title | Filters | Search | AI shortcut │
│ 240–260px├──────────────────────────────────────────────┤
│          │                                                │
│ Logo     │  MAIN CONTENT CANVAS (12-column grid)         │
│          │                                                │
│ Nav      │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                 │
│          │  │KPI │ │KPI │ │KPI │ │KPI │                 │
│ Shortcuts│  └────┘ └────┘ └────┘ └────┘                 │
│          │                                                │
│ Profile  │  ┌─────────────┐ ┌─────────────┐              │
│          │  │ Chart       │ │ Chart       │              │
│          │  └─────────────┘ └─────────────┘              │
│          │                                                │
│          │  ┌──────────────────────────────────┐          │
│          │  │ Table / Queue / Insights         │          │
│          │  └──────────────────────────────────┘          │
└──────────┴──────────────────────────────────────────────┘
```

- **Sidebar:** 240–260px — logo, navigation groups, shortcuts, profile
- **Top bar:** Page title, date/project/district filters, search, AI shortcut
- **Content:** 12-column grid for desktop/TV

### 4.6 Card Design

| Property | Value |
|---|---|
| Background | White |
| Border radius | 14–18px |
| Border | Subtle `1px solid #E8ECF0` or soft shadow |
| Internal padding | 16–24px |
| Shadow | Subtle, not dramatic floating |
| Hover | Soft lift + slightly stronger shadow |

### 4.7 Standardized Page Templates

#### Template 1: Overview Dashboard

Used for: Operations overview, project overview, executive overview

```
Page title + filters row
─────────────────────────────────
KPI card row (4–6 cards)
─────────────────────────────────
2-column middle analytics section
─────────────────────────────────
Bottom row: tables / insights / map
```

#### Template 2: Action Dashboard

Used for: Action queues, priority lists, follow-up tracking

```
Top summary cards
─────────────────────────────────
Priority queue section
─────────────────────────────────
Case table with filters
─────────────────────────────────
Right: AI / notes panel
```

#### Template 3: Trend & Analytics Dashboard

Used for: Project managers, org-wide analysis

```
Filter row (date, project, district)
─────────────────────────────────
Trend charts (line charts)
─────────────────────────────────
Distribution charts (bar, donut)
─────────────────────────────────
Map + AI summary card
```

#### Template 4: Case Detail Screen

Used for: Individual case management

```
Case header (ID, status, risk)
─────────────────────────────────
Left: case details + timeline
Center: services / actions / notes
Right: AI assistant / risk / referrals
```

### 4.8 Data Visualization Rules

| Aspect | Rule |
|---|---|
| Chart types to prefer | KPI cards, bar charts, stacked bar, line charts, donut charts, progress bars, status tables, pipeline/funnel, heatmap tables, maps |
| Avoid | 3D charts, crowded pie charts, rainbow visuals, dense scatter plots, flashy animations |
| Gridlines | Subtle, light grey, not dominant |
| Labels | Short, clean, human-readable |
| Fixed chart palette | Active=green, Overdue=red, Pending=amber, Closed=grey, AI/trend=blue |

### 4.9 AI Component Visual Style

| Element | Style |
|---|---|
| Accent color | Blue (`#4B7BE5`) or teal |
| Format | Card/panel, clearly labelled |
| Labels | "AI Insight", "AI Suggestion", "AI Summary", "AI Alert" |
| Priority | Embedded and useful — never dominant |

### 4.10 Status Chip System

Pill-style chips with consistent styling:

```
Padding:      6px 14px
Border radius: 9999px (pill)
Font size:    12px, medium weight
```

| Status | Color |
|---|---|
| Active | Green |
| Closed | Grey |
| Referred | Blue |
| Pending | Amber |
| Overdue | Red |
| High Risk | Red |
| Due Today | Amber |
| Validated | Green |
| Needs Review | Amber |

### 4.11 Spacing System

```
Base unit:  4px
Scale:      4, 8, 12, 16, 24, 32, 40px
Card padding:    20px
Card gap:        20px
Section gap:     32px
```

### 4.12 Iconography

| Aspect | Rule |
|---|---|
| Style | Simple line icons, rounded |
| Avoid | Overly playful, military/security icons, harsh symbols |
| Usage | Cases, referrals, risk, follow-ups, maps, supervision, trends, AI |
| Priority | Minimal, supportive — never decorative |

### 4.13 Table Design

| Aspect | Rule |
|---|---|
| Rows | Clean, white or subtle zebra |
| Borders | Minimal |
| Headers | Sticky if possible |
| Status | Chips inside rows |
| Actions | Right-aligned |
| Highlight | Important columns (case ID, risk, follow-up, referral, last updated) |

### 4.14 Map Style

| Aspect | Rule |
|---|---|
| Tone | Subtle and aggregated |
| Data | Province/district shading, dot density carefully, service provider overlays |
| Sensitive | No exact survivor locations |
| Colors | Align with system palette — no GIS-style harsh palettes |

### 4.15 Visual Style by Tab Type

The style stays consistent, but the content density changes by what the tab is designed to do.

| Tab Type | Style |
|---|---|
| **Operational tabs** (Daily Ops, Workload, Risk, Progress) | Large cards, large typography, glanceable, strong status indicators, high readability at distance. *Tone: command center, but calm.* Designed for TV rotation AND desktop viewing. |
| **Case detail tabs** (Priority List, Case Explorer, Survivor Journey) | Detailed tables, action-focused widgets, case-centric layout, optional AI side panel for desktop. On mobile: stacked card layout instead of tables. |
| **Analytical tabs** (Data Quality, Referral Pathways, Trends, Partners) | More charts, geography, trend panels, pattern recognition. Filter-rich. Less case-level detail. |
| **Strategic tabs** (Executive Summary, Portfolio, Donor Reporting) | Polished, less cluttered, high-level metrics, trend summaries, AI narrative box. Designed for print/PDF export as well as screen. |

### 4.16 Do's and Don'ts

| ✅ Do | ❌ Don't |
|---|---|
| Keep screens clean | Use too many colors |
| Standardize all components | Make everything a card with no hierarchy |
| Use calm colors | Overload tables |
| Prioritize readability | Use bright red aggressively |
| Create role-based layouts | Mix multiple chart styles |
| Use card modularity | Mix multiple visual identities |
| Design AI as assistive | Let AI visually overpower |
| Make TV screens big and glanceable | Use raw Power BI-looking clutter |

### 4.17 Standardized Component Library

Every component below should exist as a single reusable implementation:

```
Sidebar              FilterDropdown       ProgressBar
TopBar               SearchBox            DonutChart
KPICard              AlertCard            RiskBadge
StatusChip           AIInsightCard        ReferralBadge
SectionCard          DataTable            MapPanel
ChartCard                                 TimelinePanel
```

---

## 5. Implementation Architecture

### 5.1 Current Architecture

```
[Browser] ←→ [Next.js on Vercel] ←→ [ActivityInfo API]
                              ↕
                       [SWR Client Cache]
```

### 5.2 Proposed Architecture

```
[TV/Desktop/Tablet/Phone] ←→ [Next.js on Vercel] ←→ [ActivityInfo API]
                                                ←→ [services_cleaned.csv]
                              ↕
                       [SWR Client Cache]
                       [AI Service (Claude)]
```

Key decisions:
- **No database**: All data comes from ActivityInfo API at request time
- **Device-responsive**: Same tabs work on TV (auto-rotate), desktop (interactive), tablet, and phone
- **No role-based access**: Every tab is accessible to anyone. Tabs are named by the data/analysis they contain, not by who should see them.
- **AI**: Optional Claude integration for summaries and recommendations

### 5.3 Route Structure

```
/                              → Home / Overview

=== OPERATIONAL ===
/daily-operations              → Daily Operations Snapshot
/workload                      → Workload Distribution
/risk-safety                   → Risk, Safety, Referral Gaps
/case-progress                 → Referral and Case Progress

=== CASE MANAGEMENT ===
/priority-list                 → My Priority List / Action Queue
/cases                         → Case Explorer (searchable table)
/cases/[id]                    → Survivor Journey (case detail)
/referral-assistant            → Referral Assistant
/ai                            → AI Assistant (Chat with Data)

=== ANALYSIS ===
/data-quality                  → Data Quality Monitor
/referral-pathways             → Referral Pathway Performance
/map                           → Geographic & Protection Gap Analysis
/trends                        → Trends and Patterns
/partners                      → Partner / Implementation Performance

=== STRATEGY ===
/summary                       → Executive Summary
/portfolio                     → Portfolio Analysis
/strategic-analysis            → Strategic Protection Analysis
/resource-planning             → Resource Allocation & Planning
/reporting                     → Donor Reporting
```

### 5.4 API Routes

```
GET  /api/cases?filter=open    → All cases or open only (with risk scores)
GET  /api/cases/:id            → Single case detail
GET  /api/services             → Services catalog
GET  /api/services/district/:d → Services filtered by district
GET  /api/stats                → Pre-computed statistics (optimized)
POST /api/ai/chat              → AI chat (messages[], context)
POST /api/ai/summarize         → AI case summary (case_id)
```

### 5.5 TV Auto-Rotation

```
Component: TVCarousel
- Cycles through 4 operational screens at configurable interval (default 30s)
- Large fonts (min 16px body, 32px headings)
- High contrast for readability at distance
- No interactive elements
- No sensitive case details (names, specific locations)
- Aggregated data only
- Same screens work on desktop with manual navigation
```

---

## 6. Phased Implementation Plan

### Phase 1: Core Operational Screens (Week 1-2)

**Goal:** Get 4 operational screens running with real data. These drive the TV rotation AND work as interactive desktop pages.

| Screen | Effort | Priority |
|---|---|---|
| Daily Operations Snapshot | 4h | P0 |
| Workload Distribution | 3h | P0 |
| Risk, Safety, Referral Gaps | 4h | P0 |
| Referral and Case Progress | 3h | P0 |
| TV auto-rotation + responsive layout | 2h | P0 |

**Deliverable:** 4 operational screens working on TV (auto-rotate) and desktop (manual navigation).

### Phase 2: Case Management Screens (Week 2-3)

**Goal:** Interactive tools for working with individual cases.

| Feature | Effort | Priority |
|---|---|---|
| My Priority List / Action Queue | 4h | P0 |
| Case Explorer (searchable table with filters) | 3h | P0 |
| Survivor Journey (case detail view) | 6h | P0 |
| Referral Assistant (services lookup) | 4h | P1 |
| AI Assistant (basic chat) | 6h | P1 |

### Phase 3: Analysis Screens (Week 3-4)

**Goal:** Data quality oversight and analytical views.

| Feature | Effort | Priority |
|---|---|---|
| Data Quality Monitor | 4h | P1 |
| Referral Pathway Performance | 4h | P1 |
| Geographic & Protection Gap Map | 6h | P1 |
| Trends and Patterns | 4h | P0 |
| Partner / Implementation Performance | 3h | P2 |

### Phase 4: Strategy Screens (Week 4-5)

**Goal:** Programme-level and strategic views with AI-powered features.

| Feature | Effort | Priority |
|---|---|---|
| Executive Summary | 3h | P0 |
| Portfolio Analysis | 3h | P1 |
| Strategic Protection Analysis | 4h | P1 |
| Resource Allocation & Planning | 3h | P2 |
| Donor Reporting | 4h | P2 |
| AI Chat assistant (full) | 8h | P1 |
| AI Case summary | 4h | P1 |

---

## 7. Route / Navigation Design

### 7.1 Navigation Structure

Tabs organized by data domain, not by role. Any user can access any tab.

```
┌──────────────────────────────────────────────┐
│  SIDEBAR                                      │
├──────────────────────────────────────────────┤
│  🏠 Home                                      │
│  ──────────────────────────────────────────── │
│  📊 Operational                               │
│  │  └─ Daily Operations                       │
│  │  └─ Workload                               │
│  │  └─ Risk & Safety                          │
│  │  └─ Case Progress                          │
│  ──────────────────────────────────────────── │
│  📋 Cases                                     │
│  │  └─ My Priority List                       │
│  │  └─ Case Explorer                          │
│  │  └─ Survivor Journey                       │
│  │  └─ Referral Assistant                     │
│  ──────────────────────────────────────────── │
│  📈 Analysis                                  │
│  │  └─ Data Quality                           │
│  │  └─ Referral Pathways                      │
│  │  └─ Geographic Map                         │
│  │  └─ Trends & Patterns                      │
│  │  └─ Partner Performance                    │
│  ──────────────────────────────────────────── │
│  🏢 Strategy                                  │
│  │  └─ Executive Summary                      │
│  │  └─ Portfolio Analysis                     │
│  │  └─ Strategic Analysis                     │
│  │  └─ Resource Planning                      │
│  │  └─ Donor Reporting                        │
│  ──────────────────────────────────────────── │
│  🤖 AI Assistant (floating button in header)  │
└──────────────────────────────────────────────┘
```

The sidebar collapses to icons-only on smaller screens. On mobile, it becomes a bottom tab bar or hamburger menu.

### 7.2 Navigation Principles

```
▪ Every tab is accessible to every user — no role gating
▪ Tabs are named by the type of data/analysis they contain
▪ Navigation groups are logical categories, not permission levels
▪ TV mode uses auto-rotation, hiding the sidebar
▪ Desktop mode shows the sidebar for manual navigation
▪ Mobile uses a bottom tab bar or hamburger menu
```

---

## 8. Component Tree

```
app/
├── layout.tsx                    ← Root layout (sidebar + top bar)
├── page.tsx                      ← Home / Overview
│
├── daily-operations/page.tsx     ← Operational
├── workload/page.tsx
├── risk-safety/page.tsx
├── case-progress/page.tsx
│
├── priority-list/page.tsx        ← Case Management
├── cases/
│   ├── page.tsx                  ← Case Explorer (searchable table)
│   └── [id]/page.tsx             ← Survivor Journey (case detail)
├── referral-assistant/page.tsx
│
├── data-quality/page.tsx         ← Analysis
├── referral-pathways/page.tsx
├── map/page.tsx
├── trends/page.tsx
├── partners/page.tsx
│
├── summary/page.tsx              ← Strategy
├── portfolio/page.tsx
├── strategic-analysis/page.tsx
├── resource-planning/page.tsx
├── reporting/page.tsx
│
├── ai/page.tsx                   ← AI Assistant
│
├── api/
│   ├── cases/route.ts
│   ├── cases/[id]/route.ts
│   ├── services/route.ts
│   ├── services/district/[d]/route.ts
│   └── ai/chat/route.ts

components/
├── tv/
│   ├── TVFrame.tsx               ← TV wrapper (fullscreen, clock, rotation)
│   ├── DailyOpsCard.tsx
│   ├── WorkloadCard.tsx
│   ├── RiskCard.tsx
│   ├── ProgressCard.tsx
│   └── TVRotation.tsx            ← Carousel logic (reuses Operational pages)
├── cases/
│   ├── CaseTable.tsx              ← Searchable, sortable, filterable
│   ├── CaseDetail.tsx             ← Full case detail view
│   ├── CaseTimeline.tsx           ← Visual timeline of case events
│   ├── CaseRiskBadge.tsx
│   └── ReferralStatus.tsx
├── charts/
│   ├── MonthlyTrend.tsx
│   ├── ViolenceBreakdown.tsx
│   ├── AgeDistribution.tsx
│   ├── ReferralFunnel.tsx        ← Identification → Referral → Closure
│   ├── GeoMap.tsx                ← Choropleth map by district
│   └── KPIChart.tsx
├── layout/
│   ├── Sidebar.tsx               ← Universal navigation
│   └── Header.tsx
├── shared/
│   ├── KPICard.tsx
│   ├── DataTable.tsx
│   ├── AlertBanner.tsx
│   ├── StatusBadge.tsx
│   ├── LoadingSkeleton.tsx
│   ├── FilterBar.tsx
│   └── DateRangePicker.tsx
└── ai/
    ├── ChatWindow.tsx
    ├── CaseSummary.tsx
    └── SuggestionCard.tsx
```

---

## 9. Development Tracking

> **Baseline (Already Deployed):** The current dashboard at `gbv-dashboard-web.vercel.app` has a 6-page v0 (Overview, Urgent, Analytics, Cases, Projects, Managers) with KPI cards, charts, case table, risk scoring, and services integration. This serves as the foundation. All items below are tracked against the NEW spec.

### Phase 1 — Operational Screens

| Item | Status | Notes |
|---|---|---|
| Daily Operations Snapshot | ✅ Implemented | Indicators: total active, new 7d, no referral, critical, >30d, stale, pipeline bars |
| Workload Distribution | ✅ Implemented | Per-manager table + load distribution bars + alerts matrix |
| Risk, Safety, Referral Gaps | ✅ Implemented | Risk flags, safety gaps, unsafe count, no safety plan, family perpetrator, previous incidents |
| Referral and Case Progress | ✅ Implemented | Pipeline funnel, referral by service type, closure reasons, avg days to referral/closure |
| TV auto-rotation + responsive layout | 🔲 Not started | |
| `/api/stats` optimized endpoint | 🔲 Not started | |

### Phase 2 — Case Management Screens

| Item | Status | Notes |
|---|---|---|
| My Priority List / Action Queue | ✅ Implemented | Priority queue table, alert cards, summary metrics |
| Case Explorer (searchable table) | ✅ Implemented | Links to Survivor Journey |
| Survivor Journey (case detail) | ✅ Implemented | Full detail: overview, timeline, risk, referrals, perpetrator, alerts |
| Case Timeline component | ✅ Implemented | Vertical timeline with dates |
| Referral Assistant | ✅ Implemented | Service catalog, district coverage map, service needs analysis |
| AI Assistant (basic) | 🔲 Not started |
| `/api/ai/chat` endpoint | 🔲 Not started | |

### Phase 3 — Analysis Screens

| Item | Status | Notes |
|---|---|---|
| Data Quality Monitor | ✅ Implemented | 12 quality checks with counts, percentages, severity badges |
| Referral Pathway Performance | ✅ Implemented | Referral by service type, district referral rates, pipeline overview |
| Geographic Map | ✅ Implemented | District-level case/service coverage table, gap alerts |
| Trends and Patterns | ✅ Implemented | Monthly chart, violence type, age, project, province distributions |
| Partner / Implementation Performance | ✅ Implemented | Per-partner case counts, close rate, referral rate |

### Phase 4 — Strategy Screens

| Item | Status | Notes |
|---|---|---|
| Executive Summary | 🔲 Not started | |
| Portfolio Analysis | 🔲 Not started | |
| Strategic Protection Analysis | 🔲 Not started | |
| Resource Allocation & Planning | 🔲 Not started | |
| Donor Reporting | 🔲 Not started | |
| AI Assistant (full) | 🔲 Not started | |

### Reusable UI Components (adapted from TailAdmin patterns)

| Component | Status | Notes |
|---|---|---|
| GCRCard | ✅ Implemented | Title + body layout, 16px radius, GCR palette |
| GCRBadge | ✅ Implemented | Pill-style, 5 semantic colors |
| GCRTable / GCRTHead / GCRTBody / GCRTRow / GCRTCell | ✅ Implemented | Full table component set with onClick support |
| GCRTabToggle | ✅ Implemented | Period toggle (7d/30d/All style) |
| Dark mode support | 🔲 Not started | TailAdmin has this pattern |

### Known Technical Debt

| Issue | Impact | Plan |
|---|---|---|
| `data_sharing_consent` and `rape_consequences_explained` fields defined in Python but not in TS types | Missing fields | Add to activityinfo.ts column map and types.ts |
| ActivityInfo token rotates; hard failure when expired | Dashboard goes down | Add token expiry warning banner |
| Services CSV served from filesystem; doesn't auto-update | Stale service data | Replace with API endpoint or periodic fetch |
| `closure_reason_detail` field defined in Python but not TS | Missing detail | Add to types.ts |
| TV rotation uses page-level JavaScript | Reset on navigation | Use URL query param for rotation state |

---

## Appendix A: Quick Reference — Data Availability by Screen

```
LEGEND:
✅ = Fully available in ActivityInfo
⚠️ = Partial/proxy — requires calculation
❌ = Not available — skipped or mitigated

SCREEN                              AVAILABILITY
──────────────────────────────────────────────────────
TV 1: Daily Operations              6✅  0⚠️  2❌
TV 2: Workload                      4✅  3⚠️  0❌
TV 3: Risk & Safety                 7✅  1⚠️  1❌
TV 4: Case Progress                 7✅  1⚠️  1❌
CM Dashboard                        4✅  1⚠️  0❌
Case Table (filters)                6✅  1⚠️  1❌
Case Detail                         8✅  1⚠️  0❌
Referral Assistant                  3✅  0⚠️  1❌
Supervisor Team Overview            8✅  1⚠️  0❌
Data Quality Monitor                8✅  0⚠️  0❌
Project Overview                    6✅  1⚠️  0❌
Referral Pathway Performance        3✅  2⚠️  1❌
Trends & Patterns                   5✅  0⚠️  0❌
Executive Summary                   6✅  0⚠️  0❌
Donor Reporting                     5✅  0⚠️  0❌

TOTAL: 87 indicators
✅ Available: 71 (82%)
⚠️ Partial/proxy: 10 (11%)
❌ Not available: 6 (7%)
```

The dashboard is **highly feasible** — 82% of requested indicators are directly available from ActivityInfo data. The remaining 18% use reasonable proxies or can be flagged as "requires ActivityInfo form update."

---

## Appendix B: ActivityInfo Form Enhancement Recommendations

To close the 6 gaps and strengthen the dashboard, consider adding these fields to the ActivityInfo form:

| Field | Type | Priority | Used By |
|---|---|---|---|
| `Data do último contacto` | Date | High | All operational screens |
| `Data do próximo seguimento` | Date | High | All operational screens |
| `Referência concluída (Sim/Não)` | Yes/No | High | Referral completion tracking |
| `Data de conclusão da referência` | Date | Medium | Referral completion rate |
| `Plano de acção criado (Sim/Não)` | Yes/No | Medium | Case action plan tracking |
| `Supervisor(a)` | Text | Medium | Supervisor assignments |

---

*This document is a living strategy document. Update as implementation progresses and new requirements emerge.*

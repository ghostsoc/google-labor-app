# In The Wind AV: Production Rental & Labor Management Architecture

A professional live event production platform delivering equipment fleet inventory management, client CRM tracking, multi-user role assignments, crew scheduling, and fast client quote and CSV report generation.

### User Review & Critical Decisions

> [!IMPORTANT]
> The CSV export feature in both `ClientsManager` and `InventoryManager` has been engineered with UTF-8 BOM encoding for seamless Microsoft Excel / Google Sheets compatibility, escaped delimiters, and active filter persistence. Please review the planned expansion for multi-role team accounts and Firestore synchronization.

- **Confirmed Decision 1**: CSV exports include dynamic record counters and automatically respect active search queries and filter constraints (such as billing terms or equipment categories).
- **Confirmed Decision 2**: UTF-8 Byte Order Mark (`\uFEFF`) is prepended to all generated CSV blobs to eliminate special character truncation and Excel formatting glitches.
- **Open Choice for Cloud Sync**: Multi-user accounts support local administrative delegation or synchronized team access with persistent Firestore document collections.

---

## 1. Overview & Core Concept

- **What It Does**: Provides live event AV rental houses with an all-in-one console to manage inventory assets, schedule technical crew labor, maintain client CRM profiles with credit terms, configure team permissions, and export structured datasets for accounting and logistics.
- **Target Audience / Persona**: Production managers, warehouse operations leads, AV technical directors, and project managers coordinating concerts, corporate conventions, and live broadcasts.
- **Key Value**: Eliminates double-booking of rental assets, automates gear and labor quote calculations, and facilitates quick data exports for external bookkeeping and logistics pipelines.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Fleet Inventory & Asset Auditing**:
   - Operations managers browse equipment categorized by Audio, Video, Lighting, Staging, and Rigging.
   - Live search filters gear by model, brand, or status (Available, In Transit, In Maintenance).
   - Clicking **Export CSV** downloads a timestamped spreadsheet (`inventory_fleet_export_YYYY-MM-DD.csv`) containing complete technical specs, power draws, weights, and service histories.
2. **Client Accounts & Billing Management**:
   - Accounts teams review client terms (Net 30, Net 15, Due on Receipt, Tax Exempt).
   - Filtered account queries can be instantly downloaded as `clients_crm_export_YYYY-MM-DD.csv`.
3. **Multi-User Team Accounts**:
   - Administrators assign roles (Admin, Manager, Technician, View Only) to crew members.
   - User account views toggle operational permissions and track assigned productions.

### Visual Identity & Theme
- **Aesthetic Direction**: High-contrast, dark-mode utilitarian operations dashboard tailored for production control environments and warehouse environments.
- **Color Palette & Mood**:
  - Background Canvas: Deep neutral slate (`#0a0d14` / `bg-neutral-950`)
  - Structural Panels: Flat elevated containers with hairline borders (`#171b26` / `border-neutral-800`)
  - Accent / Primary Actions: High-visibility electric amber and cyan highlights for key interactive states
  - Status Indicators: Emerald (`#10b981`) for Available/Active, Amber (`#f59e0b`) for In Transit/Pending, Crimson (`#ef4444`) for In Maintenance/Overdue
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans` for clean, modern structure
  - Data & Metrics: Monospace tabular numerals (`font-mono tabular-nums`) for currency values, wattage calculations, and weights
  - Body Copy: Clean neutral sans (`text-neutral-300`, `text-neutral-400`)
- **Interactive Feedback & Motion**:
  - Instant client-side search filtering under 50ms
  - Micro-interactions on buttons with quick 150ms hover feedback
  - Non-blocking CSV file generation and browser download triggers

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side CSV Serialization vs Server Rendering**
  - *Chosen Approach*: Pure client-side Blob generation with `URL.createObjectURL` and safe RFC 4180 escaping.
  - *Why*: Instant generation with zero network roundtrip latency, full offline capability during warehouse floor audits, and zero server resource consumption.
  - *Alternatives Considered*: Backend proxy stream; rejected due to latency and unnecessary server overhead.

- **Decision 2: Synchronous Local State with Optional Cloud Persistence**
  - *Chosen Approach*: React Context architecture (`AppContext`) with default fallback data and seamless Firebase Firestore sync capabilities.
  - *Why*: Allows immediate evaluation and offline operations while providing enterprise cloud synchronization when authenticated.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        In The Wind AV Web App                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
            ┌───────────────────────┴───────────────────────┐
            ▼                                               ▼
┌─────────────────────────┐                     ┌────────────────────────┐
│     App Navigation      │                     │   AppContext Store     │
│   (Header 3-Zone Bar)   │                     │  (State & Persistence) │
└───────────┬─────────────┘                     └───────────┬────────────┘
            │                                               │
 ┌──────────┼───────────────┬─────────────────┐             │
 │          │               │                 │             │
 ▼          ▼               ▼                 ▼             │
[Quotes] [Inventory]    [Clients]       [Team Users]        │
   │        │               │                 │             │
   │        ▼               ▼                 ▼             │
   │  ┌───────────┐   ┌───────────┐     ┌───────────┐       │
   │  │Filtered   │   │Filtered   │     │Role-Based │       │
   │  │Fleet List │   │Client List│     │Permissions│       │
   │  └─────┬─────┘   └─────┬─────┘     └───────────┘       │
   │        │               │                               │
   │        ▼               ▼                               │
   │   [Export CSV]    [Export CSV]                         │
   │        │               │                               │
   │        └───────┬───────┘                               │
   │                ▼                                       ▼
   │       ┌─────────────────┐                  ┌────────────────────────┐
   │       │  csvExport.ts   │                  │  Firebase Firestore    │
   │       │  UTF-8 BOM Blob │                  │  (Cloud Persistence)   │
   │       └─────────────────┘                  └────────────────────────┘
```

### Data Model & State Entities
- **InventoryItem**: ID, name, category, quantity, daily rate, replacement cost, status, serial/asset tag, power watts, weight lbs, maintenance history.
- **ClientAccount**: ID, company, contact name, email, phone, billing terms, tax exemption status, address, notes.
- **TeamUser**: ID, name, email, role (`admin` | `manager` | `tech` | `viewer`), assigned events, last active timestamp.
- **QuoteProject**: ID, event name, client ID, date range, line items (gear & labor), subtotal, discount, tax, deposit.

### Interactive Component & State Mapping
- `ClientsManager`: Exposes real-time search, billing term filters, add/edit modal forms, and the `handleExportClientsCSV` action with record count badge.
- `InventoryManager`: Provides category tabs, stock status filters, equipment addition workflows, and the `handleExportInventoryCSV` trigger.
- `TeamManager`: Grants role assignments, team member onboarding, and permission enforcement across the application.

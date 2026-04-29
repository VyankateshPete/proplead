# PropLead

PropLead is a React + TypeScript web app that mirrors the UI and flows of the provided Lovable deployment for B2B commercial property insurance lead qualification.

## Features

- Dashboard with KPI cards, lead volume charts, source breakdown, segment distribution, and recent high-value leads
- Leads view with date/status/source filtering, search, list cards, and table view
- Lead detail page with score, AI conversion forecast, CDP enrichment, activity timeline, and CRM actions
- Campaign performance page with spend/lead metrics and campaign table
- Settings page for scoring, notifications, compliance, and integrations
- CSV-backed data loading from:
  - `public/data/meta_leads.csv`
  - `public/data/internal_cdp_sample_data.csv`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Adapter stubs (env-driven)

The app includes real adapter stubs so you can quickly connect live credentials:

- Meta Graph API
- Mailchimp
- ActiveCampaign
- Clearbit
- ZoomInfo

### 1) Configure environment variables

Copy the example file and set values:

```bash
cp .env.example .env
```

Important variables:

- `VITE_ADAPTER_PROXY_BASE_URL` (recommended for browser-safe API calls through your backend proxy)
- `VITE_META_ACCESS_TOKEN`, `VITE_META_AD_ACCOUNT_ID`, `VITE_META_PAGE_ID`
- `VITE_MAILCHIMP_API_KEY`, `VITE_MAILCHIMP_SERVER_PREFIX`, `VITE_MAILCHIMP_AUDIENCE_ID`
- `VITE_ACTIVECAMPAIGN_BASE_URL`, `VITE_ACTIVECAMPAIGN_API_KEY`
- `VITE_CLEARBIT_API_KEY`
- `VITE_ZOOMINFO_BASE_URL`, `VITE_ZOOMINFO_API_KEY`

### 2) Adapter service modules

Located in `src/services/adapters/`:

- `metaGraphAdapter.ts`
- `mailchimpAdapter.ts`
- `activeCampaignAdapter.ts`
- `clearbitAdapter.ts`
- `zoomInfoAdapter.ts`
- `adapterDiagnostics.ts` (integration status mapping)
- `http.ts` (shared request + optional proxy support)

### 3) Integration status in UI

Settings page now reads adapter-backed status so integration rows reflect missing/present env configuration.

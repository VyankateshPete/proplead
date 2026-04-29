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

# PitchLens Frontend (Next.js)

Next.js application for:
- Message analysis input.
- Result comparison and score visualization.
- Analysis history dashboard.
- Badge generation and download.

## Routes

- `/`: Marketing landing page.
- `/app`: Analyze text/URL and save analysis.
- `/dashboard`: Latest analysis, subscores, insights, and recent history.
- `/badges`: Generate and download badge assets from latest analysis.

## Setup

```bash
cd front-end
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

- `NEXT_PUBLIC_API_BASE`: Backend base URL.
  - Example: `http://127.0.0.1:8000`

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Data Flow

1. `/app` sends payload to `POST /analyze`.
2. API response is saved to local storage (`pitchlens:lastAnalysis`).
3. `/dashboard` and `/badges` pull latest from API first, then local storage fallback.

## Build Notes

- Frontend requires backend availability for real-time analysis.
- Dashboard and badges are resilient to API downtime by using last local saved record.

## Key Files

- `front-end/app/app/page.tsx`: Analyzer workflow.
- `front-end/app/dashboard/page.tsx`: Score + insight dashboard.
- `front-end/app/badges/page.tsx`: Badge generation and download.
- `front-end/lib/api.ts`: API client helpers.
- `front-end/lib/storage.ts`: Local storage persistence helpers.
- `front-end/lib/analysis.ts`: Shared frontend analysis types.

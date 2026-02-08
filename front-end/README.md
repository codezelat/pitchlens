# PitchLens Frontend

The frontend is a Next.js 16 application responsible for user interaction and presentation of analysis results.

It provides:
- Input form for text/URL analysis.
- Visual score presentation and insights.
- History-oriented dashboard view.
- Badge preview, embed code generation, and PNG/SVG download.

## Tech Stack

- Next.js 16 (`app` router)
- React 19
- TypeScript
- Tailwind CSS 4
- Browser local storage for last-analysis fallback

## Directory Layout

```text
front-end/
  README.md
  app/
    page.tsx                 # Landing page
    app/page.tsx             # Analyze flow
    dashboard/page.tsx       # Score and history UI
    badges/page.tsx          # Badge generation/download UI
    layout.tsx
    globals.css
  lib/
    analysis.ts              # Shared analysis types and tone mapping
    api.ts                   # API fetch helpers
    storage.ts               # Local storage helpers
  public/
  package.json
  tsconfig.json
  .env.example
```

## Route Behavior

- `/`
  - Marketing/landing page.

- `/app`
  - Accepts either text or URL input.
  - Derives `tone` from slider value and maps persona selection.
  - Sends request to `POST /analyze`.
  - Stores API result in local storage (`pitchlens:lastAnalysis`).
  - Shows before/after content, sub-scores, and insights.

- `/dashboard`
  - Fetches recent analyses from backend (`GET /analyses?limit=8`).
  - Falls back to local storage when backend is unavailable.
  - Displays latest record details, score cards, insights, and recent entries.

- `/badges`
  - Fetches latest analysis (`GET /analyses/latest`) with local fallback.
  - Builds badge markup using latest `score` with hero/compact/minimal style selection.
  - Supports SVG download and PNG rasterization via canvas.
  - Supports one-click social sharing (X/LinkedIn) and embed-code copy.

## API Integration Contract

Frontend expects backend response shape compatible with:

```ts
{
  id: number;
  created_at: string;
  tone: "professional" | "casual" | "enthusiastic";
  persona: "expert" | "friendly" | "authoritative";
  score: number;
  clarity: number;
  emotion: number;
  credibility: number;
  market_effectiveness: number;
  suggestion: string;
  insights: string[];
  message?: string | null;
  url?: string | null;
}
```

## Local Storage

Key used:
- `pitchlens:lastAnalysis`

Fallback strategy:
- Dashboard and badges attempt backend fetch first.
- On failure or missing data, they render from local storage if available.

## Configuration

Environment file: `front-end/.env.local`

Required for normal operation:
- `NEXT_PUBLIC_API_BASE`
  - Example: `http://127.0.0.1:8000`

## Development

```bash
cd front-end
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Build and Validation

```bash
cd front-end
npm run lint
npm run build
npm run start
```

`npm run build` has been validated for this repository state.

## Error Handling Behavior

- `/app` shows an inline error banner when:
  - no input was provided,
  - backend returned non-OK response,
  - network request failed.

- `/dashboard` and `/badges` avoid hard failure by using local fallback state.
- Local fallback views include a cache timestamp warning and stale-data indicator.

## UX Notes

- Tone slider maps to API values via `toneFromSlider` in `lib/analysis.ts`.
- Persona options are constrained to backend-accepted values.
- Badge PNG generation is client-side; browser canvas support is required.

## Current Constraints

- No frontend auth/login flow is implemented.
- When backend auth is enforced, frontend requests must be extended to include bearer tokens.
- API-dependent pages can show stale data if only local fallback is available.

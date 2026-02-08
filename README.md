# PitchLens

PitchLens is a full-stack message intelligence application.

It provides:
- A Next.js frontend for submitting text/URL input, viewing analysis results, and generating badges.
- A FastAPI backend for analysis, persistence, history retrieval, and optional token-based access control.

This repository is organized as a monorepo with separate frontend and backend projects.

## What Is Implemented

- Message analysis from direct text input.
- Message analysis from fetched URL content.
- Scoring dimensions: `clarity`, `emotion`, `credibility`, `market_effectiveness`, and `score`.
- AI analysis via Gemini when configured.
- Deterministic fallback analysis when Gemini is not configured or fails.
- Structured analysis metadata (confidence, diagnostics, rewrite options, evidence needs).
- Persistent storage for analysis records.
- Analysis history endpoints.
- Dashboard and badge pages backed by persisted API data, with local-storage fallback.
- Badge download in both SVG and PNG formats.
- Alembic migrations for schema management.
- Optional bearer-token auth enforcement at API level.
- Production startup guards for auth/rate-limit/model readiness.
- Shared DB-backed rate limiting for analyze requests.
- SSRF protections on URL ingestion.

## Repository Structure

```text
pitchlens/
  README.md
  .gitignore
  front-end/
    README.md
    app/
    lib/
    package.json
    .env.example
  back-end/
    README.md
    app.py
    db.py
    models.py
    tests/
    alembic/
    alembic.ini
    requirements.txt
    requirements-dev.txt
    .env.example
```

## Technology Stack

Frontend:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

Backend:
- FastAPI
- SQLAlchemy 2
- Alembic
- Pydantic v2
- httpx
- Optional `google-genai` integration

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- pip

## Quick Start

### 1) Start backend

```bash
cd back-end
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

### 2) Start frontend

```bash
cd front-end
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Configuration

### Frontend environment

File: `front-end/.env.local`

- `NEXT_PUBLIC_API_BASE`
  - Backend base URL used by frontend API calls.
  - Default in example: `http://127.0.0.1:8000`.

### Backend environment

File: `back-end/.env`

- `GOOGLE_API_KEY`
  - Required when running with `APP_ENV=production`.
  - Enables Gemini analysis path.
- `GENAI_MODEL`
  - Optional. Gemini model id.
  - Default: `models/gemini-2.5-flash`.
- `DATABASE_URL`
  - Database connection string.
  - Default: `sqlite:///./pitchlens.db`.
- `ALLOWED_ORIGINS`
  - Comma-separated CORS allowlist.
- `APP_ENV`
  - `development` or `production`.
  - Production mode enables stricter safety checks.
- `REQUIRE_AUTH`
  - `true`/`false`.
  - When `true`, API requires bearer token and validates via JWKS.
- `ALLOW_PUBLIC_API_IN_PROD`
  - `true`/`false`.
  - Emergency override that allows public API access in production.
- `CLERK_ISSUER`
  - JWT issuer URL for token validation mode.
- `CLERK_JWKS_URL`
  - Optional explicit JWKS endpoint. If empty and issuer is provided, derived as `<issuer>/.well-known/jwks.json`.
- `CLERK_AUDIENCE`
  - Optional expected JWT audience.
- `JWKS_CACHE_TTL`
  - JWKS cache lifetime in seconds.
- `AUTO_CREATE_DB`
  - `true`/`false`.
  - When `true`, backend runs table initialization at startup.
- `RATE_LIMIT_PER_MINUTE`
  - Requests/minute for `/analyze` per user id or client IP.
  - `0` disables rate limiting.

## API Summary

- `POST /analyze`
  - Analyze input and persist record.
- `GET /analyses/latest`
  - Fetch latest record.
- `GET /analyses/{analysis_id}`
  - Fetch record by id.
- `GET /analyses?limit=20`
  - Fetch recent records.
- `GET /health`
  - Health endpoint.

See backend details in `back-end/README.md`.

## Data Flow Overview

1. User submits text or URL in `/app`.
2. Frontend sends request to backend `/analyze`.
3. Backend validates input, optionally fetches URL content, runs AI/fallback scoring, persists record, returns normalized payload.
4. Frontend stores returned payload in local storage key `pitchlens:lastAnalysis`.
5. Dashboard and badges attempt API fetch first, then fallback to local storage if needed.

## Migrations

For migration-driven environments:

```bash
cd back-end
export AUTO_CREATE_DB=false
alembic upgrade head
```

## Quality Checks

Frontend:

```bash
cd front-end
npm run lint
npm run build
```

Backend:

```bash
cd back-end
python -m pytest -q
```

## Security Controls Implemented

- URL scheme restriction: `http`/`https` only.
- `https` enforcement in production mode for URL ingestion.
- Local/private-network blocking for URL ingestion.
- URL credential and non-standard port blocking on fetch path.
- Redirect cap for URL fetching.
- Optional JWT verification with JWKS caching.
- Request rate limiting for `/analyze` (DB-backed with in-memory fallback).
- Production startup guards for auth/rate-limit/model readiness.
- Request correlation id via `X-Request-ID` response header.

## Known Constraints

- Frontend does not currently provide a login UI/token acquisition flow.
- If `REQUIRE_AUTH=true`, callers must supply valid bearer tokens externally.
- Frontend currently does not render advanced `analysis_meta` fields returned by backend.

## Troubleshooting

- Frontend cannot reach backend:
  - Verify backend is running on `NEXT_PUBLIC_API_BASE`.
  - Confirm CORS origins include your frontend URL.

- `404` on `/analyses/latest`:
  - Run one analysis first via `/app`.

- Auth errors with `REQUIRE_AUTH=true`:
  - Verify issuer/JWKS/audience settings and token signature claims.

- Database schema issues:
  - Ensure migrations are applied (`alembic upgrade head`) when `AUTO_CREATE_DB=false`.

## Additional Documentation

- Frontend details: `front-end/README.md`
- Backend details: `back-end/README.md`

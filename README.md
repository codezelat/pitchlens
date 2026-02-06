# PitchLens

PitchLens is a full-stack message intelligence product:
- `front-end`: Next.js 16 web app for analysis, dashboard, and badge generation.
- `back-end`: FastAPI service for text/URL analysis, persistence, and history APIs.

The current implementation supports:
- Real analysis requests from UI to API.
- Persisted analysis records.
- Dashboard and badges driven by persisted data.
- SVG/PNG badge download.
- Optional JWT auth enforcement on API.
- Alembic migrations for production database management.

## Repository Layout

```text
pitchlens/
  front-end/    # Next.js app
  back-end/     # FastAPI app
```

## Prerequisites

- Node.js 18+
- npm 9+
- Python 3.10+
- pip

## Local Setup

### 1) Backend

```bash
cd back-end
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

### 2) Frontend

In a second terminal:

```bash
cd front-end
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

### Backend (`back-end/.env`)

- `GOOGLE_API_KEY`: Optional. If set, Gemini analysis is used before fallback analysis.
- `GENAI_MODEL`: Optional. Defaults to `models/gemini-2.5-flash`.
- `DATABASE_URL`: Optional. Defaults to `sqlite:///./pitchlens.db`.
- `ALLOWED_ORIGINS`: Comma-separated CORS origins.
- `REQUIRE_AUTH`: `true|false`. If `true`, bearer auth is required.
- `CLERK_ISSUER`: JWT issuer URL for Clerk-style JWKS validation.
- `CLERK_JWKS_URL`: Optional explicit JWKS endpoint.
- `CLERK_AUDIENCE`: Optional JWT audience.
- `JWKS_CACHE_TTL`: JWKS cache TTL in seconds.
- `AUTO_CREATE_DB`: `true|false`. Local convenience table creation.
- `RATE_LIMIT_PER_MINUTE`: Per user/IP rate limit for `/analyze`.

### Frontend (`front-end/.env.local`)

- `NEXT_PUBLIC_API_BASE`: API base URL. Default `http://127.0.0.1:8000`.

## Build Commands

### Frontend

```bash
cd front-end
npm run lint
npm run build
npm run start
```

### Backend

```bash
cd back-end
python -m pytest
```

## API Surface

- `POST /analyze`: Analyze input text or URL, persist record, return normalized scores + rewrite + insights.
- `GET /analyses/latest`: Latest stored analysis.
- `GET /analyses/{analysis_id}`: Analysis by id.
- `GET /analyses?limit=20`: Recent analyses list.
- `GET /health`: Service health.

Detailed API docs: `back-end/README.md`.

## Database Migrations

For production/staging:

```bash
cd back-end
export AUTO_CREATE_DB=false
alembic upgrade head
```

## Production Readiness Checklist (Code + Runtime)

1. Use Postgres via `DATABASE_URL`.
2. Set strict `ALLOWED_ORIGINS`.
3. Set `REQUIRE_AUTH=true` and configure issuer/JWKS/audience.
4. Keep `AUTO_CREATE_DB=false` and run Alembic migrations.
5. Set `RATE_LIMIT_PER_MINUTE`.
6. Ensure frontend `NEXT_PUBLIC_API_BASE` points to production API.
7. Run frontend build + backend tests in CI before release.

## Notes

- URL analysis has SSRF protections (private/loopback block + redirect checks).
- If Gemini is unavailable or errors, the backend automatically falls back to deterministic analysis logic.

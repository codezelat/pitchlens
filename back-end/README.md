# PitchLens Backend

The backend is a FastAPI service that performs message analysis, persists results, and serves history APIs to the frontend.

## Core Responsibilities

- Accept message or URL input.
- Validate input size and shape.
- Fetch and extract URL text when requested.
- Run Gemini-backed analysis when configured.
- Fallback to deterministic analysis when Gemini is unavailable/fails.
- Persist normalized analysis records.
- Serve latest and historical records.
- Optionally enforce bearer-token authentication.

## Stack

- FastAPI
- SQLAlchemy 2
- Alembic
- Pydantic 2
- httpx
- Optional `google-genai`
- Optional `python-jose` JWT verification path

## Project Layout

```text
back-end/
  app.py
  db.py
  models.py
  requirements.txt
  requirements-dev.txt
  .env.example
  alembic.ini
  alembic/
    env.py
    versions/
      20260206_0001_create_analyses.py
  tests/
    test_analysis.py
    test_api.py
```

## Local Setup

```bash
cd back-end
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
cp .env.example .env
uvicorn app:app --reload --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Environment Variables

- `GOOGLE_API_KEY`
  - Optional. Enables Gemini analysis path.

- `GENAI_MODEL`
  - Optional. Gemini model id.
  - Default: `models/gemini-2.5-flash`.

- `DATABASE_URL`
  - SQLAlchemy connection URL.
  - Default: `sqlite:///./pitchlens.db`.

- `ALLOWED_ORIGINS`
  - Comma-separated CORS allowlist.

- `REQUIRE_AUTH`
  - `true` or `false`.
  - If `true`, requests must include a valid bearer token.

- `CLERK_ISSUER`
  - JWT issuer used for validation.

- `CLERK_JWKS_URL`
  - Optional explicit JWKS URL.
  - If omitted and issuer exists, derived as `<issuer>/.well-known/jwks.json`.

- `CLERK_AUDIENCE`
  - Optional audience claim check.

- `JWKS_CACHE_TTL`
  - JWKS cache lifetime in seconds.

- `AUTO_CREATE_DB`
  - If `true`, backend initializes DB schema on startup.

- `RATE_LIMIT_PER_MINUTE`
  - Analyze request quota per minute (`0` disables).

Reference defaults are in `back-end/.env.example`.

## Data Model

Table: `analyses`

Columns:
- `id` (PK)
- `owner_id` (nullable, indexed)
- `message` (nullable)
- `url` (nullable)
- `tone`
- `persona`
- `score`
- `clarity`
- `emotion`
- `credibility`
- `market_effectiveness`
- `suggestion`
- `insights` (JSON)
- `created_at`

## API Endpoints

### `POST /analyze`

Analyzes message input and persists one record.

Request body:

```json
{
  "message": "Your message",
  "url": "https://example.com",
  "tone": "professional",
  "persona": "expert"
}
```

Rules:
- Either `message` or `url` must be provided.
- Final analyzed text length must be between 10 and 2000 chars.
- `tone` must be one of: `professional`, `casual`, `enthusiastic`.
- `persona` must be one of: `expert`, `friendly`, `authoritative`.

Success response fields:
- `id`, `created_at`, `tone`, `persona`, `message`, `url`
- `score`, `clarity`, `emotion`, `credibility`, `market_effectiveness`
- `suggestion`, `insights`

### `GET /analyses/latest`

Returns latest analysis record in scope.
- If auth is enabled and user is resolved, query is scoped by `owner_id`.
- If no records are found, returns `404`.

### `GET /analyses/{analysis_id}`

Returns one analysis by id.
- When auth is enabled and user is resolved, id lookup is owner-scoped.

### `GET /analyses?limit=20`

Returns recent analyses.
- `limit` is clamped to `1..100`.

### `GET /health`

Returns:

```json
{"status": "healthy", "version": "1.0.0"}
```

## Analysis Pipeline

1. Validate request payload.
2. Resolve input text:
   - direct message, or
   - URL fetch + text extraction.
3. Try Gemini analysis (`run_gemini_analysis`).
4. On failure, fallback to deterministic analyzer (`run_simple_analysis`).
5. Persist analysis row.
6. Return normalized response model.

## URL Fetch and SSRF Controls

The URL ingestion path enforces:
- `http`/`https` schemes only.
- Private, loopback, reserved, link-local, and multicast IP blocking.
- `localhost`/`127.0.0.1`/`0.0.0.0` blocking.
- Redirect limit (`MAX_REDIRECTS`).
- Response byte cap (`MAX_FETCH_BYTES`).
- Minimum extracted content length.

## Authentication Behavior

When `REQUIRE_AUTH=true`:
- Missing bearer token returns `401`.
- Token is validated against JWKS and issuer/audience config.
- Subject claim (`sub`) is treated as `owner_id`.
- List/read endpoints are scoped to owner where user id is resolved.

When `REQUIRE_AUTH=false`:
- Endpoints are publicly accessible.
- Records are not user-scoped.

## Rate Limiting

- Controlled by `RATE_LIMIT_PER_MINUTE`.
- Applied to `/analyze`.
- Key = user id (if authenticated) else client IP.
- Current implementation is in-memory and process-local.

## Database Migrations

Alembic config:
- `alembic.ini`
- `alembic/env.py`
- `alembic/versions/20260206_0001_create_analyses.py`

Run migrations:

```bash
cd back-end
export AUTO_CREATE_DB=false
alembic upgrade head
```

## Testing

Run all backend tests:

```bash
cd back-end
python -m pytest -q
```

Current coverage includes:
- Deterministic scoring behavior (`test_analysis.py`).
- API smoke path for analyze + latest endpoints (`test_api.py`).

## Observability and Logging

- Request middleware injects/echoes `X-Request-ID`.
- Access logs include request id, method, path, and status.
- Analysis pipeline logs include fallback events and score summary.

## Known Constraints

- Fallback analyzer insight count may differ from Gemini target shape.
- In-memory rate limiting is not shared across multiple service instances.
- Frontend currently does not provide token acquisition UI for enforced auth mode.

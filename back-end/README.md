# PitchLens Backend (FastAPI)

FastAPI service for PitchLens analysis, storage, and retrieval.

## Features

- Text and URL analysis endpoint (`/analyze`).
- Optional Gemini-backed scoring with deterministic fallback.
- Persisted analysis records via SQLAlchemy.
- Analysis history endpoints (`/analyses`, `/analyses/latest`, `/analyses/{id}`).
- Optional JWT auth enforcement.
- Basic SSRF protections for URL ingestion.
- Optional per-user/IP rate limiting.

## Tech Stack

- FastAPI
- SQLAlchemy 2
- Alembic
- httpx
- Pydantic v2

## Setup

```bash
cd back-end
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

For local testing tools:

```bash
pip install -r requirements-dev.txt
```

Run server:

```bash
uvicorn app:app --reload --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## Environment Variables

- `GOOGLE_API_KEY`: Optional Gemini API key.
- `GENAI_MODEL`: Optional Gemini model id.
- `DATABASE_URL`: DB URL. Default `sqlite:///./pitchlens.db`.
- `ALLOWED_ORIGINS`: Comma-separated CORS origins.
- `REQUIRE_AUTH`: Require bearer token validation when `true`.
- `CLERK_ISSUER`: JWT issuer.
- `CLERK_JWKS_URL`: Optional JWKS URL override.
- `CLERK_AUDIENCE`: Optional JWT audience.
- `JWKS_CACHE_TTL`: JWKS cache duration seconds.
- `AUTO_CREATE_DB`: Auto-create/migrate minimal schema on startup for local dev.
- `RATE_LIMIT_PER_MINUTE`: Requests/minute for `/analyze` per user or client IP.

Reference values are in `back-end/.env.example`.

## API Endpoints

### `POST /analyze`

Analyzes message input and persists the record.

Request body:

```json
{
  "message": "Your message text",
  "url": "https://example.com",
  "tone": "professional",
  "persona": "expert"
}
```

Rules:
- Either `message` or `url` is required.
- `message/url extracted text` must be between 10 and 2000 chars.

Response shape:

```json
{
  "id": 1,
  "created_at": "2026-02-06T10:15:30Z",
  "tone": "professional",
  "persona": "expert",
  "message": "...",
  "url": null,
  "score": 84,
  "clarity": 92,
  "emotion": 80,
  "credibility": 78,
  "market_effectiveness": 85,
  "suggestion": "Rewritten message",
  "insights": ["...", "...", "..."]
}
```

### `GET /analyses/latest`

Returns latest analysis.

### `GET /analyses/{analysis_id}`

Returns one analysis by id.

### `GET /analyses?limit=20`

Returns latest `limit` analyses (1..100).

### `GET /health`

Returns service health metadata.

## Database and Migrations

Use Alembic for production:

```bash
cd back-end
export AUTO_CREATE_DB=false
alembic upgrade head
```

Migration files:
- `back-end/alembic/env.py`
- `back-end/alembic/versions/`

## Tests

```bash
cd back-end
python -m pytest -q
```

Current tests validate deterministic fallback scoring behavior.
Tests also include API endpoint smoke coverage for `/analyze` and `/analyses/latest`.

## Operational Notes

- If Gemini call fails, fallback analysis is returned.
- URL fetch blocks localhost/private addresses and limits redirects.
- Request IDs are attached via `X-Request-ID` response header.

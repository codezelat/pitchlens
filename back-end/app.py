import asyncio
import ipaddress
import json
import logging
import os
import re
import socket
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Tuple
from urllib.parse import urljoin, urlparse

import anyio
import httpx
from db import get_db, init_db
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from models import Analysis, RateLimitEvent
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

try:
    from google import genai
except Exception:  # pragma: no cover - optional dependency
    genai = None

try:
    from jose import jwt
except Exception:  # pragma: no cover - optional dependency
    jwt = None

load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
GENAI_MODEL = os.getenv("GENAI_MODEL", "models/gemini-2.5-flash")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").strip().lower() in ("1", "true", "yes")
ALLOW_PUBLIC_API_IN_PROD = os.getenv("ALLOW_PUBLIC_API_IN_PROD", "false").strip().lower() in (
    "1",
    "true",
    "yes",
)
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "").strip()
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "").strip()
if not CLERK_JWKS_URL and CLERK_ISSUER:
    CLERK_JWKS_URL = f"{CLERK_ISSUER}/.well-known/jwks.json"
CLERK_AUDIENCE = os.getenv("CLERK_AUDIENCE", "").strip()
JWKS_CACHE_TTL = int(os.getenv("JWKS_CACHE_TTL", "3600"))
AUTO_CREATE_DB = os.getenv("AUTO_CREATE_DB", "true").strip().lower() in ("1", "true", "yes")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "0"))

client = None
if genai and GOOGLE_API_KEY:
    client = genai.Client(api_key=GOOGLE_API_KEY)

GEMINI_SYSTEM_PROMPT = """
You are a production message-intelligence engine.
Return valid JSON only. No markdown. No extra text.

Objective:
- Produce a high-quality, evidence-oriented messaging analysis.
- Avoid shallow wordplay and generic advice.
- Optimize for real market impact and conversion readiness.

Output JSON schema:
{
  "score": int 0-100,
  "clarity": int 0-100,
  "emotion": int 0-100,
  "credibility": int 0-100,
  "market_effectiveness": int 0-100,
  "suggestion": string,
  "insights": [string, string, string],
  "confidence": float 0-1,
  "diagnostics": {
    "target_audience": string,
    "primary_intent": string,
    "core_claims": [string],
    "gaps": [string],
    "risks": [string]
  },
  "rewrite_options": [string, string, string],
  "evidence_needs": [string, string, string]
}

Rules:
- "suggestion" must be a concrete rewritten message, not commentary.
- "insights" must be exactly 3 high-impact, non-overlapping points.
- Each insight must be actionable and specific.
- Focus on conversion quality, clarity, trust, audience fit, and CTA quality.
- If evidence is weak, explicitly call it out through diagnostics/evidence_needs.
"""

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("pitchlens_backend")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if REQUIRE_AUTH and not jwt:
        raise RuntimeError("REQUIRE_AUTH is enabled but python-jose is not installed.")
    if REQUIRE_AUTH and (not CLERK_ISSUER or not CLERK_JWKS_URL):
        raise RuntimeError("REQUIRE_AUTH is enabled but Clerk configuration is missing.")

    if APP_ENV == "production":
        if not REQUIRE_AUTH and not ALLOW_PUBLIC_API_IN_PROD:
            raise RuntimeError(
                "Production requires REQUIRE_AUTH=true (or ALLOW_PUBLIC_API_IN_PROD=true override)."
            )
        if RATE_LIMIT_PER_MINUTE <= 0:
            raise RuntimeError("Production requires RATE_LIMIT_PER_MINUTE > 0.")
        if not GOOGLE_API_KEY:
            raise RuntimeError("Production requires GOOGLE_API_KEY for high-quality AI analysis.")

    if AUTO_CREATE_DB:
        init_db()
    yield


app = FastAPI(
    title="PitchLens Analysis API",
    version="1.1.0",
    description="Backend service for analyzing pitch messages.",
    lifespan=lifespan,
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_id=%s method=%s path=%s status=%s",
        request_id,
        request.method,
        request.url.path,
        response.status_code,
    )
    return response


allowed_origins = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]
if not origins:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)
_jwks_cache: Dict[str, Any] = {"keys": None, "fetched_at": 0.0}
_rate_limit_cache: Dict[str, List[int]] = {}


class AnalyzeRequest(BaseModel):
    message: Optional[str] = None
    url: Optional[str] = None
    tone: Literal["professional", "casual", "enthusiastic"] = "professional"
    persona: Literal["expert", "friendly", "authoritative"] = "expert"


class AnalyzeResponse(BaseModel):
    score: int
    clarity: int
    emotion: int
    credibility: int
    market_effectiveness: int
    suggestion: str
    insights: List[str]


class AnalysisRecordResponse(AnalyzeResponse):
    id: int
    created_at: datetime
    tone: str
    persona: str
    message: Optional[str] = None
    url: Optional[str] = None
    analysis_meta: Optional[Dict[str, Any]] = None


MAX_FETCH_BYTES = 600_000
FETCH_TIMEOUT = 10.0
MAX_REDIRECTS = 3
MAX_INSIGHT_CHARS = 220
MAX_SUGGESTION_CHARS = 2000
ALLOWED_WEB_PORTS = {80, 443}


def _coerce_score(value: Any, default: int = 0) -> int:
    try:
        return max(0, min(100, int(round(float(value)))))
    except Exception:
        return default


def _sanitize_text(value: Any, fallback: str = "") -> str:
    if not isinstance(value, str):
        return fallback
    text = re.sub(r"\s+", " ", value).strip()
    return text


def _extract_json(text: str) -> dict:
    text = (text or "").strip()
    if not text:
        raise ValueError("Gemini returned empty output.")

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except Exception:
        pass

    starts = [idx for idx, char in enumerate(text) if char == "{"]
    for start in starts:
        depth = 0
        in_string = False
        escaped = False
        for idx in range(start, len(text)):
            char = text[idx]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
                continue
            if char == '"':
                in_string = True
                continue
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[start : idx + 1]
                    try:
                        parsed = json.loads(candidate)
                        if isinstance(parsed, dict):
                            return parsed
                    except Exception:
                        break
    raise ValueError("No valid JSON object found in Gemini output.")


def _contains_cta(text: str) -> bool:
    patterns = (
        "book a demo",
        "schedule",
        "let's talk",
        "contact us",
        "sign up",
        "get started",
        "start now",
        "reply",
        "apply now",
        "learn more",
    )
    lowered = text.lower()
    return any(phrase in lowered for phrase in patterns)


def _generate_structured_suggestion(
    message: str,
    has_numbers: bool,
    has_cta: bool,
    emotional_hits: int,
) -> str:
    cleaned = _sanitize_text(message)
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", cleaned) if s.strip()]
    lead = sentences[0] if sentences else cleaned
    lead = re.sub(r"[.!?]+$", "", lead).strip()

    if len(lead) > 180:
        lead = lead[:177].rstrip() + "..."

    evidence_line = (
        "Backed by measurable outcomes and clear proof points."
        if has_numbers
        else "Backed by measurable outcomes, including a concrete metric and timeframe."
    )
    emotion_line = (
        "The outcome is meaningful for teams that need faster, more reliable results."
        if emotional_hits < 1
        else "The outcome is meaningful and immediately relevant to decision-makers."
    )
    cta_line = (
        "Would you be open to a 15-minute call this week to evaluate fit?"
        if not has_cta
        else "If this aligns with your goals, take the next step today."
    )

    suggestion = f"{lead}. {evidence_line} {emotion_line} {cta_line}"
    suggestion = _sanitize_text(suggestion, fallback=cleaned)
    return suggestion[:MAX_SUGGESTION_CHARS]


def _normalize_insights(raw_insights: Any, fallback_candidates: List[str]) -> List[str]:
    cleaned: List[str] = []
    seen = set()

    if isinstance(raw_insights, list):
        for item in raw_insights:
            text = _sanitize_text(item)
            if not text:
                continue
            text = text[:MAX_INSIGHT_CHARS]
            lowered = text.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            cleaned.append(text)

    for candidate in fallback_candidates:
        if len(cleaned) >= 3:
            break
        text = _sanitize_text(candidate)[:MAX_INSIGHT_CHARS]
        if not text:
            continue
        lowered = text.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        cleaned.append(text)

    if not cleaned:
        cleaned = [
            "State your primary value proposition in one sentence with a measurable outcome.",
            "Support your main claim with concrete data (result + timeframe + sample size).",
            "End with a specific CTA so the audience knows exactly what to do next.",
        ]

    return cleaned[:3]


def _normalize_meta_field(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    normalized: List[str] = []
    for item in value:
        text = _sanitize_text(item)
        if text:
            normalized.append(text)
    return normalized[:5]


def _normalize_analysis_output(
    payload: Dict[str, Any],
    message: str,
    tone: str,
    persona: str,
    source: str,
    fallback_candidates: List[str],
) -> Tuple[AnalyzeResponse, Dict[str, Any]]:
    has_numbers = any(char.isdigit() for char in message)
    has_cta = _contains_cta(message)
    emotional_hits = sum(
        1
        for word in (
            "exciting",
            "amazing",
            "love",
            "delighted",
            "great",
            "success",
            "powerful",
            "win",
            "thrilled",
            "fantastic",
            "wonderful",
        )
        if word in message.lower()
    )

    suggestion = _sanitize_text(payload.get("suggestion"))
    if not suggestion:
        suggestion = _generate_structured_suggestion(message, has_numbers, has_cta, emotional_hits)
    suggestion = suggestion[:MAX_SUGGESTION_CHARS]

    insights = _normalize_insights(payload.get("insights"), fallback_candidates)

    response = AnalyzeResponse(
        score=_coerce_score(payload.get("score"), default=50),
        clarity=_coerce_score(payload.get("clarity"), default=50),
        emotion=_coerce_score(payload.get("emotion"), default=50),
        credibility=_coerce_score(payload.get("credibility"), default=50),
        market_effectiveness=_coerce_score(payload.get("market_effectiveness"), default=50),
        suggestion=suggestion,
        insights=insights,
    )

    confidence_raw = payload.get("confidence", 0.7 if source == "gemini" else 0.45)
    try:
        confidence = float(confidence_raw)
    except Exception:
        confidence = 0.7 if source == "gemini" else 0.45
    confidence = max(0.0, min(1.0, confidence))

    diagnostics = payload.get("diagnostics")
    if not isinstance(diagnostics, dict):
        diagnostics = {}

    meta: Dict[str, Any] = {
        "source": source,
        "model": GENAI_MODEL if source == "gemini" else "deterministic-v2",
        "confidence": confidence,
        "tone": tone,
        "persona": persona,
        "diagnostics": {
            "target_audience": _sanitize_text(diagnostics.get("target_audience"), "Not specified"),
            "primary_intent": _sanitize_text(diagnostics.get("primary_intent"), "Not specified"),
            "core_claims": _normalize_meta_field(diagnostics.get("core_claims")),
            "gaps": _normalize_meta_field(diagnostics.get("gaps")),
            "risks": _normalize_meta_field(diagnostics.get("risks")),
        },
        "rewrite_options": _normalize_insights(
            payload.get("rewrite_options"),
            [response.suggestion],
        ),
        "evidence_needs": _normalize_insights(
            payload.get("evidence_needs"),
            [
                "Add one quantified result with timeframe and baseline.",
                "Support your core claim with a real customer case or benchmark.",
                "State the exact next step and expected business outcome.",
            ],
        ),
    }

    return response, meta


async def _resolve_host_ips(hostname: str) -> List[ipaddress._BaseAddress]:
    try:
        loop = asyncio.get_running_loop()
        infos = await loop.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror:
        return []

    addresses: List[ipaddress._BaseAddress] = []
    for info in infos:
        try:
            addresses.append(ipaddress.ip_address(info[4][0]))
        except Exception:
            continue
    return addresses


def _is_disallowed_ip(address: ipaddress._BaseAddress) -> bool:
    return bool(
        address.is_private
        or address.is_loopback
        or address.is_link_local
        or address.is_reserved
        or address.is_multicast
    )


async def _assert_safe_fetch_target(parsed_url) -> None:
    if parsed_url.scheme not in ("http", "https"):
        raise ValueError("Invalid URL scheme. Only http and https are allowed.")

    if APP_ENV == "production" and parsed_url.scheme != "https":
        raise ValueError("Only https URLs are allowed in production mode.")

    if parsed_url.username or parsed_url.password:
        raise ValueError("URLs with embedded credentials are not allowed.")

    if parsed_url.port and parsed_url.port not in ALLOWED_WEB_PORTS:
        raise ValueError("Only standard web ports (80/443) are allowed.")

    hostname = parsed_url.hostname or ""
    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
        raise ValueError("Fetching from localhost addresses is not allowed.")

    resolved_ips = await _resolve_host_ips(hostname)
    if not resolved_ips:
        raise ValueError("Unable to resolve URL host.")
    if any(_is_disallowed_ip(ip) for ip in resolved_ips):
        raise ValueError("Fetching from private or restricted network addresses is not allowed.")


def _basic_html_to_text(html: str) -> str:
    html = re.sub(r"(?is)<script.*?>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?>.*?</style>", " ", html)
    text = re.sub(r"(?is)<.*?>", " ", html)
    return re.sub(r"\s+", " ", text).strip()


async def _read_limited_body(response: httpx.Response, max_bytes: int) -> bytes:
    total = 0
    chunks: List[bytes] = []
    async for chunk in response.aiter_bytes():
        total += len(chunk)
        if total > max_bytes:
            raise ValueError("Fetched content exceeded size limit.")
        chunks.append(chunk)
    return b"".join(chunks)


async def fetch_text_from_url(url: str) -> str:
    current_url = url
    async with httpx.AsyncClient(
        timeout=FETCH_TIMEOUT,
        follow_redirects=False,
        trust_env=False,
    ) as http_client:
        for _ in range(MAX_REDIRECTS + 1):
            parsed = urlparse(current_url)
            await _assert_safe_fetch_target(parsed)

            logger.info("Fetching content from URL: %s", current_url)
            async with http_client.stream(
                "GET",
                current_url,
                headers={"User-Agent": "PitchLensBot/1.1"},
            ) as response:
                if 300 <= response.status_code < 400 and response.headers.get("Location"):
                    next_url = urljoin(current_url, response.headers["Location"])
                    current_url = next_url
                    continue

                response.raise_for_status()

                content_length = response.headers.get("Content-Length")
                if content_length:
                    try:
                        if int(content_length) > MAX_FETCH_BYTES:
                            raise ValueError("Fetched content exceeded size limit.")
                    except ValueError:
                        raise
                    except Exception:
                        pass

                raw = await _read_limited_body(response, MAX_FETCH_BYTES)
                content_type = response.headers.get("Content-Type", "").lower()
                encoding = response.charset_encoding or "utf-8"
                text = raw.decode(encoding, errors="replace")

            if "text/html" in content_type:
                extracted = _basic_html_to_text(text)
            else:
                extracted = re.sub(r"\s+", " ", text).strip()

            if len(extracted) < 50:
                raise ValueError("Fetched content is too short to analyze.")
            return extracted

    raise ValueError("Too many redirects.")


def _fallback_candidates_from_text(text: str) -> List[str]:
    return [
        "Lead with one clear value proposition tied to a concrete audience pain point.",
        "Quantify impact using at least one metric, timeframe, and baseline.",
        "Close with a direct CTA that defines the exact next action.",
        "Remove vague language and replace it with specific outcomes and proof.",
        "Prioritize one primary message to avoid cognitive overload.",
        f"Keep the message focused, concise, and outcome-driven: {text[:120]}",
    ]


def _gemini_request(message: str, tone: str, persona: str):
    if not client:
        raise RuntimeError("Gemini client not configured. Check GOOGLE_API_KEY.")

    prompt = f"""
{GEMINI_SYSTEM_PROMPT}

Tone: {tone}
Persona: {persona}

Message to analyze:
{message}
"""
    return client.models.generate_content(model=GENAI_MODEL, contents=prompt)


async def run_gemini_analysis(
    message: str,
    tone: str,
    persona: str,
) -> Tuple[AnalyzeResponse, Dict[str, Any]]:
    logger.info("Calling Gemini for analysis...")
    response = await anyio.to_thread.run_sync(_gemini_request, message, tone, persona)
    raw_text = response.text or ""
    data = _extract_json(raw_text)
    logger.info("Gemini analysis successful")

    fallback_candidates = _fallback_candidates_from_text(message)
    return _normalize_analysis_output(
        data,
        message=message,
        tone=tone,
        persona=persona,
        source="gemini",
        fallback_candidates=fallback_candidates,
    )


def run_simple_analysis_with_meta(
    message: str,
    tone: str,
    persona: str,
) -> Tuple[AnalyzeResponse, Dict[str, Any]]:
    text = _sanitize_text(message)
    lower_text = text.lower()
    length = len(text)

    if length < 40:
        clarity = 50
    elif length < 120:
        clarity = 75
    elif length <= 300:
        clarity = 90
    else:
        clarity = 80

    sentence_count = text.count(".") + text.count("!") + text.count("?")
    if sentence_count >= 2:
        clarity += 5
    clarity = max(0, min(100, clarity))

    positive_words = [
        "exciting",
        "amazing",
        "love",
        "delighted",
        "great",
        "success",
        "powerful",
        "win",
        "thrilled",
        "fantastic",
        "wonderful",
    ]
    emotional_hits = sum(1 for word in positive_words if word in lower_text)

    if emotional_hits == 0:
        emotion = 55
    elif emotional_hits == 1:
        emotion = 70
    elif emotional_hits == 2:
        emotion = 80
    else:
        emotion = 90

    if tone == "professional":
        emotion -= 5
    elif tone == "enthusiastic":
        emotion += 5
    emotion = max(0, min(100, emotion))

    credibility_words = ["data", "research", "proven", "studies", "statistics", "evidence", "results", "facts"]
    credibility_hits = sum(1 for word in credibility_words if word in lower_text)
    has_numbers = any(char.isdigit() for char in text)
    has_cta = _contains_cta(text)

    credibility = 50
    if has_numbers:
        credibility += 15
    if credibility_hits == 1:
        credibility += 10
    elif credibility_hits >= 2:
        credibility += 20
    if persona == "authoritative":
        credibility += 5
    credibility = max(0, min(100, credibility))

    market_effectiveness = int((clarity * 0.35) + (emotion * 0.25) + (credibility * 0.30) + (0.10 * 80))
    market_effectiveness = max(0, min(100, market_effectiveness))
    score = market_effectiveness

    severity_insights: List[Tuple[int, str]] = []
    if clarity < 60:
        severity_insights.append((95, "Clarity is too low. Lead with one clear value proposition before adding details."))
    elif length > 300:
        severity_insights.append((80, "The message is too long. Remove non-essential phrases and keep one primary narrative."))
    if not has_numbers:
        severity_insights.append((92, "Credibility is limited. Add one measurable result with timeframe and baseline."))
    if credibility_hits == 0:
        severity_insights.append((85, "Trust signals are weak. Reference evidence, research, or customer results explicitly."))
    if emotional_hits == 0:
        severity_insights.append((72, "Emotional resonance is weak. Add language that makes the outcome feel urgent and relevant."))
    if not has_cta:
        severity_insights.append((88, "No clear call-to-action. End with a concrete next step (meeting, trial, reply, or signup)."))
    if sentence_count <= 1:
        severity_insights.append((65, "Structure can improve. Break the message into benefit, proof, and action."))

    severity_insights.sort(key=lambda item: item[0], reverse=True)
    fallback_candidates = [item[1] for item in severity_insights] + _fallback_candidates_from_text(text)
    insights = _normalize_insights([], fallback_candidates)

    suggestion = _generate_structured_suggestion(
        message=text,
        has_numbers=has_numbers,
        has_cta=has_cta,
        emotional_hits=emotional_hits,
    )

    result = AnalyzeResponse(
        score=score,
        clarity=int(clarity),
        emotion=int(emotion),
        credibility=int(credibility),
        market_effectiveness=int(market_effectiveness),
        suggestion=suggestion,
        insights=insights,
    )

    meta: Dict[str, Any] = {
        "source": "fallback",
        "model": "deterministic-v2",
        "confidence": 0.45,
        "tone": tone,
        "persona": persona,
        "diagnostics": {
            "target_audience": "General business audience",
            "primary_intent": "Persuade and drive action",
            "core_claims": _normalize_meta_field([text[:180]]),
            "gaps": _normalize_meta_field(
                [
                    "Insufficient quantified proof" if not has_numbers else "",
                    "Missing explicit CTA" if not has_cta else "",
                    "Emotional resonance is limited" if emotional_hits == 0 else "",
                ]
            ),
            "risks": _normalize_meta_field(
                [
                    "Message may be perceived as generic without evidence."
                    if not has_numbers
                    else "Evidence may still need stronger context."
                ]
            ),
        },
        "rewrite_options": _normalize_insights(
            [
                suggestion,
                "Outcome-first variant: Start with measurable impact, then explain why it matters now.",
                "Trust-first variant: Open with evidence and customer result before the core pitch.",
            ],
            [suggestion],
        ),
        "evidence_needs": _normalize_insights(
            [
                "Add one concrete metric with baseline and timeframe.",
                "Mention source of proof (case study, benchmark, or internal data).",
                "Define the exact next step and expected business value.",
            ],
            [],
        ),
    }
    return result, meta


def run_simple_analysis(message: str, tone: str, persona: str) -> AnalyzeResponse:
    result, _ = run_simple_analysis_with_meta(message, tone, persona)
    return result


async def _get_jwks() -> dict:
    if not CLERK_JWKS_URL:
        raise RuntimeError("CLERK_JWKS_URL not configured.")

    now = time.time()
    cached = _jwks_cache.get("keys")
    fetched_at = _jwks_cache.get("fetched_at", 0.0)
    if cached and (now - fetched_at < JWKS_CACHE_TTL):
        return cached

    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as http_client:
        res = await http_client.get(CLERK_JWKS_URL)
        res.raise_for_status()
        jwks = res.json()

    _jwks_cache["keys"] = jwks
    _jwks_cache["fetched_at"] = now
    return jwks


async def _verify_token(token: str) -> str:
    if not jwt:
        raise RuntimeError("Auth verification dependency is unavailable.")

    jwks = await _get_jwks()
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid token header.")

    keys = jwks.get("keys", [])
    key = next((k for k in keys if k.get("kid") == kid), None)
    if not key:
        _jwks_cache["keys"] = None
        jwks = await _get_jwks()
        keys = jwks.get("keys", [])
        key = next((k for k in keys if k.get("kid") == kid), None)
        if not key:
            raise HTTPException(status_code=401, detail="Unable to verify token.")

    options = {
        "verify_aud": bool(CLERK_AUDIENCE),
        "verify_iss": bool(CLERK_ISSUER),
    }
    payload = jwt.decode(
        token,
        key,
        algorithms=[headers.get("alg", "RS256")],
        issuer=CLERK_ISSUER or None,
        audience=CLERK_AUDIENCE or None,
        options=options,
    )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject.")
    return user_id


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[str]:
    if credentials is None:
        if REQUIRE_AUTH:
            raise HTTPException(status_code=401, detail="Authentication required.")
        return None
    try:
        return await _verify_token(credentials.credentials)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")


def _enforce_rate_limit(db: Session, key: str) -> None:
    if RATE_LIMIT_PER_MINUTE <= 0:
        return

    now = int(time.time())
    window_start = now - 60
    cleanup_before = now - 3600

    try:
        db.query(RateLimitEvent).filter(RateLimitEvent.ts_epoch < cleanup_before).delete(
            synchronize_session=False
        )
        request_count = (
            db.query(func.count(RateLimitEvent.id))
            .filter(RateLimitEvent.key == key, RateLimitEvent.ts_epoch >= window_start)
            .scalar()
            or 0
        )
        if request_count >= RATE_LIMIT_PER_MINUTE:
            db.rollback()
            raise HTTPException(status_code=429, detail="Rate limit exceeded.")
        db.add(RateLimitEvent(key=key, ts_epoch=now))
        db.commit()
        return
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("DB rate limit unavailable (%s). Falling back to in-memory limiter.", exc)
        db.rollback()

    bucket = _rate_limit_cache.get(key, [])
    bucket = [timestamp for timestamp in bucket if timestamp >= window_start]
    if len(bucket) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    bucket.append(now)
    _rate_limit_cache[key] = bucket


def _analysis_to_response(analysis: Analysis) -> AnalysisRecordResponse:
    return AnalysisRecordResponse(
        id=analysis.id,
        created_at=analysis.created_at,
        tone=analysis.tone,
        persona=analysis.persona,
        message=analysis.message,
        url=analysis.url,
        score=analysis.score,
        clarity=analysis.clarity,
        emotion=analysis.emotion,
        credibility=analysis.credibility,
        market_effectiveness=analysis.market_effectiveness,
        suggestion=analysis.suggestion,
        insights=analysis.insights,
        analysis_meta=analysis.analysis_meta,
    )


@app.post("/analyze", response_model=AnalysisRecordResponse)
async def analyze_message(
    request: AnalyzeRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    if RATE_LIMIT_PER_MINUTE > 0:
        key = user_id or (http_request.client.host if http_request.client else "anonymous")
        _enforce_rate_limit(db, key)

    logger.info(
        "Analyze request received | tone=%s persona=%s has_message=%s has_url=%s",
        request.tone,
        request.persona,
        bool(request.message),
        bool(request.url),
    )

    message = (request.message or "").strip()
    url = (request.url or "").strip()

    if not message and not url:
        raise HTTPException(status_code=400, detail="Either message or url must be provided.")

    source_text = ""
    if url:
        try:
            source_text = await fetch_text_from_url(url)
        except Exception as exc:
            if not message:
                raise HTTPException(status_code=400, detail=f"Failed to fetch content from URL: {exc}")
            logger.warning("URL fetch failed; proceeding with direct message input: %s", exc)

    if message and source_text:
        text = f"{message}\n\nSupporting context:\n{source_text[:1200]}"
    elif message:
        text = message
    else:
        text = source_text

    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Message must be at least 10 characters long.")
    if len(text) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Message is too long. Please keep it under 2000 characters.",
        )

    try:
        result, analysis_meta = await run_gemini_analysis(text, request.tone, request.persona)
    except Exception as exc:
        logger.warning("Gemini failed, falling back to deterministic analysis: %s", exc)
        result, analysis_meta = run_simple_analysis_with_meta(text, request.tone, request.persona)
        analysis_meta["fallback_reason"] = str(exc)

    logger.info(
        "Analysis completed | score=%d clarity=%d emotion=%d credibility=%d market_effectiveness=%d source=%s",
        result.score,
        result.clarity,
        result.emotion,
        result.credibility,
        result.market_effectiveness,
        analysis_meta.get("source"),
    )

    analysis = Analysis(
        owner_id=user_id,
        message=message if message else None,
        url=url if url else None,
        tone=request.tone,
        persona=request.persona,
        score=result.score,
        clarity=result.clarity,
        emotion=result.emotion,
        credibility=result.credibility,
        market_effectiveness=result.market_effectiveness,
        suggestion=result.suggestion,
        insights=result.insights,
        analysis_meta=analysis_meta,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    return _analysis_to_response(analysis)


@app.get("/analyses/latest", response_model=AnalysisRecordResponse)
async def get_latest_analysis(
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    query = db.query(Analysis)
    if user_id:
        query = query.filter(Analysis.owner_id == user_id)
    analysis = query.order_by(Analysis.created_at.desc()).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="No analyses found.")
    return _analysis_to_response(analysis)


@app.get("/analyses/{analysis_id}", response_model=AnalysisRecordResponse)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    query = db.query(Analysis).filter(Analysis.id == analysis_id)
    if user_id:
        query = query.filter(Analysis.owner_id == user_id)
    analysis = query.first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return _analysis_to_response(analysis)


@app.get("/analyses", response_model=List[AnalysisRecordResponse])
async def list_analyses(
    limit: int = 20,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    safe_limit = max(1, min(limit, 100))
    query = db.query(Analysis)
    if user_id:
        query = query.filter(Analysis.owner_id == user_id)
    analyses = query.order_by(Analysis.created_at.desc()).limit(safe_limit).all()
    return [_analysis_to_response(item) for item in analyses]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.1.0", "env": APP_ENV}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

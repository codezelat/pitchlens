import logging
import os
import re
import json
import time
import ipaddress
import socket
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
import httpx    

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Dict, List, Literal, Optional
from urllib.parse import urlparse, urljoin   
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

try:
    from google import genai
except Exception:  # pragma: no cover - optional dependency
    genai = None

from sqlalchemy.orm import Session
try:
    from jose import jwt
except Exception:  # pragma: no cover - optional dependency
    jwt = None

from db import get_db, init_db
from models import Analysis

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "").strip()
GENAI_MODEL = os.getenv("GENAI_MODEL", "models/gemini-2.5-flash")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").strip().lower() in ("1", "true", "yes")
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
You are an API that MUST return valid JSON only.
No markdown. No code fences. No extra text.
Return a single JSON object with this exact schema:

{
  "score": int (0-100),
  "clarity": int (0-100),
  "emotion": int (0-100),
  "credibility": int (0-100),
  "market_effectiveness": int (0-100),
  "suggestion": string,
  "insights": [string, string, string]
}

Rules:
- Always include exactly 3 insights.
- suggestion must be a rewritten/optimized version of the user's message (not just feedback).
"""

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

logger = logging.getLogger("pitchlens_backend")

# Initialize FastAPI app
@asynccontextmanager
async def lifespan(_: FastAPI):
    if REQUIRE_AUTH and not jwt:
        raise RuntimeError("REQUIRE_AUTH is enabled but python-jose is not installed.")
    if REQUIRE_AUTH and (not CLERK_ISSUER or not CLERK_JWKS_URL):
        raise RuntimeError("REQUIRE_AUTH is enabled but Clerk configuration is missing.")
    if AUTO_CREATE_DB:
        init_db()
    yield


app = FastAPI(
    title="PitchLens Analysis API",
    version="1.0.0",
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
_jwks_cache = {"keys": None, "fetched_at": 0.0}


def _get_jwks() -> dict:
    if not CLERK_JWKS_URL:
        raise RuntimeError("CLERK_JWKS_URL not configured.")

    now = time.time()
    if _jwks_cache["keys"] and (now - _jwks_cache["fetched_at"] < JWKS_CACHE_TTL):
        return _jwks_cache["keys"]

    with httpx.Client(timeout=10.0) as http_client:
        res = http_client.get(CLERK_JWKS_URL)
        res.raise_for_status()
        jwks = res.json()

    _jwks_cache["keys"] = jwks
    _jwks_cache["fetched_at"] = now
    return jwks


def _verify_token(token: str) -> str:
    if not jwt:
        raise RuntimeError("Auth verification dependency is unavailable.")
    jwks = _get_jwks()
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid token header.")

    keys = jwks.get("keys", [])
    key = next((k for k in keys if k.get("kid") == kid), None)
    if not key:
        _jwks_cache["keys"] = None
        jwks = _get_jwks()
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


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[str]:
    if credentials is None:
        if REQUIRE_AUTH:
            raise HTTPException(status_code=401, detail="Authentication required.")
        return None
    try:
        return _verify_token(credentials.credentials)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")


_rate_limit_cache: Dict[str, List[float]] = {}


def _enforce_rate_limit(key: str) -> None:
    if RATE_LIMIT_PER_MINUTE <= 0:
        return
    now = time.time()
    window_start = now - 60
    bucket = _rate_limit_cache.get(key, [])
    bucket = [timestamp for timestamp in bucket if timestamp >= window_start]
    if len(bucket) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Rate limit exceeded.")
    bucket.append(now)
    _rate_limit_cache[key] = bucket

# Pydantic models for request and response
class AnalyzeRequest(BaseModel):
    # No min_length / max_length here → we control validation ourselves
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
    
# Url content fetching utility

MAX_FETCH_BYTES = 600_000  
FETCH_TIMEOUT = 10.0
MAX_REDIRECTS = 3


def _is_private_host(hostname: str) -> bool:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return True

    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
        ):
            return True
    return False

def _basic_html_to_text(html: str) -> str:
    html =re.sub(r"(?is)<script.*?>.*?</script>", " ", html)
    html =re.sub(r"(?is)<style.*?>.*?</style>", " ", html)
    text = re.sub(r"(?is)<.*?>", " ", html)
    return re.sub(r"\s+", " ", text).strip()

def fetch_text_from_url(url: str) -> str:
    current_url = url
    for _ in range(MAX_REDIRECTS + 1):
        parsed = urlparse(current_url)
        if parsed.scheme not in ("http", "https"):
            raise ValueError("Invalid URL scheme. Only http and https are allowed.")

        hostname = parsed.hostname or ""
        if hostname in ("localhost", "127.0.0.1", "0.0.0.0") or _is_private_host(hostname):
            raise ValueError("Fetching from private or localhost addresses is not allowed.")

        logger.info("Fetching content from URL: %s", current_url)

        with httpx.Client(timeout=FETCH_TIMEOUT, follow_redirects=False) as http_client:
            r = http_client.get(current_url, headers={"User-Agent": "PitchLensBot/1.0"})

        if 300 <= r.status_code < 400 and r.headers.get("Location"):
            next_url = urljoin(current_url, r.headers["Location"])
            current_url = next_url
            continue

        r.raise_for_status()

        content_type = r.headers.get("Content-Type", "").lower()
        raw = r.content[:MAX_FETCH_BYTES]
        text = raw.decode(r.encoding or "utf-8", errors="replace")

        if "text/html" in content_type:
            extracted = _basic_html_to_text(text)
        else:
            extracted = re.sub(r"\s+", " ", text).strip()

        if len(extracted) < 50:
            raise ValueError("Fetched content is too short to analyze.")

        return extracted

    raise ValueError("Too many redirects.")
    
def _extract_json(text: str) -> dict:
    """
    Safely extract JSON from Gemini output.
    Handles both clean JSON and extra text edge cases.
    """
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No valid JSON object found in Gemini output")

    return json.loads(match.group(0))

def run_gemini_analysis(message: str, tone: str, persona: str) -> AnalyzeResponse:
    logger.info("Calling Gemini for analysis...")

    if not client:
        raise RuntimeError("Gemini client not configured. Check GOOGLE_API_KEY.")

    prompt = f"""
{GEMINI_SYSTEM_PROMPT}

Tone: {tone}
Persona: {persona}

Message:
{message}
"""

    response = client.models.generate_content(
        model=GENAI_MODEL,
        contents=prompt
    )

    raw_text = response.text or ""
    
    logger.info("Raw Gemini response received")
    
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        raise ValueError("No valid JSON object found in Gemini output")
    
    data = json.loads(match.group())
    return AnalyzeResponse(**data)
   
def run_simple_analysis(message: str, tone: str, persona: str) -> AnalyzeResponse:
    """
    improved mock analysis logic for demonstration purposes.
    """
    text = message.strip()
    lower_text = text.lower()
    
    # 1. clarity score based on length
    length = len(text)
    
    # base clarity from length
    if length < 40:
        clarity = 50
    elif length < 120:
        clarity = 75
    elif length <= 300:
        clarity = 90
    else:
        clarity = 80 # too long can hurt clarity
        
    # for having multiple sentences
    sentence_count = text.count('.') + text.count('!') + text.count('?')
    if sentence_count >= 2:
        clarity += 5
        
    clarity = max(0, min(100, clarity))
    
    # 2. Emotion
    positive_words = ["exciting", "amazing", "love", "delighted","great", "success", "powerful", "win", "thrilled", "fantastic", "wonderful"]
    emotional_hits = sum(1 for word in positive_words if word in lower_text)
    
    if emotional_hits == 0:
        emotion = 55
    elif emotional_hits == 1:
        emotion = 70
    elif emotional_hits == 2:
        emotion = 80
    else:
        emotion = 90 #very emotional
        
    # tone based adjustment
    if tone == "professional":
        emotion -= 5
    elif tone == "enthusiastic":
        emotion += 5
        
    emotion = max(0, min(100, emotion))
    
    # 3. Credibility
    credibility_words = ["data", "research", "proven", "studies", "statistics", "evidence", "results", "facts"]
    credibility_hits = sum(1 for word in credibility_words if word in lower_text)
    
    #number / percentages look credible
    has_numbers = any(char.isdigit() for char in text)
    
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
    
    # 4. Market Effectiveness
    # weighted average
    market_effectiveness = int((clarity * 0.35) + (emotion * 0.25) + (credibility * 0.30) + ( 0.10 * 80 )) # base effectiveness
    market_effectiveness = max(0, min(100, market_effectiveness))
    score = market_effectiveness
    
    # 5. Suggestions and insights
    suggestion = f"Improved version: {text} (with enhanced clarity and impact)"
    insights: List[str] = []
    
    if clarity < 60:
        insights.append("Your message is quite short. Consider adding more details to improve clarity.")
    elif length > 300:
        insights.append("Your message is quite long. Consider shortening it to improve clarity.")
    
    if emotional_hits == 0:
        insights.append("Incorporate more emotional language to better connect with your audience.")
    elif emotional_hits < 2:
        insights.append("Consider adding more positive and emotional words to enhance engagement.") 
        
    if not has_numbers:
        insights.append("Adding specific metrics or data can boost your message's credibility.")    
    if credibility_hits == 0:
        insights.append("Including references to research or evidence can enhance credibility.")    
        
    insights.append("Consider adding a clear call-to-action to guide your audience.")
    
    # fallback if no insights
    if not insights:
        insights = ["Your message is well-balanced! Consider minor tweaks to further enhance its impact."]
        
    return AnalyzeResponse(
        score=score,
        clarity=int(clarity),
        emotion=int(emotion),
        credibility=int(credibility),
        market_effectiveness=int(market_effectiveness),
        suggestion=suggestion,
        insights=insights,
    )


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
        _enforce_rate_limit(key)
    # Log the incoming request
    logger.info("Analyze request received | tone=%s persona=%s has_message=%s has_url=%s",
                request.tone, request.persona,bool(request.message), bool(request.url))
    
    # Custom Validation
    # 1.Empty check
    
    message = (request.message or "").strip()
    url = (request.url or "").strip()
    
    if message:
        text = message
    elif url:
        try:
            text = fetch_text_from_url(url)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch content from URL: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Either message or url must be provided.")
    
    # 2.Length checks
    if len(text) < 10:
        logger.warning("Validation failed: Message too short", extra={"length": len(text)})
        raise HTTPException(status_code=400, detail="Message must be at least 10 characters long.")
    
    if len(text) > 2000:
        logger.warning("Validation failed: Message too long", extra={"length": len(text)})
        raise HTTPException( status_code=400, detail="Message is too long. Please keep it under 2000 characters.")  
    
    # 3. Run Gemini analysis with fallback
    try:
        result = run_gemini_analysis(
            text,
            request.tone,
            request.persona
        )
        logger.info("Gemini analysis successful")   
        
    except Exception as e:
        logger.warning(
            "Gemini failed, falling back to simple analysis: %s", str(e)
        )
        result = run_simple_analysis(
            text,
            request.tone,
            request.persona
        )
    
    logger.info("Analysis completed | Score: %d, clarity= %d, emotion= %d, credibility= %d, market_effectiveness= %d",
                result.score, result.clarity, result.emotion, result.credibility, result.market_effectiveness)

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
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

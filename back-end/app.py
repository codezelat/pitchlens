import logging
import os
import re
import json

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Literal
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
from google import genai

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("Missing GOOGLE_API_KEY in environment")

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

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

logger = logging.getLogger("pitchlens_backend")


app = FastAPI(
    title="PitchLens Analysis API",
    version="1.0.0",
    description="Backend service for analyzing pitch messages."
)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    # No min_length / max_length here → we control validation ourselves
    message: str 
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

    prompt = f"""
{GEMINI_SYSTEM_PROMPT}

Tone: {tone}
Persona: {persona}

Message:
{message}
"""

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt
    )

    raw_text = response.text
    logger.info("Raw Gemini response received")

    if not raw_text:
        logger.error("Empty response from Gemini")
        raise ValueError("Empty response from Gemini")
    try:
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            raise ValueError("No valid JSON object found in Gemini output")
        json_str = match.group()
        data = json.loads(json_str)
        
    except Exception as e:
        logger.error("Failed to parse Gemini JSON: %s", raw_text)
        raise ValueError("Invalid Gemini JSON response") from e
    
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

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_message(request: AnalyzeRequest):
    # Log the incoming request
    logger.info(f"Received analysis request: tone={request.tone}, persona={request.persona}, message_length={len(request.message or " ")}")
    # Custom Validation
    # 1.Empty check
    if not request.message or request.message.strip() == "":
        logger.warning("Validation failed: Empty or whitespace-only message received")
        raise HTTPException(status_code=400, detail="Message cannot be empty or whitespace.")
    text = request.message.strip()
    
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
                
    return result

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
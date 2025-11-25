from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Literal
from fastapi.middleware.cors import CORSMiddleware


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
    
def run_simple_analysis(message: str, tone: str, persona: str) -> AnalyzeResponse:
    """
    Simple mock scoring based on message length and keywords.
    Later this can be replaced with real AI/NLP logic.
    """
    text = message.strip()

    # Basic scoring rules
    clarity = min(100, len(text) // 10 * 10)
    emotion = 75 if any(word in text.lower() for word in ["exciting", "amazing", "love"]) else 60
    credibility = 80 if len(text) > 50 else 60
    market_effectiveness = (clarity + emotion + credibility) // 3
    score = market_effectiveness

    suggestion = f"Improved version: {text} (with enhanced clarity and impact)"
    insights = [
        "Add specific metrics to increase credibility",
        "Include a clear call-to-action",
        "Use more emotional language to connect with audience",
    ]

    return AnalyzeResponse(
        score=score,
        clarity=clarity,
        emotion=emotion,
        credibility=credibility,
        market_effectiveness=market_effectiveness,
        suggestion=suggestion,
        insights=insights,
    )

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_message(request: AnalyzeRequest):
    # Custom Validation
    # 1.Empty check
    if not request.message or request.message.strip() == "":
        raise HTTPException(status_code=400, detail="Message cannot be empty or whitespace.")
    text = request.message.strip()
    
    # 2.Length checks
    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Message must be at least 10 characters long.")
    
    if len(text) > 2000:
        raise HTTPException( status_code=400, detail="Message is too long. Please keep it under 2000 characters.")  
    
    # 3. Run mock analysis
    return run_simple_analysis(text, request.tone, request.persona)
    
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
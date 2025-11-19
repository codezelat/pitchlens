from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="PitchLens Analysis API", version="1.0.0")

class AnalyzeRequest(BaseModel):
    message: str
    tone: Optional[str] = "professional"
    persona: Optional[str] = "expert"

class AnalyzeResponse(BaseModel):
    score: int
    clarity: int
    emotion: int
    credibility: int
    market_effectiveness: int
    suggestion: str
    insights: List[str]

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_message(request: AnalyzeRequest):
    # Mock analysis logic - replace with actual AI/NLP processing
    message = request.message

    # Simple mock scoring based on message length and keywords
    clarity = min(100, len(message) // 10 * 10)
    emotion = 75 if any(word in message.lower() for word in ['exciting', 'amazing', 'love']) else 60
    credibility = 80 if len(message) > 50 else 60
    market_effectiveness = (clarity + emotion + credibility) // 3
    score = market_effectiveness

    suggestion = f"Improved version: {message} (with enhanced clarity and impact)"
    insights = [
        "Add specific metrics to increase credibility",
        "Include a clear call-to-action",
        "Use more emotional language to connect with audience"
    ]

    return AnalyzeResponse(
        score=score,
        clarity=clarity,
        emotion=emotion,
        credibility=credibility,
        market_effectiveness=market_effectiveness,
        suggestion=suggestion,
        insights=insights
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
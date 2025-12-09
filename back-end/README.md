# PitchLens Backend - FastAPI Analysis Service

This backend provides the analysis engine for PitchLens, a message intelligence tool. It uses FastAPI with Python to perform AI-powered message analysis, including scoring for clarity, emotional resonance, credibility, and market effectiveness.

## Purpose

The backend serves as the API layer that:
- Receives message text or URLs from the front-end
- Performs natural language processing and analysis
- Returns structured JSON responses with scores, suggestions, and insights
- Supports tone/persona adjustments and rewrite generation

## Prerequisites

- Python 3.8+
- pip (Python package manager)

## Installation & Setup

1. Navigate to the back-end directory:
   ```bash
   cd back-end
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   # Activate on Windows
   venv\Scripts\activate
   # Activate on macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install fastapi uvicorn
   # Add other dependencies as needed (e.g., transformers, torch for AI models)
   ```

4. Run the development server:
   ```bash
   uvicorn app:app --reload
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

### POST /analyze
Analyzes a message and returns scoring and suggestions.

**Request Body:**
```json
{
  "message": "Your message text here",
  "tone": "professional",  // optional: professional, casual, enthusiastic, etc.
  "persona": "expert"      // optional: expert, friendly, authoritative, etc.
}
```

**Response:**
```json
{
  "score": 84,
  "clarity": 92,
  "emotion": 80,
  "credibility": 78,
  "market_effectiveness": 85,
  "suggestion": "Rewritten message with improved clarity and impact",
  "insights": [
    "Add specific metrics to increase credibility",
    "Include a clear call-to-action",
    "Use more emotional language to connect with audience"
  ]
}
```
## Running Tests

Make sure you are inside the back-end folder and your virtual environment is activated.

```bash
cd back-end
pytest

## Unit Testing

PitchLens uses PyTest for backend testing.

To run tests:

1. Activate virtual environment
2. Navigate to back-end folder
3. Run:
   pytest

Current tests cover:
- Short message scoring
- Credibility boost from numbers & data
- Emotional tone impact


### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

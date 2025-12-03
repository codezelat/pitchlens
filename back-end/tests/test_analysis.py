import os
import sys
import pytest

# 👇 Make sure Python can find app.py (backend root)
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import run_simple_analysis


def test_short_message_has_lower_scores():
    """Very short message → basic clarity/emotion/credibility scores."""
    msg = "Short message."
    result = run_simple_analysis(msg, tone="professional", persona="expert")

    assert result.clarity == 50
    assert result.emotion == 50
    assert result.credibility == 50
    # score should be a valid percentage
    assert 0 <= result.score <= 100
    assert result.score == result.market_effectiveness


def test_message_with_numbers_and_data_boosts_credibility():
    """Numbers + 'data' keyword should increase credibility."""
    msg = (
        "Our data shows a 45% increase in leads across 120 campaigns "
        "over six months."
    )
    result = run_simple_analysis(msg, tone="professional", persona="authoritative")

    # Length between 40 and 120 → clarity bucket 75
    assert result.clarity == 75
    # 'data' + numbers + authoritative persona → high credibility
    assert result.credibility == 80
    assert result.score >= 60  # overall score should be reasonably high


def test_enthusiastic_tone_raises_emotion():
    """Enthusiastic tone should give higher emotion score than professional."""
    msg = "Our customers love the amazing results and are thrilled with the success."

    professional = run_simple_analysis(msg, tone="professional", persona="expert")
    enthusiastic = run_simple_analysis(msg, tone="enthusiastic", persona="expert")

    assert enthusiastic.emotion > professional.emotion

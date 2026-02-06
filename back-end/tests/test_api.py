import os
import sys

from fastapi.testclient import TestClient

CURRENT_DIR = os.path.dirname(__file__)
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)

if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import app
from db import init_db


def test_analyze_and_latest_endpoints_work():
    init_db()

    with TestClient(app) as client:
        analyze = client.post(
            "/analyze",
            json={
                "message": "Our data shows a 20% conversion increase this quarter.",
                "tone": "professional",
                "persona": "expert",
            },
        )
        assert analyze.status_code == 200
        payload = analyze.json()
        assert "id" in payload
        assert "score" in payload
        assert isinstance(payload.get("insights"), list)

        latest = client.get("/analyses/latest")
        assert latest.status_code == 200
        assert latest.json().get("id") == payload["id"]

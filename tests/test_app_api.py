import sys

import pytest

sys.path.insert(0, ".")

pytest.importorskip("flask")

from app import app


def test_decide_rejects_invalid_json_body():
    client = app.test_client()

    response = client.post(
        "/api/decide",
        data="not-json",
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid JSON body"}


def test_architect_rejects_empty_prompt():
    client = app.test_client()

    response = client.post("/api/architect", json={"prompt": "   "})

    assert response.status_code == 400
    assert response.get_json() == {
        "response": "Architect requires a non-empty prompt.",
        "commands": [],
    }

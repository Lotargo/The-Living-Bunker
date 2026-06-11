import sys

import pytest

sys.path.insert(0, ".")

import ai_orchestrator


class FakeResponse:
    def __init__(self, status_code, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = text

    def json(self):
        return self._payload


def test_decide_for_actor_rejects_unknown_resident():
    with pytest.raises(ValueError, match="Unknown bot"):
        ai_orchestrator.decide_for_actor({"type": "resident", "name": "Nobody"})


def test_decide_for_actor_uses_persona_temperature(monkeypatch):
    calls = []
    monkeypatch.setattr(ai_orchestrator, "_should_use_demo", lambda provider: False)

    def fake_call_llm(provider, model, messages, temperature):
        calls.append(
            {
                "provider": provider,
                "model": model,
                "messages": messages,
                "temperature": temperature,
            }
        )
        return FakeResponse(
            200,
            {"choices": [{"message": {"content": '{"thought":"ok","action":"IDLE"}'}}]},
        )

    monkeypatch.setattr(ai_orchestrator, "call_llm", fake_call_llm)

    result = ai_orchestrator.decide_for_actor(
        {
            "type": "resident",
            "name": "Red",
            "state": "IDLE",
            "nearby": [],
            "anomalies": [],
            "needs": {},
        }
    )

    assert result == {"thought": "ok", "action": "IDLE"}
    assert calls[0]["temperature"] == ai_orchestrator.PERSONAS["Red"]["temperature"]
    assert calls[0]["provider"] == ai_orchestrator.PERSONAS["Red"]["provider"]


def test_decide_for_actor_returns_fallback_on_provider_error(monkeypatch):
    monkeypatch.setattr(ai_orchestrator, "_should_use_demo", lambda provider: False)
    monkeypatch.setattr(
        ai_orchestrator,
        "call_llm",
        lambda *args, **kwargs: FakeResponse(500, text="nope"),
    )

    result = ai_orchestrator.decide_for_actor(
        {
            "type": "anomaly",
            "anomalyType": "Ghost",
            "stage": "ACTIVE",
            "lifespan": 10,
            "nearbyResidents": [],
        }
    )

    assert result == {"thought": "...", "action": "IDLE", "target": "self"}


def test_run_architect_prompt_applies_command_mutations(monkeypatch):
    monkeypatch.setattr(ai_orchestrator, "_should_use_demo", lambda provider: False)

    def fake_call_llm(provider, model, messages, temperature):
        return FakeResponse(
            200,
            {
                "choices": [
                    {
                        "message": {
                            "content": (
                                '{"response":"ok","commands":['
                                '{"action":"SPAWN","type":"Ghost","location":"Kitchen"},'
                                '{"action":"ATMOSPHERE","type":"Heavy Static"}'
                                "]}"
                            )
                        }
                    }
                ]
            },
        )

    monkeypatch.setattr(ai_orchestrator, "call_llm", fake_call_llm)

    result = ai_orchestrator.run_architect_prompt("scare them")

    assert result["response"] == "ok"
    assert result["commands"][0]["type"] == "Poltergeist"


def test_decide_for_actor_uses_demo_when_provider_config_missing(monkeypatch):
    monkeypatch.setattr(ai_orchestrator, "has_provider_config", lambda provider: False)

    result = ai_orchestrator.decide_for_actor(
        {
            "type": "resident",
            "name": "Luna",
            "state": "IDLE",
            "nearby": [],
            "anomalies": [{"type": "Ghost", "stage": "GESTATING", "dist": 3}],
            "needs": {},
        }
    )

    assert result["action"] == "STARE"
    assert result["thought"] == "MEEEOW!!"


def test_run_architect_prompt_uses_demo_when_enabled(monkeypatch):
    monkeypatch.setenv("LIVING_BUNKER_DEMO", "1")

    result = ai_orchestrator.run_architect_prompt("summon a ghost")

    assert result["response"].startswith("Demo Architect")
    assert any(command["action"] == "SPAWN" for command in result["commands"])

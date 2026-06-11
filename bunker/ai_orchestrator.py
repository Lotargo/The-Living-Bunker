from __future__ import annotations

import json
import os
from typing import Any

from bunker.config import (
    ANOMALY_INSTRUCTION,
    ANOMALY_PROMPTS,
    ARCHITECT_FALLBACK_MODEL,
    ARCHITECT_MODEL,
    ARCHITECT_SYSTEM,
    CAT_INSTRUCTION,
    PERSONAS,
    SYSTEM_INSTRUCTION,
)
from bunker.demo_mode import demo_architect_response, demo_decision
from bunker.llm_client import call_llm, get_fallback_response, has_provider_config, parse_json_response
from bunker.mutations import process_mutations
from bunker.runtime_settings import custom_provider_config, provider_mode


def _demo_enabled() -> bool:
    return provider_mode() == "demo" or os.environ.get("LIVING_BUNKER_DEMO", "0").lower() in ("1", "true", "yes", "on")


def _should_use_demo(provider: str) -> bool:
    return _demo_enabled() or not has_provider_config(provider)


def _apply_provider_override(provider: str, model: str) -> tuple[str, str]:
    if provider_mode() == "openai_compatible":
        custom = custom_provider_config()
        return "openai_compatible", custom["model"] or model
    return provider, model


def _chat_content(response_json: dict[str, Any]) -> str:
    try:
        return response_json["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("Invalid chat completion response") from exc


def _resident_prompt(data: dict[str, Any]) -> tuple[str, str, str, float, str]:
    bot_name = data.get("name")

    if bot_name == "Luna":
        persona = PERSONAS["Luna"]
        prompt = CAT_INSTRUCTION.format(
            state=data.get("state"),
            objects=json.dumps(data.get("nearby")),
            anomalies=json.dumps(data.get("anomalies", [])),
            atmosphere=data.get("atmosphere", "Normal"),
        )
    elif bot_name in PERSONAS:
        persona = PERSONAS[bot_name]
        prompt = SYSTEM_INSTRUCTION.format(
            state=data.get("state"),
            health=data.get("health", 100),
            objects=json.dumps(data.get("nearby")),
            anomalies=json.dumps(data.get("anomalies", [])),
            atmosphere=data.get("atmosphere", "Normal"),
            needs=json.dumps(data.get("needs")),
        )
    else:
        raise ValueError("Unknown bot")

    return (
        persona["role"],
        persona["provider"],
        persona["model"],
        persona.get("temperature", 0.8),
        prompt,
    )


def _anomaly_prompt(data: dict[str, Any]) -> tuple[str, str, str, float]:
    anomaly_type = data.get("anomalyType")

    if anomaly_type == "Doppelganger":
        persona = PERSONAS["Doppelganger"]
        system_role = persona["role"]
        provider = persona["provider"]
        model = persona["model"]
        temperature = persona.get("temperature", 0.8)
    else:
        system_role = ANOMALY_PROMPTS.get(anomaly_type, "You are an anomaly.")
        provider = "groq"
        model = "llama-3.1-8b-instant"
        temperature = 0.8

    prompt = ANOMALY_INSTRUCTION.format(
        type=anomaly_type,
        stage=data.get("stage"),
        lifespan=data.get("lifespan"),
        residents=json.dumps(data.get("nearbyResidents", [])),
        luna_dist=data.get("lunaDist", 999),
    )

    return system_role, provider, model, temperature, prompt


def decide_for_actor(data: dict[str, Any]) -> dict[str, Any]:
    bot_type = data.get("type", "resident")

    if bot_type == "resident":
        system_role, provider, model, temperature, prompt = _resident_prompt(data)
    elif bot_type == "anomaly":
        system_role, provider, model, temperature, prompt = _anomaly_prompt(data)
    else:
        raise ValueError("Invalid type")

    messages = [
        {"role": "system", "content": system_role},
        {"role": "user", "content": prompt},
    ]
    provider, model = _apply_provider_override(provider, model)

    if _should_use_demo(provider):
        return demo_decision(data)

    try:
        response = call_llm(provider, model, messages, temperature=temperature)
        if response.status_code != 200:
            print(f"API Error {provider}: {response.text}")
            return get_fallback_response()

        content = _chat_content(response.json())
        return parse_json_response(content)
    except Exception as exc:
        print(f"LLM Error ({data.get('name') or data.get('anomalyType')}): {exc}")
        return get_fallback_response()


def run_architect_prompt(user_prompt: str) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": ARCHITECT_SYSTEM},
        {"role": "user", "content": user_prompt},
    ]

    provider, model = _apply_provider_override("cerebras", ARCHITECT_MODEL)

    if _should_use_demo(provider):
        return demo_architect_response(user_prompt)

    try:
        response = call_llm(provider, model, messages, temperature=0.9)
        if response.status_code != 200:
            print(f"{provider} Error: {response.text}, falling back to Groq")
            response = call_llm("groq", ARCHITECT_FALLBACK_MODEL, messages, temperature=0.9)

        if response.status_code != 200:
            return {"response": "System Error: Connection to Architect failed.", "commands": []}

        content = _chat_content(response.json())
        try:
            architect_response = parse_json_response(content)
        except (json.JSONDecodeError, ValueError):
            print(f"Architect Error: Invalid JSON received. Content: {content}")
            return {
                "response": "Connection interference... Signal lost. (Invalid Protocol)",
                "commands": [],
            }

        raw_commands = architect_response.get("commands", [])
        architect_response["commands"] = process_mutations(raw_commands)
        return architect_response
    except Exception as exc:
        print(f"Architect Error: {exc}")
        return {"response": "Connection interference... Signal lost.", "commands": []}

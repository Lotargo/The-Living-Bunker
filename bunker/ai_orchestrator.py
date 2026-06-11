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
from bunker.provider_manager import provider_manager


def _demo_enabled() -> bool:
    return provider_mode() == "demo" or os.environ.get("LIVING_BUNKER_DEMO", "0").lower() in ("1", "true", "yes", "on")


def _should_use_demo(provider: str) -> bool:
    return _demo_enabled() or not has_provider_config(provider)


def _apply_provider_override(provider: str, model: str) -> tuple[str, str]:
    mode = provider_mode()
    if mode in ("openai_compatible", "opencode_zen", "ollama"):
        custom = custom_provider_config()
        return mode, custom["model"] or model
    return provider, model


def _chat_content(response_json: dict[str, Any]) -> str:
    try:
        return response_json["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ValueError("Invalid chat completion response") from exc


def _register_character_providers() -> None:
    default_providers = {
        "Red": ("groq", "qwen/qwen3-32b"),
        "Blue": ("cerebras", "llama3.1-8b"),
        "Green": ("cerebras", "llama-3.3-70b"),
        "Luna": ("cerebras", "llama-3.3-70b"),
        "Doppelganger": ("groq", "openai/gpt-oss-20b"),
    }
    for name, persona in PERSONAS.items():
        default_provider, default_model = default_providers.get(name, ("groq", "llama-3.1-8b"))
        provider_manager.register_character(
            character_name=name,
            primary_provider=persona["provider"],
            primary_model=persona["model"],
            default_provider=default_provider,
            default_model=default_model,
        )


_register_character_providers()


def _resident_prompt(data: dict[str, Any]) -> tuple[str, str, str, float, str]:
    bot_name = data.get("name")

    demo_chars = []
    for r in data.get("nearby", []):
        r_name = r.get("id") if isinstance(r, dict) else r
        if r_name and r_name != bot_name:
            status = provider_manager.get_status(r_name)
            if status and status.get("demo_mode"):
                demo_chars.append(r_name)

    demo_context = ""
    if demo_chars:
        demo_context = f"\n\nOBSERVATION: {', '.join(demo_chars)} seem(s) off today. Their responses are generic and repetitive, as if they're running on autopilot or a different system. This is unusual."

    if bot_name == "Luna":
        persona = PERSONAS["Luna"]
        prompt = CAT_INSTRUCTION.format(
            state=data.get("state"),
            objects=json.dumps(data.get("nearby")),
            anomalies=json.dumps(data.get("anomalies", [])),
            atmosphere=data.get("atmosphere", "Normal"),
        )
        if demo_context:
            prompt += "\n\nYou sense something wrong with some residents. They feel hollow, like empty shells. React with suspicion."
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
        prompt += demo_context
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
    character_name = data.get("name") or data.get("anomalyType")

    if bot_type == "resident":
        system_role, provider, model, temperature, prompt = _resident_prompt(data)
    elif bot_type == "anomaly":
        system_role, provider, model, temperature, prompt = _anomaly_prompt(data)
    else:
        raise ValueError("Invalid type")

    provider_status = provider_manager.get_status(character_name)
    if provider_status:
        provider_manager.report_success(character_name)

    messages = [
        {"role": "system", "content": system_role},
        {"role": "user", "content": prompt},
    ]

    if provider_status and not provider_status.get("demo_mode"):
        pm_provider, pm_model, is_demo = provider_manager.get_provider(character_name)
        if is_demo:
            return demo_decision(data)
        provider, model = pm_provider, pm_model

    provider, model = _apply_provider_override(provider, model)

    if _should_use_demo(provider):
        return demo_decision(data)

    try:
        response = call_llm(provider, model, messages, temperature=temperature)
        if response.status_code != 200:
            print(f"API Error {provider}: {response.text}")
            if provider_status:
                provider_manager.report_failure(character_name)
            return get_fallback_response()

        content = _chat_content(response.json())
        if provider_status:
            provider_manager.report_success(character_name)
        return parse_json_response(content)
    except Exception as exc:
        print(f"LLM Error ({data.get('name') or data.get('anomalyType')}): {exc}")
        if provider_status:
            provider_manager.report_failure(character_name)
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

from __future__ import annotations

import json
import os
import re
import requests
from bunker.config import GROQ_API_KEY, CEREBRAS_API_KEY
from bunker.runtime_settings import custom_provider_config
from bunker.token_manager import truncate_to_token_limit

PROVIDER_URLS = {
    "groq": os.environ.get("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions"),
    "cerebras": os.environ.get("CEREBRAS_API_URL", "https://api.cerebras.ai/v1/chat/completions")
}

PROVIDER_KEYS = {
    "groq": GROQ_API_KEY,
    "cerebras": CEREBRAS_API_KEY
}

REQUEST_TIMEOUT_SECONDS = float(os.environ.get("LLM_REQUEST_TIMEOUT_SECONDS", "30"))

def has_provider_config(provider: str) -> bool:
    if provider in ("openai_compatible", "opencode_zen", "ollama"):
        custom = custom_provider_config()
        return bool(custom["api_key"] and custom["api_url"])
    return bool(PROVIDER_KEYS.get(provider) and PROVIDER_URLS.get(provider))


def call_llm(provider: str, model: str, messages: list[dict], temperature: float = 0.8) -> requests.Response:
    api_key = PROVIDER_KEYS.get(provider)
    api_url = PROVIDER_URLS.get(provider)
    if provider in ("openai_compatible", "opencode_zen", "ollama"):
        custom = custom_provider_config()
        api_key = custom["api_key"]
        api_url = custom["api_url"]

    if not api_key or not api_url:
        raise ValueError(f"No configuration for provider: {provider}")

    messages = truncate_to_token_limit(messages)

    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": temperature
    }

    headers = {"Authorization": f"Bearer {api_key}"}
    if provider == "ollama":
        headers = {}

    resp = requests.post(
        api_url,
        headers=headers,
        json=payload,
        timeout=REQUEST_TIMEOUT_SECONDS
    )

    return resp


def parse_json_response(content: str) -> dict:
    content = content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass
    match = re.search(r'```(?:json)?\n?(.*?)\n?```', content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
    cleaned = content.replace("```json", "").replace("```", "")
    return json.loads(cleaned)


def get_fallback_response() -> dict:
    return {"thought": "...", "action": "IDLE", "target": "self"}

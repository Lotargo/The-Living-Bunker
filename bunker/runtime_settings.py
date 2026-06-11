from __future__ import annotations

import os
from typing import Any

from bunker.token_manager import set_max_tokens


DEFAULT_SETTINGS: dict[str, Any] = {
    "providerMode": os.environ.get("LIVING_BUNKER_PROVIDER_MODE", "default"),
    "demoMode": os.environ.get("LIVING_BUNKER_DEMO", "0").lower() in ("1", "true", "yes", "on"),
    "openaiBaseUrl": os.environ.get("OPENAI_COMPATIBLE_BASE_URL", "https://api.openai.com/v1/chat/completions"),
    "openaiApiKey": os.environ.get("OPENAI_COMPATIBLE_API_KEY", ""),
    "openaiModel": os.environ.get("OPENAI_COMPATIBLE_MODEL", "gpt-4o-mini"),
    "opencodeZenApiKey": os.environ.get("OPENCODE_ZEN_API_KEY", ""),
    "opencodeZenModel": os.environ.get("OPENCODE_ZEN_MODEL", "gpt-5.4-mini"),
    "ollamaBaseUrl": os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1/chat/completions"),
    "ollamaModel": os.environ.get("OLLAMA_MODEL", "llama3.1"),
    "maxContextTokens": int(os.environ.get("LLM_MAX_CONTEXT_TOKENS", "20000")),
}

_settings: dict[str, Any] = DEFAULT_SETTINGS.copy()
set_max_tokens(_settings["maxContextTokens"])


def get_settings(include_secret: bool = False) -> dict[str, Any]:
    result = _settings.copy()
    result["openaiApiKeyConfigured"] = bool(result.get("openaiApiKey"))
    result["opencodeZenApiKeyConfigured"] = bool(result.get("opencodeZenApiKey"))
    if not include_secret:
        result.pop("openaiApiKey", None)
        result.pop("opencodeZenApiKey", None)
    return result


def update_settings(data: dict[str, Any]) -> dict[str, Any]:
    for key in ("providerMode", "openaiBaseUrl", "openaiModel", "opencodeZenModel", "ollamaBaseUrl", "ollamaModel"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            _settings[key] = value.strip()

    if "maxContextTokens" in data:
        value = data.get("maxContextTokens")
        if isinstance(value, (int, float)) and value > 0:
            _settings["maxContextTokens"] = int(value)
            set_max_tokens(int(value))
        elif isinstance(value, str) and value.strip().isdigit():
            _settings["maxContextTokens"] = int(value.strip())
            set_max_tokens(int(value.strip()))

    if "demoMode" in data:
        _settings["demoMode"] = bool(data.get("demoMode"))
        if _settings["demoMode"]:
            _settings["providerMode"] = "demo"

    if "openaiApiKey" in data:
        value = data.get("openaiApiKey")
        if isinstance(value, str):
            _settings["openaiApiKey"] = value.strip()

    if "opencodeZenApiKey" in data:
        value = data.get("opencodeZenApiKey")
        if isinstance(value, str):
            _settings["opencodeZenApiKey"] = value.strip()

    if _settings.get("providerMode") not in ("default", "demo", "openai_compatible", "opencode_zen", "ollama"):
        _settings["providerMode"] = "default"

    return get_settings()


def provider_mode() -> str:
    if _settings.get("demoMode"):
        return "demo"
    return str(_settings.get("providerMode", "default"))


def custom_provider_config() -> dict[str, str]:
    mode = _settings.get("providerMode", "default")
    if mode == "opencode_zen":
        return {
            "api_url": "https://opencode.ai/zen/v1/chat/completions",
            "api_key": str(_settings.get("opencodeZenApiKey", "")),
            "model": str(_settings.get("opencodeZenModel", "gpt-5.4-mini")),
        }
    if mode == "ollama":
        return {
            "api_url": str(_settings.get("ollamaBaseUrl", "http://localhost:11434/v1/chat/completions")),
            "api_key": "ollama",
            "model": str(_settings.get("ollamaModel", "llama3.1")),
        }
    return {
        "api_url": str(_settings.get("openaiBaseUrl", "")),
        "api_key": str(_settings.get("openaiApiKey", "")),
        "model": str(_settings.get("openaiModel", "")),
    }

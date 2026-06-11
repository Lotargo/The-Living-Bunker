from __future__ import annotations

import os
from typing import Any


DEFAULT_SETTINGS: dict[str, Any] = {
    "providerMode": os.environ.get("LIVING_BUNKER_PROVIDER_MODE", "default"),
    "demoMode": os.environ.get("LIVING_BUNKER_DEMO", "0").lower() in ("1", "true", "yes", "on"),
    "openaiBaseUrl": os.environ.get("OPENAI_COMPATIBLE_BASE_URL", "https://api.openai.com/v1/chat/completions"),
    "openaiApiKey": os.environ.get("OPENAI_COMPATIBLE_API_KEY", ""),
    "openaiModel": os.environ.get("OPENAI_COMPATIBLE_MODEL", "gpt-4o-mini"),
}

_settings: dict[str, Any] = DEFAULT_SETTINGS.copy()


def get_settings(include_secret: bool = False) -> dict[str, Any]:
    result = _settings.copy()
    result["openaiApiKeyConfigured"] = bool(result.get("openaiApiKey"))
    if not include_secret:
        result.pop("openaiApiKey", None)
    return result


def update_settings(data: dict[str, Any]) -> dict[str, Any]:
    for key in ("providerMode", "openaiBaseUrl", "openaiModel"):
        value = data.get(key)
        if isinstance(value, str) and value.strip():
            _settings[key] = value.strip()

    if "demoMode" in data:
        _settings["demoMode"] = bool(data.get("demoMode"))
        if _settings["demoMode"]:
            _settings["providerMode"] = "demo"

    if "openaiApiKey" in data:
        value = data.get("openaiApiKey")
        if isinstance(value, str):
            _settings["openaiApiKey"] = value.strip()

    if _settings.get("providerMode") not in ("default", "demo", "openai_compatible"):
        _settings["providerMode"] = "default"

    return get_settings()


def provider_mode() -> str:
    if _settings.get("demoMode"):
        return "demo"
    return str(_settings.get("providerMode", "default"))


def custom_provider_config() -> dict[str, str]:
    return {
        "api_url": str(_settings.get("openaiBaseUrl", "")),
        "api_key": str(_settings.get("openaiApiKey", "")),
        "model": str(_settings.get("openaiModel", "")),
    }

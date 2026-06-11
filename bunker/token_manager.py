from __future__ import annotations

import os
from typing import Any


CHARS_PER_TOKEN = 4
DEFAULT_MAX_TOKENS = int(os.environ.get("LLM_MAX_CONTEXT_TOKENS", "20000"))

_max_tokens_override: int | None = None


def set_max_tokens(limit: int) -> None:
    global _max_tokens_override
    _max_tokens_override = limit


def get_max_tokens() -> int:
    return _max_tokens_override or DEFAULT_MAX_TOKENS


def estimate_tokens(text: str) -> int:
    return len(text) // CHARS_PER_TOKEN


def truncate_to_token_limit(messages: list[dict[str, str]], max_tokens: int | None = None) -> list[dict[str, str]]:
    if not messages:
        return messages

    if max_tokens is None:
        max_tokens = get_max_tokens()

    total_tokens = sum(estimate_tokens(m.get("content", "")) for m in messages)

    if total_tokens <= max_tokens:
        return messages

    system_messages = [m for m in messages if m.get("role") == "system"]
    user_messages = [m for m in messages if m.get("role") != "system"]

    system_tokens = sum(estimate_tokens(m.get("content", "")) for m in system_messages)
    available_tokens = max_tokens - system_tokens

    if available_tokens <= 0:
        return system_messages[:1]

    kept_messages = []
    current_tokens = 0

    for msg in reversed(user_messages):
        msg_tokens = estimate_tokens(msg.get("content", ""))
        if current_tokens + msg_tokens > available_tokens:
            break
        kept_messages.insert(0, msg)
        current_tokens += msg_tokens

    return system_messages + kept_messages

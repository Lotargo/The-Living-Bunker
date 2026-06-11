from __future__ import annotations

import time
from typing import Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class ProviderState(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"


@dataclass
class ProviderStatus:
    state: ProviderState = ProviderState.HEALTHY
    failure_count: int = 0
    last_failure_time: float = 0
    next_retry_time: float = 0
    recovery_attempts: int = 0
    max_recovery_attempts: int = 3


@dataclass
class CharacterProviderState:
    primary_provider: str
    primary_model: str
    default_provider: str
    default_model: str
    primary_status: ProviderStatus = field(default_factory=ProviderStatus)
    default_status: ProviderStatus = field(default_factory=ProviderStatus)
    using_default: bool = False
    demo_mode: bool = False


RETRY_DELAYS = [1.0, 2.0, 4.0]
RECOVERY_DELAYS = [60.0, 120.0, 180.0]
MAX_RECOVERY_ATTEMPTS = 3


class ProviderManager:
    def __init__(self) -> None:
        self._states: dict[str, CharacterProviderState] = {}

    def register_character(
        self,
        character_name: str,
        primary_provider: str,
        primary_model: str,
        default_provider: str,
        default_model: str,
    ) -> None:
        if character_name not in self._states:
            self._states[character_name] = CharacterProviderState(
                primary_provider=primary_provider,
                primary_model=primary_model,
                default_provider=default_provider,
                default_model=default_model,
            )

    def get_provider(
        self, character_name: str
    ) -> tuple[str, str, bool]:
        state = self._states.get(character_name)
        if not state:
            return ("", "", False)

        now = time.time()

        if state.demo_mode:
            return ("demo", "", True)

        if state.using_default:
            if state.default_status.state == ProviderState.FAILED:
                if state.default_status.failure_count >= 3:
                    state.demo_mode = True
                    return ("demo", "", True)

                if now >= state.default_status.next_retry_time:
                    return (
                        state.default_provider,
                        state.default_model,
                        False,
                    )
                return (state.default_provider, state.default_model, False)

            if (
                state.primary_status.recovery_attempts < MAX_RECOVERY_ATTEMPTS
                and now >= state.primary_status.next_retry_time
            ):
                return (
                    state.primary_provider,
                    state.primary_model,
                    False,
                )

            return (state.default_provider, state.default_model, False)

        if state.primary_status.state == ProviderState.FAILED:
            if state.primary_status.failure_count >= 3:
                state.using_default = True
                state.default_status.next_retry_time = now + RECOVERY_DELAYS[0]
                return (state.default_provider, state.default_model, False)

            if now >= state.primary_status.next_retry_time:
                return (state.primary_provider, state.primary_model, False)
            return (state.default_provider, state.default_model, False)

        return (state.primary_provider, state.primary_model, False)

    def report_success(self, character_name: str) -> None:
        state = self._states.get(character_name)
        if not state:
            return

        if state.using_default:
            state.default_status.failure_count = 0
            state.default_status.state = ProviderState.HEALTHY
            state.default_status.recovery_attempts = 0
        else:
            state.primary_status.failure_count = 0
            state.primary_status.state = ProviderState.HEALTHY
            state.primary_status.recovery_attempts = 0
            state.using_default = False

    def report_failure(self, character_name: str) -> None:
        state = self._states.get(character_name)
        if not state:
            return

        now = time.time()

        if state.using_default:
            state.default_status.failure_count += 1
            state.default_status.last_failure_time = now
            state.default_status.state = ProviderState.FAILED

            idx = min(state.default_status.failure_count - 1, len(RETRY_DELAYS) - 1)
            state.default_status.next_retry_time = now + RETRY_DELAYS[idx]
        else:
            state.primary_status.failure_count += 1
            state.primary_status.last_failure_time = now
            state.primary_status.state = ProviderState.FAILED

            idx = min(state.primary_status.failure_count - 1, len(RETRY_DELAYS) - 1)
            state.primary_status.next_retry_time = now + RETRY_DELAYS[idx]

    def report_recovery_attempt(self, character_name: str, success: bool) -> None:
        state = self._states.get(character_name)
        if not state:
            return

        now = time.time()

        if state.using_default and not success:
            state.default_status.recovery_attempts += 1
            if state.default_status.recovery_attempts >= MAX_RECOVERY_ATTEMPTS:
                state.demo_mode = True
            else:
                idx = min(
                    state.default_status.recovery_attempts - 1,
                    len(RECOVERY_DELAYS) - 1,
                )
                state.default_status.next_retry_time = now + RECOVERY_DELAYS[idx]
        elif state.using_default and success:
            state.using_default = False
            state.primary_status.failure_count = 0
            state.primary_status.state = ProviderState.HEALTHY
            state.primary_status.recovery_attempts = 0
        elif not state.using_default and not success:
            state.primary_status.recovery_attempts += 1
            if state.primary_status.recovery_attempts >= MAX_RECOVERY_ATTEMPTS:
                state.using_default = True
                state.default_status.next_retry_time = now + RECOVERY_DELAYS[0]
            else:
                idx = min(
                    state.primary_status.recovery_attempts - 1,
                    len(RECOVERY_DELAYS) - 1,
                )
                state.primary_status.next_retry_time = now + RECOVERY_DELAYS[idx]

    def get_status(self, character_name: str) -> dict[str, Any]:
        state = self._states.get(character_name)
        if not state:
            return {}

        return {
            "primary_provider": state.primary_provider,
            "primary_model": state.primary_model,
            "default_provider": state.default_provider,
            "default_model": state.default_model,
            "using_default": state.using_default,
            "demo_mode": state.demo_mode,
            "primary_failures": state.primary_status.failure_count,
            "default_failures": state.default_status.failure_count,
        }


provider_manager = ProviderManager()

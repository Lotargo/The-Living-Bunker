# The Living Bunker: Detailed Plan & Fixes

This document outlines the detailed mapping of bugs, discrepancies, and a future execution plan for "The Living Bunker" simulation.

## Mapped Discrepancies (To Be Fixed)

### 1. Resident Model Misconfiguration (`app.py` vs `docs/agents.md`)
The models assigned to residents in `app.py`'s `PERSONAS` dictionary do not match the documented intended behavior in `docs/agents.md`.
*   **Red:** Currently `qwen/qwen3-32b`, should be `llama-3.1-8b-instant`.
*   **Blue:** Currently `llama3.1-8b` (Cerebras), should be `llama-3.3-70b` (Cerebras).
*   **Green:** Currently `llama-3.3-70b` (Cerebras), should be `llama3.1-8b` (Cerebras).

### 2. Architect LLM Configuration Contradiction
The documentation in `docs/architect_mode.md` claims:
> LLM (`gpt-oss-120b` via Cerebras, or `llama-3.3-70b` via Groq) which acts as the "Architect".

However, the actual code implementation in `app.py` directly contradicts this:
*   **Primary (Cerebras):** Set to `llama-3.3-70b` (Line 258).
*   **Fallback (Groq):** Set to `openai/gpt-oss-120b` (Line 282).
*   *Action:* Resolve documentation and code to sync on what the correct LLMs are for Architect mode.

### 3. Anomaly Prompts Out of Sync
*   `docs/architect_mode.md` lists `Ghost`, `Glitch`, and `Doppelganger` as spawnable entities. It lists `Poltergeist` purely as a mutation resulting from "Spawn Ghost + Negative Atmosphere".
*   In `app.py`, `ANOMALY_PROMPTS` directly implements `Poltergeist` as a standalone anomaly.
*   *Action:* Either update the documentation to include `Poltergeist` as a base spawn, or remove/modify it from `ANOMALY_PROMPTS` if it's strictly meant to be a mutation.

### 4. Architect `BUILD` Command Documentation Missing
*   The test file `verify_architect.py` checks for the Architect's ability to handle a `BUILD` command ("Build a Library next to the Kitchen.").
*   `app.py` includes `BUILD` as an available command inside `ARCHITECT_SYSTEM`.
*   However, `docs/architect_mode.md` does *not* document the `BUILD` capability under "Capabilities".
*   *Action:* Update `docs/architect_mode.md` to properly document the `BUILD` capability.

## Future Execution Plan

1.  **Correct `app.py` Model Mapping:** Update the `PERSONAS` dictionary to exactly match `docs/agents.md`.
2.  **Fix Architect LLM Providers:** Investigate whether `gpt-oss-120b` or `llama-3.3-70b` should be the primary, and apply the correct models to the correct providers (Cerebras/Groq) in both `app.py` and `docs/architect_mode.md`.
3.  **Update Architect Documentation (`docs/architect_mode.md`):**
    *   Add a new section for the `BUILD` command capability.
    *   Clarify the behavior and implementation of the `Poltergeist` mutation vs base anomaly.
4.  **Run comprehensive tests:** Execute `python check_models.py` and `python verify_architect.py` to ensure all API interactions are passing successfully after all fixes are merged.

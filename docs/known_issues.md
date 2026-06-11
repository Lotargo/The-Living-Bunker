# Known Issues

This file tracks observed gameplay, AI, UX, and visual problems before we start fixing them. Keep it direct: one issue, one clear symptom.

## Current Bugs

- [/] **Luna loops into constant meowing**
  Luna can repeatedly emit "Meow" reactions too aggressively, creating noise instead of meaningful warning behavior.
  First pass: duplicate Luna logs are throttled and non-danger meows are normalized. Still needs better cat-state design.

- [/] **Residents lack visible animation and convincing movement**
  Main characters feel static. They do not currently communicate walking, idling, interacting, or emotional state through animation.
  First pass: Tiny Questers NPC atlases are imported and residents render idle/walk frames. Still pseudo-isometric, not full top-down yet.

- [x] **Runtime rate limiting is not game-aware**
  The simulation can trigger chaotic request bursts. This risks wasting API quota and makes behavior feel uncontrolled.
  First pass: `BrainClient` now queues LLM decisions and spaces requests out; paused simulation blocks new decision requests.

- [x] **No pause button**
  There is no reliable in-game pause control to stop simulation updates and prevent further API calls.
  First pass: HUD pause button stops resident/anomaly/bunker updates and blocks queued LLM decisions.

- [/] **The bunker feels visually sparse**
  The grid has too much empty space and not enough room dressing, props, clutter, visual storytelling, or mood details.
  First pass: top-down interior props are imported, mapped into the renderer, and deterministic non-blocking room clutter is generated.

- [/] **Characters can get stuck in or ignore textures/obstacles**
  Movement and interaction logic can place residents into blocked or visually occupied spaces, or let them behave as if obstacles do not matter.
  First pass: object movement and interaction now target the nearest reachable adjacent tile instead of blindly pathing into the object's own tile. Decorative clutter no longer blocks movement.

- [ ] **Autonomy logic is underdeveloped**
  Residents do not yet have strong routines, priorities, memory-driven behavior, or believable self-directed plans.

- [ ] **LLM decisions do not reliably control characters**
  The LLM can produce an intended action, but that action is not always translated into valid movement, interaction, or world behavior.
  First pass: LLM movement and interaction targets now resolve through reachable tiles, reducing invalid orders caused by blocked object cells.

## Visual Proportions

- [ ] **Characters are too small relative to decor and environment**
  Residents, anomalies, and the cat Luna appear disproportionately small compared to furniture, walls, and room tiles. The cat in particular reads as oversized next to human characters. Anomalies also appear larger than residents, breaking visual hierarchy.

## Procedural Generation

- [ ] **Room generation has no templates or structured layout**
  The current procedural fill uses a small grid with no predefined room templates. Filling order appears arbitrary, resulting in visually incoherent spaces rather than recognizable room layouts (kitchen, sleeping quarters, lab, etc.).

## Missing Features

- [ ] **No constructor/designer mode**
  There is no way for the user to manually place assets from the asset library into the bunker. A constructor mode should allow selecting assets, placing them on the grid, and rotating them in 90-degree increments.

## Asset Pipeline

- [x] **Third-party asset packs not yet imported**
  Asset packs in `third_party_assets/raw/` — импорт завершён. Добавлено ~100+ новых ассетов: UI элементы (38), двери/окна (30), анимации батов (14+), спрайты NPC (13), кот (2), аудио (7). Пак perplexity-ai-clone пропущен (React компоненты, не подходят).

## Notes

- These are product-level issues, not just implementation bugs.
- Fixes should be vertical: improve one visible behavior from prompt/decision through movement/UI/world feedback.
- Pause, request pacing, and autonomy should come before heavier live-provider testing.
- Proportion and generation fixes depend on completing the asset import pipeline first.

## Feature Requests

- [x] **Per-character provider assignment**
  Currently characters use hardcoded providers (Groq for Red/Doppelganger, Cerebras for Blue/Green/Luna). Need ability to assign custom provider + model per character via config. Custom provider should have higher priority than `LIVING_BUNKER_PROVIDER_MODE=default`.

- [x] **Provider fallback system with retry logic**
  Implement fallback chain: per-character provider → default provider → demo mode.
  - 3 retries with 1/2/4 second delays
  - After 3 failures on per-character provider, switch to default provider
  - If default works, try original provider after 60 seconds
  - If fails again, wait 120 seconds, then 180 seconds
  - After 3 failures on each level, stop retrying and stay on that level
  - Same logic applies when default provider fails → demo mode

- [x] **Demo mode behavior detection**
  When characters are in demo mode, other characters should notice strange behavior and react based on their role (e.g., Red gets paranoid, Blue analyzes, Green dismisses).

- [x] **Token context window limit**
  Implement sliding window for token context to avoid overwhelming models. Default limit: 20000 tokens. Should be configurable via settings.

- [x] **LIVING_BUNKER_DEMO env var UX**
  Current value `0` is confusing. Change to accept `true/false` in addition to `1/0` for better intuitiveness.

- [x] **OpenCode Zen provider support**
  Added `opencode_zen` provider mode with endpoint `https://opencode.ai/zen/v1/chat/completions`. Requires API key.

- [x] **Ollama/LM Studio provider support**
  Added `ollama` provider mode with default endpoint `http://localhost:11434/v1/chat/completions`. No API key required.

## Session 2 Changes (2026-06-12)

- [x] **Demo mode character movement fixed**
  Characters in demo mode were returning static actions (INSPECT, USE, SIT) with fixed targets. If object not found, character stayed in place. Now characters use MOVE random with context-aware decisions based on needs and anomalies.

- [x] **Character talk frequency reduced**
  Characters were too talkative (2% think chance per frame). Reduced to 0.5% base chance with urgent scenarios (anomalies, hunger, fatigue) at 3%. Added random think intervals (3-8 seconds) and social multiplier (1.5x when near other characters).

## TODO Next Session

- [ ] **Brain queue full error**
  Error "Brain queue is full" when too many anomalies/think calls queue up. Need to implement graceful degradation (skip instead of error) and increase queue size or improve processing speed.

- [ ] **Constructor/designer mode**
  No way to manually place assets from asset library into bunker. Need UI for selecting, placing, and rotating assets on grid.

# Known Issues

This file tracks observed gameplay, AI, UX, and visual problems before we start fixing them. Keep it direct: one issue, one clear symptom.

## Current Bugs

- [ ] **Luna loops into constant meowing**
  Luna can repeatedly emit "Meow" reactions too aggressively, creating noise instead of meaningful warning behavior.

- [ ] **Residents lack visible animation and convincing movement**
  Main characters feel static. They do not currently communicate walking, idling, interacting, or emotional state through animation.

- [ ] **Runtime rate limiting is not game-aware**
  The simulation can trigger chaotic request bursts. This risks wasting API quota and makes behavior feel uncontrolled.

- [ ] **No pause button**
  There is no reliable in-game pause control to stop simulation updates and prevent further API calls.

- [ ] **The bunker feels visually sparse**
  The grid has too much empty space and not enough room dressing, props, clutter, visual storytelling, or mood details.

- [ ] **Characters can get stuck in or ignore textures/obstacles**
  Movement and interaction logic can place residents into blocked or visually occupied spaces, or let them behave as if obstacles do not matter.

- [ ] **Autonomy logic is underdeveloped**
  Residents do not yet have strong routines, priorities, memory-driven behavior, or believable self-directed plans.

- [ ] **LLM decisions do not reliably control characters**
  The LLM can produce an intended action, but that action is not always translated into valid movement, interaction, or world behavior.

## Notes

- These are product-level issues, not just implementation bugs.
- Fixes should be vertical: improve one visible behavior from prompt/decision through movement/UI/world feedback.
- Pause, request pacing, and autonomy should come before heavier live-provider testing.

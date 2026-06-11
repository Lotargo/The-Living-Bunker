# Active Sprint

This sprint turns the working map into concrete, finishable work. Keep it small, useful, and a little strange.

## Sprint Goal

Make the bunker easier to extend and demo while preserving the scrappy Flask/Python/TypeScript prototype identity.

## Tasks

- [x] **Define Runtime Contracts**
  Document the request/response/event shapes used by decisions, Architect commands, logs, and world events.

- [x] **Add Frontend BrainClient**
  Move direct `fetch('/api/decide')` and `fetch('/api/architect')` calls behind one small client module.

- [x] **Create Event Path**
  Introduce a simple event shape for thoughts, actions, logs, Architect responses, and world commands.

- [x] **Add Demo Mode**
  Provide no-key mock LLM responses so the project can be launched and shown immediately.

- [x] **Creative Pass: Bunker Moments**
  Add a small set of memorable events: Luna warning patterns, false alarms, room ambience, or anomaly side effects.

## Stretch

- [ ] **Scenario Runner Draft**
  Sketch or implement the first repeatable scenario, such as `first_ghost` or `luna_warning_ignored`.

## Done Means

- The project still builds and tests pass.
- README/docs tell the user how to try the new behavior.
- Each completed task makes the bunker easier to demo, easier to extend, or more alive.

## Notes

- Do not expand this into a giant phase plan.
- Prefer small vertical slices over broad refactors.
- Mark completed work here as soon as it lands.

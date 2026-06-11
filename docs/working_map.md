# Working Map

This is the compact working map for **The Living Bunker**. It is intentionally small: the project should stay weird, playable, and expressive instead of turning into a perfect architecture exercise.

## Direction

Build a living AI bunker from a deliberately lightweight stack: Flask, Python orchestration, TypeScript, Canvas, generated assets, and LLM agents.

The portfolio value is not "enterprise game backend". The value is showing how far a small, scrappy system can go when the simulation has taste, mood, and emergent behavior.

## Current Pillars

1.  **Living Simulation**
    Residents should feel like they have routines, needs, memories, fear, and imperfect interpretations of events.

2.  **Semiotic Experiment**
    Luna remains the core hook: an intelligent observer trapped behind "Meow" as an output channel. The bunker should make that constraint matter.

3.  **Architect Mode**
    The player is not just clicking buttons; they are whispering into the system and watching it mutate the world.

4.  **Prototype Craft**
    Keep Flask/Python. Keep Canvas/TypeScript. Improve structure enough to move fast, but preserve the handmade laboratory feeling.

5.  **Atmosphere**
    More strange events, better logs, stronger visual feedback, and moments that make the bunker feel haunted, funny, or alive.

## Near Work

1.  **Stabilize Contracts**
    Define clear request/response/event shapes for decisions, Architect commands, logs, and world events. This makes REST, WebSocket, tests, and future clients easier without changing the soul of the project.

2.  **Transport Layer**
    Add a small frontend `BrainClient` so `Resident`, `Anomaly`, and the console stop calling `fetch` directly. This prepares the code for WebSocket without forcing it yet.

3.  **Event Bus**
    Route thoughts, actions, logs, Architect commands, and anomaly events through one simple event path. This gives us replay, debugging, and WebSocket broadcasting later.

4.  **Demo Mode**
    Add a no-key offline mode with scripted/mock LLM responses. A portfolio project should be runnable immediately.

5.  **Creative Pass**
    Add more bunker moments: nervous habits, cat warning patterns, false alarms, object reactions, room-specific ambience, and anomaly side effects.

## Later Work

1.  **WebSocket**
    Use it when events are ready. Start with logs and Architect responses, then move agent/world events over it.

2.  **Scenario Runner**
    Create repeatable scenes for testing and demos: "first ghost", "Doppelganger reveal", "mass hysteria", "Luna warning ignored".

3.  **Visual Polish**
    Improve animations, room mood, anomaly effects, camera feel, and UI readability.

4.  **Memory and Culture**
    Let residents form beliefs from repeated events: "Luna staring means danger", "radio static means the lab is unsafe", "Green ignores warnings".

## Non-Goals

1.  **No Rust Rewrite**
    The point is not a canonical game backend. Python and Flask are part of the charm and the portfolio story.

2.  **No Engine Migration Yet**
    Unity, Unreal, Godot, and Rust can stay as future-client ideas, not current distractions.

3.  **No Overgrown Roadmap**
    If the map needs ten phases, it is already losing the project.

## Working Rule

Every technical improvement should either make the bunker easier to extend, easier to demo, or more alive.

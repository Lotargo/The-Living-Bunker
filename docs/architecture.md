# System Architecture

The **Living Bunker** is a hybrid simulation combining a thin Python HTTP backend, an LLM orchestration layer, and a Vanilla JavaScript/TypeScript frontend for visualization and local simulation.

## High-Level Overview

1.  **The "Brain" (Backend - Python):**
    *   **Role:** Handles high-level decision making for agents.
    *   **LLM Integration:** Connects to Groq (Llama 3.1 8b/70b) and Cerebras (Llama 3.3 70b) APIs.
    *   **Context Management:** Constructs prompt payloads containing World State, Agent Needs, and Nearby Entities.
    *   **HTTP Adapter:** `app.py` owns Flask route parsing, rate limiting, static files, and JSON responses.
    *   **Orchestration:** `bunker/ai_orchestrator.py` owns prompt construction, model/provider selection, LLM fallback behavior, and Architect command mutation.
    *   **Endpoints:**
        *   `/api/decide`: Receives agent/anomaly state, returns JSON thought/action.
        *   `/api/architect`: Receives user narrative input, returns narrative response and world commands.

2.  **The "Reflexes" (Frontend - JS/HTML5):**
    *   **Role:** Handles real-time simulation, pathfinding, movement, and rendering.
    *   **Game Loop:** Runs at ~60 FPS.
    *   **State Management:**
        *   `World`: Stores map data, objects, residents, and anomalies.
        *   `Resident`: Handles individual stats (Health, Hunger, etc.) and action queues.
        *   `AnomalyManager`: Spawns and updates anomalies.
    *   **Assets:** Isometric sprites loaded from `static/assets/`.

## Asset Generation (`scripts/generate_assets.py`)

*   **Procedural Generation:** Uses the `Pillow` library to draw pixel-art style assets programmatically.
*   **Techniques:**
    *   **Noise Injection:** Adds texture to solid colors.
    *   **Isometric Projection:** Draws polygons to simulate depth (walls, floor tiles).
    *   **Composition:** Assembles complex objects (e.g., computers, beds) from primitive shapes.

## Data Flow

1.  **Frontend Tick:**
    *   Resident decides it needs to think (based on random chance or needs).
    *   Frontend sends `POST /api/decide` with current context (Nearby objects, visible anomalies, atmosphere).
2.  **Backend Processing:**
    *   `app.py` validates the request body and delegates to `bunker/ai_orchestrator.py`.
    *   `bunker/ai_orchestrator.py` selects the appropriate Persona and LLM Provider.
    *   Constructs a system prompt (e.g., "You are Luna the cat...") and user prompt.
    *   Calls LLM API.
    *   Parses JSON response (`thought`, `action`, `target`).
3.  **Action Execution:**
    *   Frontend receives action.
    *   Resident enters queue (e.g., `MOVE -> INTERACT`).
    *   State updates (Health decreases, Hunger increases, etc.).

## Key Technologies

*   **Flask:** Lightweight web server.
*   **TypeScript:** Source language for the browser simulation, bundled with `tsc --outFile`.
*   **Playwright:** Used for automated verification and scenario testing.
*   **Custom A\* Pathfinding:** Grid movement implementation in `static/ts/pathfinding.ts`.
*   **Canvas API:** Rendering the isometric world.

## Runtime Contracts

The current request, response, command, and event shapes are documented in [Runtime Contracts](contracts.md). These contracts are the working boundary between the browser simulation, Flask routes, Python LLM orchestration, demo mode, and future realtime transport.

## Realtime Backend Direction

The current REST API is enough for a prototype, but a game-shaped architecture should move toward a realtime event protocol.

1.  **Stabilize contracts:** Treat `DecisionRequest`, `DecisionResponse`, `ArchitectRequest`, `ArchitectResponse`, and world commands as versioned messages. This keeps the prototype easy to test, demo, and connect to alternate clients later.
2.  **Add WebSocket transport:** Keep REST endpoints for simple calls, then add a `/ws` channel for events such as `world.command`, `agent.thought`, `agent.action`, `log.entry`, and `architect.response`.
3.  **Introduce a server event bus:** Route Architect output and LLM decisions through an internal event queue before they reach the browser. This makes WebSocket broadcasting natural and avoids coupling UI code directly to HTTP responses.
4.  **Move authoritative state gradually:** The browser can keep rendering and local animation, while the backend increasingly owns canonical world events and validation.
5.  **Keep the Flask lab:** The goal is a charming, inspectable prototype stack, not a canonical game backend rewrite.

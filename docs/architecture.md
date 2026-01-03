# System Architecture

The **Living Bunker** is a hybrid simulation combining a Python Flask backend for logic/intelligence and a Vanilla JavaScript frontend for visualization.

## High-Level Overview

1.  **The "Brain" (Backend - Python/Flask):**
    *   **Role:** Handles high-level decision making for agents.
    *   **LLM Integration:** Connects to Groq (Llama 3.1 8b/70b) and Cerebras (Llama 3.3 70b) APIs.
    *   **Context Management:** Constructs prompt payloads containing World State, Agent Needs, and Nearby Entities.
    *   **Endpoints:**
        *   `/api/decide`: Receives agent state, returns JSON thought/action.

2.  **The "Reflexes" (Frontend - JS/HTML5):**
    *   **Role:** Handles real-time simulation, pathfinding, movement, and rendering.
    *   **Game Loop:** Runs at ~60 FPS.
    *   **State Management:**
        *   `World`: Stores map data, objects, residents, and anomalies.
        *   `Resident`: Handles individual stats (Health, Hunger, etc.) and action queues.
        *   `AnomalyManager`: Spawns and updates anomalies.
    *   **Assets:** Isometric sprites loaded from `static/assets/`.

## Asset Generation (`generate_assets.py`)

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
    *   `app.py` selects the appropriate Persona and LLM Provider.
    *   Constructs a system prompt (e.g., "You are Luna the cat...") and user prompt.
    *   Calls LLM API.
    *   Parses JSON response (`thought`, `action`, `target`).
3.  **Action Execution:**
    *   Frontend receives action.
    *   Resident enters queue (e.g., `MOVE -> INTERACT`).
    *   State updates (Health decreases, Hunger increases, etc.).

## Key Technologies

*   **Flask:** Lightweight web server.
*   **Playwright:** Used for automated verification and scenario testing.
*   **Pathfinding.js:** A* algorithm for grid movement (custom implementation in `pathfinding.js`).
*   **Canvas API:** Rendering the isometric world.

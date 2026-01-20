# Technical Roadmap: Migration to Godot

This document outlines the recommended steps to rebuild "The Living Bunker" using the Godot Engine, preserving the core logic of the original prototype.

## Phase 1: The Foundation
*   **Grid System:** Implement an isometric `TileMap` in Godot.
    *   *Goal:* Render a 64x64 grid of floor/wall tiles.
*   **Agent Controller:** Create a `CharacterBody2D` scene for Residents.
    *   *Goal:* Click-to-move pathfinding (AStar2D) on the grid.
*   **Camera:** setup an `IsometricCamera` with zoom and pan controls.

## Phase 2: The Brain Connection
*   **Backend API:** Decide whether to keep the Python Flask backend (recommended for easy LLM logic) or port logic to Godot.
    *   *Recommendation:* Keep Flask for "The Brain", use Godot for "The Body".
*   **HTTP Requests:** Implement a `HTTPRequest` node in Godot to communicate with the backend.
    *   `POST /api/decide` -> Sends Agent State.
    *   Receive JSON -> Queue Actions.

## Phase 3: Simulation Loop
*   **Stats Manager:** Create a GDScript class `ResidentStats` to track Hunger, Health, etc.
*   **Interaction System:** Define interactable objects (`Area2D`).
    *   *Logic:* When Agent enters Area -> "I see a Fridge".
*   **Task Queue:** Implement a queue system so agents can chain actions (Move -> Wait -> Animate).

## Phase 4: The Architect & Anomalies
*   **Console UI:** Build a UI panel with a `LineEdit` for user input.
*   **Anomaly Manager:** Create a system to spawn "Invisible" scenes (for Gestating anomalies) and toggle their visibility based on the Observer (Player vs. Luna).
*   **Visuals:** Port the procedural generation concepts into Godot Shaders or generate textures on startup using `Image` class.

## Phase 5: Polish & AI Tuning
*   **Prompt Tuning:** Refine the LLM prompts to work well with the new Godot state structure.
*   **VFX:** Add shaders for the "Glitch" and "Ghost" transparency.

# Gameplay Mechanics

## Resident Systems

The agents are driven by a set of survival and psychological stats. These values decay over time and drive the "Needs" logic in the AI brain.

### Stats
*   **Health (HP):** Physical wellbeing. Reduced by Doppelgänger attacks or starvation.
*   **Hunger:** Increases over time. High hunger triggers "Eat" desire.
*   **Energy:** Decreases over time. Low energy triggers "Sleep" desire.
*   **Fun:** Mental stability. Increases via interaction with electronics/games. Low fun leads to "Depression" or erratic behavior.
*   **Hygiene:** Decreases over time. Low hygiene can cause social friction (agents refusing to interact).

### Interaction Loop
1.  **Perception:** Agent scans the grid for objects (Fridge, Bed, Computer) and entities (Other Agents, Anomalies).
2.  **Decision:** AI evaluates current Stats vs. Environment.
    *   *Example:* "I am hungry (Hunger > 80), and there is a Fridge nearby. Action: INTERACT(Fridge)."
3.  **Action:** Agent moves to the target tile and plays an animation. Stats update upon completion.

## The Anomaly System

The Bunker is haunted. Threats obey a strict lifecycle that allows for player observation and agent deduction.

### Lifecycle
1.  **GESTATING (Hidden Phase):**
    *   **Visibility:** Invisible to Humans. Visible to Luna (Cat).
    *   **Atmosphere:** Subtle signs appear (e.g., Temperature drops, Static noise on UI).
    *   **Logic:** The anomaly exists in the data but does not render a sprite for humans.
2.  **ACTIVE (Manifested Phase):**
    *   **Visibility:** Visible to everyone.
    *   **Interaction:** Can actively harm residents or debuff stats.

### Anomaly Types
1.  **Ghost:**
    *   *Effect:* Creates "Cold Spots" (freezing atmosphere). Lowers Energy/Fun of nearby agents.
    *   *Visual:* Semi-transparent, floating blue figure.
2.  **Glitch:**
    *   *Effect:* Corrupts reality. Teleports agents randomly. Speaks in code.
    *   *Visual:* Block of RGB noise.
3.  **Doppelgänger (The Predator):**
    *   *Mimicry:* Spawns looking exactly like **Luna**.
    *   *Behavior:* Lures humans. If the *Real* Luna gets close, the Doppelgänger destabilizes and is destroyed (The "Matter Anti-Matter" rule).
    *   *Danger:* If a human interacts with it while it is "Aggressive" (Red Eyes), they take significant Health damage.

## The Architect's Interface (God Console)

The player interacts via natural language commands that map to specific backend logic.

### Command Intent
The system parses natural language into three core intents:
1.  **SPAWN:** Summon an entity at a location.
    *   *"Spawn a ghost in the kitchen."*
2.  **ATMOSPHERE:** Change the global weather/vibe of the bunker.
    *   *"Make the room cold."* (Sets `Atmosphere = Cold Draft`)
3.  **WHISPER:** Inject text directly into an agent's context window (simulating schizophrenia or telepathy).
    *   *"Tell Blue that Red is plotting against him."*

### The Mutation System (Combo System)
Simple commands have predictable results. **Combinations** trigger "Mutations" — upgraded events.

*   **Formula:** `Entity Spawn` + `Atmosphere Change` = `Mutation Event`
*   **Example:**
    *   Command: *"Spawn a ghost and lower the temperature to freezing."*
    *   Logic: `Spawn(Ghost)` + `Atmosphere(Cold)`
    *   Result: **POLTERGEIST** (Aggressive ghost that throws objects).
*   **Mass Hysteria:** `Whisper(All)` + `Atmosphere(Static)` -> Causes all agents to congregate in one room in panic.

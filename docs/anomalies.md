# Anomalies & Atmosphere

The simulation features a dynamic threat system where reality distorts randomly.

## Lifecycle

1.  **GESTATING (Invisible Phase):**
    *   The anomaly has spawned but is invisible to human residents.
    *   **Detection:** Only **Luna (The Cat)** can see/sense these.
    *   **Atmosphere:** The environment may generate precursors like "Cold Draft" or "Heavy Static".
    *   *Duration:* ~200-500 ticks.

2.  **ACTIVE (Manifested Phase):**
    *   The anomaly becomes visible.
    *   It interacts with the world and residents.
    *   *Duration:* ~500-1000 ticks.

## Anomaly Types

### 1. Ghost
*   **Sprite:** Semi-transparent, blueish wobbly figure.
*   **Behavior:** Wanders aimlessly, often melancholy.
*   **Vibe:** Creates "Cold Spots".

### 2. Glitch
*   **Sprite:** Static noise block (`glitch.png`).
*   **Behavior:** Teleports randomly ("glitches"), speaks in code fragments.
*   **Vibe:** Causes "Static" atmosphere.

### 3. Doppelgänger (The Horror Element)
*   **Sprite:** Initially mimics **Luna** (`cat_luna.png`).
*   **Behavior:**
    *   **Deception:** Acts like a cat to lure humans.
    *   **Aggression:** Can reveal true form (`cat_evil.png` - Red Eyes).
    *   **Damage:** Emits psychic damage reducing Resident Health.
*   **Weakness:** The Real Luna.
    *   If the Doppelgänger comes within close range of the real Luna, it destabilizes and is destroyed ("SCREEECH! Dissolves upon meeting original").
    *   This makes Luna not just a pet, but a **Guardian**.

## Atmosphere System
The world state tracks an global "Atmosphere" variable.
*   **Normal:** No active threats.
*   **Cold Draft:** Suggests a Ghost is gestating.
*   **Heavy Static:** Suggests a Glitch or high anomaly activity.
*   **Oppressive:** Presence of Doppelgänger.

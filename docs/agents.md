# Agents & Personas

The simulation features autonomous agents driven by LLMs. Each has a unique personality, model configuration, and role.

## Residents

### 1. Red (The Survivalist)
*   **Role:** Paranoid, security-focused, energetic.
*   **Model:** Groq (`llama-3.1-8b-instant`).
*   **Behavior:** Reacts strongly to anomalies, maintains high energy, often inspects walls/doors.
*   **Prompt Key:** "Pay close attention to Luna... if she acts weird, something is wrong."

### 2. Blue (The Scientist)
*   **Role:** Analytical, calm, obsessed with data.
*   **Model:** Cerebras (`llama-3.3-70b`).
*   **Behavior:** Investigates anomalies rather than fleeing. Uses the computer frequently.
*   **Prompt Key:** "Trust Luna the cat's senses more than your own eyes."

### 3. Green (The Slacker)
*   **Role:** Relaxed, skeptical, lazy.
*   **Model:** Cerebras (`llama3.1-8b`).
*   **Behavior:** Dismisses anomalies as hallucinations. Prioritizes sleep and food.

## Luna (The Cat)

Luna is a unique "Semiotic Alien" agent designed to test the limits of LLM expression and non-verbal communication.

*   **Role:** Sentient observer, anomaly detector.
*   **Model:** Cerebras (`llama-3.3-70b`).
*   **Special Ability:** **True Sight**. Luna can see `GESTATING` (invisible) anomalies.
*   **Constraint: The "Meow" Protocol:**
    *   Luna **cannot** speak human languages in the `thought` field displayed to UI.
    *   She must encode complex internal states (fear, curiosity, warning) into variations of "Meow".
    *   *Examples:*
        *   `"Meow..."` (Observing unseen threat)
        *   `"MEOW!"` (Active Danger)
        *   `"Prrrt?"` (Confusion)

### Human-Cat Interaction
The simulation relies on a secondary layer of culture forming among the agents:
*   Humans do not receive direct warnings.
*   They must observe Luna's behavior (Staring at nothing, Hissing) to deduce the presence of danger.
*   Over time, agents may develop "superstitions" based on Luna's actions.

## Stats System
All residents track:
*   **Health:** Decreased by Doppelgänger attacks. (Green Bar)
*   **Hunger:** Increases over time. (Red Bar)
*   **Energy:** Decreases over time. (Yellow Bar)
*   **Fun:** Decreases over time. (Blue Bar)
*   **Hygiene:** Decreases over time. (Green Bar)

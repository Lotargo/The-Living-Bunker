# AI Architecture: The Brain & The Reflexes

The project uses a hybrid architecture to balance high-level intelligence with real-time performance. We separate the "Thinking" (LLM) from the "Doing" (Game Engine).

## 1. The Separation of Concerns

### The Brain (Backend / LLM)
*   **Responsibility:** High-level decision making, natural language understanding, social simulation.
*   **Frequency:** On-demand (e.g., when an agent finishes a task or an event occurs).
*   **Input:** World State JSON (Nearby objects, stats, recent memories, chat history).
*   **Output:** Structured JSON (`thought`, `action`, `target`).

### The Reflexes (Game Engine - Godot/JS)
*   **Responsibility:** Pathfinding, Animation, Physics, State Management (Stat decay).
*   **Frequency:** Real-time (60 FPS).
*   **Input:** JSON command from The Brain.
*   **Output:** Visual execution (Moving the sprite, playing sound).

## 2. The Persona System

Each agent runs on a distinct system prompt defining their personality and biases.

### Resident Personas
*   **Red (The Survivalist):**
    *   *Traits:* Paranoid, High Energy, Security-focused.
    *   *Bias:* Prioritizes "Patrol" and "Fix" actions. Suspicious of anomalies.
*   **Blue (The Scientist):**
    *   *Traits:* Analytical, Cold, Data-driven.
    *   *Bias:* Prioritizes "Inspect" and "Computer" actions. Curious about anomalies.
*   **Green (The Slacker):**
    *   *Traits:* Lazy, Skeptical, Hedonistic.
    *   *Bias:* Prioritizes "Sleep", "Eat", "Relax". Dismisses anomalies as hallucinations.

### The Luna Protocol (The Cat)
Luna is a special agent designed to test non-verbal LLM performance.
*   **Constraint:** Her `thought` output **must** be variations of "Meow" (e.g., "Meow.", "Hiss!", "Mrrpp?").
*   **True Sight:** Her prompt receives data about *Invisible* (Gestating) anomalies that humans do not see.
*   **Logic:** She must convey the danger level through her "Meow" intensity and movement (e.g., running away vs. investigating).

## 3. The Decision Loop

When an agent needs to decide what to do:

1.  **Context Assembly:** The Game Engine gathers data:
    ```json
    {
      "agent": "Red",
      "stats": {"hunger": 80, "health": 100},
      "nearby": ["Fridge", "Blue", "Ghost"],
      "memories": ["Blue acted weird earlier"]
    }
    ```
2.  **LLM Inference:** This payload is sent to the LLM Provider (Groq/Cerebras).
3.  **Prompt Engineering:** The backend wraps this in a prompt: *"You are Red. Your hunger is high. You see a Ghost. What do you do?"*
4.  **JSON Response:** The LLM returns:
    ```json
    {
      "thought": "I'm starving, but that ghost is blocking the fridge! I need to lure it away.",
      "action": "INTERACT",
      "target": "Radio"
    }
    ```
5.  **Execution:** The Game Engine parses this. Red walks to the Radio and turns it on.

## 4. Technical Considerations for Migration
*   **Latency:** LLM calls take 1-3 seconds. The Game Engine must handle "Thinking" states (e.g., show a thinking bubble) without freezing the game loop.
*   **Fallbacks:** If the API fails, agents should fall back to a simple rule-based behavior (e.g., Random Walk) to prevent crashes.

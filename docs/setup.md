# Setup & Installation

## Prerequisites

*   **Python 3.10+**
*   **API Keys (optional for demo mode):**
    *   **Groq API Key**: For fast, efficient inference (Red, Green, Doppelgänger).
    *   **Cerebras API Key**: For high-speed, high-intelligence inference (Blue, Luna).

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_name>
    ```

2.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Dependencies include `Flask`, `requests`, `Pillow`.*

3.  **Environment Variables:**
    Set your API keys for live LLM behavior. You can export them in your shell or create a `.env` file.

    ```bash
    export GROQ_API_KEY="your_groq_key_here"
    export CEREBRAS_API_KEY="your_cerebras_key_here"
    ```

    To run without API keys, enable demo mode:

    ```bash
    export LIVING_BUNKER_DEMO=1
    ```

4.  **Generate Assets:**
    The game uses procedurally generated 16-bit isometric assets. Run the generator script before starting the server.

    ```bash
    python generate_assets.py
    ```
    *This creates `static/assets/` populated with furniture, characters, and anomaly sprites.*

## Running the Simulation

### Launcher

For the easiest local check, run:

```bash
python launch.py
```

On Windows you can also double-click or run:

```bash
launch.bat
```

The launcher checks dependencies, builds TypeScript, generates missing assets, starts Flask, opens `http://127.0.0.1:5000`, and enables demo mode automatically when no API keys are present.

### Manual

1.  **Start the Server:**
    ```bash
    python app.py
    ```

2.  **Access the Interface:**
    Open your web browser and navigate to:
    `http://localhost:5000`

## Main Menu & Settings

The main menu provides:

*   **Начать новую игру:** resets the bunker simulation and starts a fresh run.
*   **Продолжить:** resumes the current browser session when a run was started before.
*   **Настройки:** opens runtime settings.

Settings include:

*   **Provider:** default Groq/Cerebras environment keys, demo mode, or OpenAI-compatible provider.
*   **OpenAI-compatible URL:** a `/v1/chat/completions` endpoint such as `https://api.openai.com/v1/chat/completions`.
*   **API key:** runtime key for the selected OpenAI-compatible provider.
*   **Model:** model name sent to the compatible provider.
*   **Anomaly spawn rate:** local simulation tuning for anomaly frequency.

The console also supports local demo scenarios:

```txt
/scenario first_ghost
/scenario luna_warning_ignored
```

## Troubleshooting

*   **Missing Assets:** If images are broken, ensure `generate_assets.py` ran successfully.
*   **API Errors:** Check `server.log` or console output. Ensure API keys are valid and you are not rate-limited, or use `LIVING_BUNKER_DEMO=1`.
*   **UI Glitches:** Clear browser cache if asset generation changed sprites significantly.

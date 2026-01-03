# Setup & Installation

## Prerequisites

*   **Python 3.10+**
*   **API Keys:**
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
    Set your API keys. You can export them in your shell or create a `.env` file (if you add `python-dotenv`).

    ```bash
    export GROQ_API_KEY="your_groq_key_here"
    export CEREBRAS_API_KEY="your_cerebras_key_here"
    ```

4.  **Generate Assets:**
    The game uses procedurally generated 16-bit isometric assets. Run the generator script before starting the server.

    ```bash
    python generate_assets.py
    ```
    *This creates `static/assets/` populated with furniture, characters, and anomaly sprites.*

## Running the Simulation

1.  **Start the Server:**
    ```bash
    python app.py
    ```

2.  **Access the Interface:**
    Open your web browser and navigate to:
    `http://localhost:5000`

## Troubleshooting

*   **Missing Assets:** If images are broken, ensure `generate_assets.py` ran successfully.
*   **API Errors:** Check `server.log` or console output. Ensure API keys are valid and you are not rate-limited.
*   **UI Glitches:** Clear browser cache if asset generation changed sprites significantly.

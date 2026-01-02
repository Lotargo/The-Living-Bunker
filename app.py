from flask import Flask, request, jsonify, send_from_directory
import os
import requests
import json
import random

app = Flask(__name__, static_url_path='', static_folder='static')

# Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
CEREBRAS_API_KEY = os.environ.get("CEREBRAS_API_KEY")

# Persona Definitions
PERSONAS = {
    "Red": {
        "role": "You are 'Red', a survivalist in a post-apocalyptic bunker. You are paranoid, energetic, and focused on gathering resources and security.",
        "provider": "groq",
        "model": "llama-3.1-8b-instant"
    },
    "Blue": {
        "role": "You are 'Blue', a scientist. You are calm, analytical, and obsessed with understanding the bunker's technology. You speak in a slightly robotic or formal tone.",
        "provider": "cerebras",
        "model": "llama3.1-8b"
    },
    "Green": {
        "role": "You are 'Green', a slacker. You just want to sleep, eat, and do as little as possible. You are friendly but lazy.",
        "provider": "groq",
        "model": "llama-3.1-8b-instant"
    }
}

SYSTEM_INSTRUCTION = """
You are controlling a character in a simulation.
Current State: {state}
Nearby Objects: {objects}
Needs: {needs}

Decide your next action. You MUST respond in valid JSON format ONLY.
Format:
{{
  "thought": "Short internal monologue explaining why you are doing this.",
  "action": "ACTION_NAME",
  "target": "TARGET_ID_OR_COORDS"
}}

Available Actions:
- MOVE: Go to a location or object. Target: Object Name or 'random'.
- USE: Interact with an object. Target: Object Name.
- IDLE: Do nothing. Target: 'self'.
- SLEEP: Sleep in a bed. Target: 'Bed'.
- EAT: Eat food. Target: 'Fridge'.

Keep thoughts short. Prioritize high needs (Hunger > 70, Energy < 30).
"""

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/decide', methods=['POST'])
def decide():
    data = request.json
    bot_name = data.get('name')
    state = data.get('state') # e.g., "Idle", "Moving"
    nearby = data.get('nearby') # List of objects
    needs = data.get('needs') # { hunger: 50, energy: 50 }

    if bot_name not in PERSONAS:
        return jsonify({"error": "Unknown bot"}), 400

    persona = PERSONAS[bot_name]

    prompt = SYSTEM_INSTRUCTION.format(
        state=state,
        objects=json.dumps(nearby),
        needs=json.dumps(needs)
    )

    messages = [
        {"role": "system", "content": persona['role']},
        {"role": "user", "content": prompt}
    ]

    response_data = {}

    try:
        if persona['provider'] == 'groq':
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": persona['model'],
                    "messages": messages,
                    "response_format": {"type": "json_object"}
                }
            )
            resp_json = resp.json()
            content = resp_json['choices'][0]['message']['content']
            response_data = json.loads(content)

        elif persona['provider'] == 'cerebras':
            resp = requests.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {CEREBRAS_API_KEY}"},
                json={
                    "model": persona['model'],
                    "messages": messages,
                    "response_format": {"type": "json_object"}
                }
            )
            resp_json = resp.json()
            content = resp_json['choices'][0]['message']['content']
            response_data = json.loads(content)

    except Exception as e:
        print(f"LLM Error: {e}")
        # Fallback
        response_data = {
            "thought": "My brain hurts... I'll just stand here.",
            "action": "IDLE",
            "target": "self"
        }

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

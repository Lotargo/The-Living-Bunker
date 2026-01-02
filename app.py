from flask import Flask, request, jsonify, send_from_directory
import os
import requests
import json
import random

app = Flask(__name__, static_url_path='', static_folder='static')

# Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
CEREBRAS_API_KEY = os.environ.get("CEREBRAS_API_KEY")

# Persona Definitions - UPDATED with unique models
PERSONAS = {
    "Red": {
        "role": "You are 'Red', a survivalist. You are paranoid, energetic, and focused on security.",
        "provider": "groq",
        "model": "llama-3.1-8b-instant"
    },
    "Blue": {
        "role": "You are 'Blue', a scientist. You are calm, analytical, and obsessed with technology.",
        "provider": "cerebras",
        "model": "llama3.1-8b"
    },
    "Green": {
        "role": "You are 'Green', a slacker. You like to relax, sit on the sofa, and listen to the radio.",
        "provider": "groq",
        "model": "llama-3.3-70b-versatile" # Using a different model for variety
    }
}

SYSTEM_INSTRUCTION = """
You are controlling a character in a 'Living Bunker' simulation.
Current State: {state}
Nearby Objects: {objects}
Needs: {needs}

Decide your next action. You MUST respond in valid JSON format ONLY.
Format:
{{
  "thought": "Short internal monologue (max 1 sentence).",
  "action": "ACTION_NAME",
  "target": "TARGET_ID"
}}

Available Actions:
- MOVE: Go to a location. Target: Object ID or 'random'.
- USE: Use an item (Fridge to eat, Bed to sleep).
- SIT: Sit on a Chair or Sofa (Restores Energy/Social). Target: Chair/Sofa ID.
- PLAY: Use Computer (Fun). Target: Computer ID.
- LISTEN: Listen to Radio (Fun). Target: Radio ID.
- IDLE: Do nothing. Target: 'self'.

Priorities:
1. Survival: Hunger > 70 or Energy < 20.
2. Comfort: Sit or Sleep if Energy < 50.
3. Fun: Play or Listen if bored.
"""

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/decide', methods=['POST'])
def decide():
    data = request.json
    bot_name = data.get('name')
    state = data.get('state')
    nearby = data.get('nearby')
    needs = data.get('needs')

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
                    "response_format": {"type": "json_object"},
                    "temperature": 0.7
                }
            )
            resp_json = resp.json()
            if 'choices' in resp_json:
                content = resp_json['choices'][0]['message']['content']
                response_data = json.loads(content)
            else:
                print("Groq Error Payload:", resp_json)
                raise Exception("Invalid Groq Response")

        elif persona['provider'] == 'cerebras':
            resp = requests.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {CEREBRAS_API_KEY}"},
                json={
                    "model": persona['model'],
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": 0.7
                }
            )
            resp_json = resp.json()
            if 'choices' in resp_json:
                content = resp_json['choices'][0]['message']['content']
                response_data = json.loads(content)
            else:
                print("Cerebras Error Payload:", resp_json)
                raise Exception("Invalid Cerebras Response")

    except Exception as e:
        print(f"LLM Error ({bot_name}): {e}")
        # Intelligent Fallback
        response_data = {
            "thought": "I feel disconnected... I'll just wait.",
            "action": "IDLE",
            "target": "self"
        }

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

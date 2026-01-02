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
        "role": "You are 'Red', a survivalist. You are paranoid, energetic, and focused on security. You react strongly to anomalies.",
        "provider": "groq",
        "model": "llama-3.1-8b-instant"
    },
    "Blue": {
        "role": "You are 'Blue', a scientist. You are calm, analytical, and obsessed with technology. You try to study anomalies.",
        "provider": "cerebras",
        "model": "llama3.1-8b"
    },
    "Green": {
        "role": "You are 'Green', a slacker. You like to relax. You think anomalies are hallucinations or 'glitches in the matrix'.",
        "provider": "groq",
        "model": "llama-3.3-70b-versatile"
    }
}

# Anomaly System Prompts
ANOMALY_PROMPTS = {
    "Ghost": "You are a Ghost. You are a lost soul trapped in this bunker. You exist for only a short time. You want to communicate something cryptic before you fade. You are melancholy or angry.",
    "Glitch": "You are a Reality Glitch. You are a bug in the simulation. You speak in code fragments or broken sentences. You want to disrupt order.",
    "Poltergeist": "You are a Poltergeist possessed object. You are chaotic and mischievous. You want to trick residents."
}

SYSTEM_INSTRUCTION = """
You are controlling a character in a 'Living Bunker' simulation.
Current State: {state}
Nearby Objects: {objects}
Nearby Anomalies: {anomalies}
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
- USE: Use an item (Fridge, Bed, Toilet, Shower, Stove, TV).
- SIT: Sit on a Chair or Sofa.
- PLAY: Use Computer.
- LISTEN: Listen to Radio.
- IDLE: Do nothing. Target: 'self'.

Priorities:
1. Survival: Hunger > 70 or Energy < 20.
2. React to Anomalies: If you see a Ghost or Glitch, you might investigate or flee depending on your personality.
3. Comfort/Fun.
"""

ANOMALY_INSTRUCTION = """
You are an Anomaly in the bunker.
Type: {type}
Lifespan Remaining: {lifespan} ticks.
Goal: {goal}
Nearby Residents: {residents}

Decide your action. JSON Only.
Format:
{{
  "thought": "Cryptic thought.",
  "action": "ACTION_NAME",
  "target": "TARGET_ID"
}}

Actions:
- HAUNT: Move towards a resident or object.
- SPOOK: Do something scary/weird near a target.
- GLITCH: Teleport or act erratic.
- IDLE: Fade/Wait.
"""

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/decide', methods=['POST'])
def decide():
    data = request.json
    bot_name = data.get('name')
    bot_type = data.get('type', 'resident') # resident or anomaly

    if bot_type == 'resident':
        if bot_name not in PERSONAS:
            return jsonify({"error": "Unknown bot"}), 400
        persona = PERSONAS[bot_name]
        prompt = SYSTEM_INSTRUCTION.format(
            state=data.get('state'),
            objects=json.dumps(data.get('nearby')),
            anomalies=json.dumps(data.get('anomalies', [])),
            needs=json.dumps(data.get('needs'))
        )
        sys_role = persona['role']
        provider = persona['provider']
        model = persona['model']

    elif bot_type == 'anomaly':
        a_type = data.get('anomalyType')
        prompt = ANOMALY_INSTRUCTION.format(
            type=a_type,
            lifespan=data.get('lifespan'),
            goal=data.get('goal', 'Exist'),
            residents=json.dumps(data.get('nearbyResidents', []))
        )
        sys_role = ANOMALY_PROMPTS.get(a_type, "You are an anomaly.")
        # Use Groq for fast anomalies
        provider = 'groq'
        model = 'llama-3.1-8b-instant'
    else:
        return jsonify({"error": "Invalid type"}), 400

    messages = [
        {"role": "system", "content": sys_role},
        {"role": "user", "content": prompt}
    ]

    response_data = {}

    try:
        # Provider Logic
        if provider == 'groq':
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": model,
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": 0.8 # Higher temp for chaos
                }
            )
            resp_json = resp.json()
            if 'choices' in resp_json:
                content = resp_json['choices'][0]['message']['content']
                response_data = json.loads(content)
            else:
                print("Groq Error Payload:", resp_json)
                raise Exception("Invalid Groq Response")

        elif provider == 'cerebras':
            resp = requests.post(
                "https://api.cerebras.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {CEREBRAS_API_KEY}"},
                json={
                    "model": model,
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
        response_data = {
            "thought": "...",
            "action": "IDLE",
            "target": "self"
        }

    return jsonify(response_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

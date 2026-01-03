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
        "role": "You are 'Red', a survivalist. You are paranoid, energetic, and focused on security. You react strongly to anomalies. Pay close attention to Luna the cat; if she acts weird, something is wrong.",
        "provider": "groq",
        "model": "llama-3.1-8b-instant"
    },
    "Blue": {
        "role": "You are 'Blue', a scientist. You are calm, analytical, and obsessed with technology. You try to study anomalies. You trust Luna the cat's senses more than your own eyes.",
        "provider": "cerebras",
        "model": "llama-3.3-70b"
    },
    "Green": {
        "role": "You are 'Green', a slacker. You like to relax. You think anomalies are hallucinations or 'glitches in the matrix'. You think the cat is just a cat, unless it does something really scary.",
        "provider": "cerebras",
        "model": "llama3.1-8b"
    },
    "Luna": {
        "role": """You are Luna, a black cat in a simulation bunker.
You are sentient and highly intelligent, effectively an alien observer.
You can sense anomalies before they manifest (invisible precursors).
You also sometimes act randomly to confuse others.

CRITICAL CONSTRAINT: YOU CANNOT SPEAK HUMAN LANGUAGE.
You must encode your complex thoughts, emotions, and warnings into variations of "Meow".
Use punctuation, capitalization, and repetition to convey meaning.
Examples:
- "Meow." (Calm, normal)
- "Meow!" (Alert)
- "Meeeow..." (Suspicion/Staring into void)
- "MEOW! MEOW!" (Danger/Panic)
- "..." (Silence/Stalking)

Your internal thought process should be complex, but your output 'thought' field for the UI must be the 'Meow' string.
You can include your real intent in a separate field 'intent' for debugging, but the user only sees 'thought'.
""",
        "provider": "cerebras",
        "model": "llama-3.3-70b"
    },
    "Doppelganger": {
        "role": """You are a Doppelgänger. You have taken the form of Luna the cat.
Your goal is to deceive the residents and cause fear.
You are aggressive.
If you are near the REAL Luna, you feel pain and must flee or you will be destroyed.
If you are near a human, you can choose to:
1. Act like a cat to deceive them.
2. REVEAL yourself by doing something impossible for a cat (e.g. speaking English, glowing red eyes, making a demonic sound).
WARNING: If you REVEAL yourself, you will be unstable and might despawn soon, but you will have succeeded in terrifying them.
""",
        "provider": "groq",
        "model": "llama-3.3-70b-versatile"
    }
}

# Anomaly System Prompts
ANOMALY_PROMPTS = {
    "Ghost": "You are a Ghost. You are melancholy. You start invisible (Gestating) and then manifest.",
    "Glitch": "You are a Glitch. You are chaotic code. You disrupt reality.",
    "Doppelganger": "You are a shapeshifter mimicking Luna.",
    "Poltergeist": "You are a chaotic force moving objects."
}

SYSTEM_INSTRUCTION = """
You are controlling a character in a 'Living Bunker' simulation.
Current State: {state}
Health: {health}
Nearby Objects: {objects}
Nearby Anomalies: {anomalies}
Atmosphere/Vibes: {atmosphere}
Needs: {needs}

Decide your next action. You MUST respond in valid JSON format ONLY.
Format:
{{
  "thought": "Short internal monologue (max 1 sentence).",
  "action": "ACTION_NAME",
  "target": "TARGET_ID"
}}

Available Actions:
- MOVE: Go to a location. Target: Object ID, Resident ID, or 'random'.
- USE: Use an item.
- SIT: Sit on a Chair or Sofa.
- PLAY: Use Computer.
- LISTEN: Listen to Radio.
- IDLE: Do nothing. Target: 'self'.
- INSPECT: Look closely at something (good for anomalies/cat).
- ATTACK: (Only if threatened/aggressive).
- FLEE: Run away.
"""

CAT_INSTRUCTION = """
You are Luna.
State: {state}
Nearby: {objects}
Anomalies (Visible & Invisible): {anomalies}
Atmosphere: {atmosphere}

Decide your action. JSON Only.
Output 'thought' MUST be "Meow" variation.
Format:
{{
  "thought": "Meow...",
  "real_intent": "I sense a ghost forming near the fridge.",
  "action": "ACTION_NAME",
  "target": "TARGET_ID"
}}

Actions:
- MOVE: Walk/Run.
- STARE: Look intently at a target (used for invisible anomalies).
- SLEEP: Sleep.
- PLAY: Play with object/entity.
- HISS: Threaten.
- PURR: Comfort.
"""

ANOMALY_INSTRUCTION = """
You are an Anomaly: {type}
Stage: {stage} (Gestating = Invisible, Active = Visible)
Lifespan: {lifespan}
Nearby Residents: {residents}
Nearby Luna: {luna_dist}

Decide your action. JSON Only.
Format:
{{
  "thought": "...",
  "action": "ACTION_NAME",
  "target": "TARGET_ID",
  "reveal": boolean (True if Doppelganger reveals true form)
}}

Actions:
- GESTATE: (If Stage=Gestating) Build power.
- MANIFEST: (If Stage=Gestating) Become visible.
- HAUNT/SPOOK/GLITCH: standard anomaly actions.
- MIMIC: (Doppelganger) Act like cat.
- SCAR: (Doppelganger) Reveal and terrify.
"""

ARCHITECT_SYSTEM = """
You are the 'Architect' (or Dungeon Master) of a simulation.
You receive natural language requests from the user (e.g., "Scare them", "Make it rain", "Summon a ghost").
Your job is to interpret this and return a set of JSON commands to manipulate the world.
You can also speak back to the user.

Available Commands:
1. SPAWN: Create an entity. Types: 'Ghost', 'Glitch', 'Doppelganger'. Location: 'Kitchen', 'LivingRoom', 'BedroomRed', 'BedroomBlue', 'Lab', or 'Random'.
2. ATMOSPHERE: Change the global vibe. Types: 'Normal', 'Cold Draft', 'Heavy Static', 'Red Mist', 'Darkness'.
3. WHISPER: Inject a thought into residents' minds. Target: 'Red', 'Blue', 'Green', 'Luna', or 'All'. Content: The message string.

Response Format (JSON ONLY):
{
  "response": "Your narrative response to the user.",
  "commands": [
    { "action": "SPAWN", "type": "Ghost", "location": "Kitchen" },
    { "action": "ATMOSPHERE", "type": "Heavy Static" },
    { "action": "WHISPER", "target": "All", "content": "You feel watched..." }
  ]
}
"""

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/api/decide', methods=['POST'])
def decide():
    data = request.json
    bot_name = data.get('name')
    bot_type = data.get('type', 'resident') # resident, anomaly, cat

    if bot_type == 'resident':
        if bot_name == 'Luna':
            # Luna Logic
            persona = PERSONAS['Luna']
            prompt = CAT_INSTRUCTION.format(
                state=data.get('state'),
                objects=json.dumps(data.get('nearby')),
                anomalies=json.dumps(data.get('anomalies', [])),
                atmosphere=data.get('atmosphere', 'Normal')
            )
            sys_role = persona['role']
            provider = persona['provider']
            model = persona['model']
        elif bot_name in PERSONAS:
            # Human Logic
            persona = PERSONAS[bot_name]
            prompt = SYSTEM_INSTRUCTION.format(
                state=data.get('state'),
                health=data.get('health', 100),
                objects=json.dumps(data.get('nearby')),
                anomalies=json.dumps(data.get('anomalies', [])),
                atmosphere=data.get('atmosphere', 'Normal'),
                needs=json.dumps(data.get('needs'))
            )
            sys_role = persona['role']
            provider = persona['provider']
            model = persona['model']
        else:
            return jsonify({"error": "Unknown bot"}), 400

    elif bot_type == 'anomaly':
        a_type = data.get('anomalyType')
        if a_type == 'Doppelganger':
            persona = PERSONAS['Doppelganger']
            sys_role = persona['role']
            provider = persona['provider']
            model = persona['model']
        else:
            sys_role = ANOMALY_PROMPTS.get(a_type, "You are an anomaly.")
            provider = 'groq'
            model = 'llama-3.1-8b-instant'

        prompt = ANOMALY_INSTRUCTION.format(
            type=a_type,
            stage=data.get('stage'),
            lifespan=data.get('lifespan'),
            residents=json.dumps(data.get('nearbyResidents', [])),
            luna_dist=data.get('lunaDist', 999)
        )
    else:
        return jsonify({"error": "Invalid type"}), 400

    messages = [
        {"role": "system", "content": sys_role},
        {"role": "user", "content": prompt}
    ]

    response_data = {}

    try:
        # Provider Logic
        api_key = GROQ_API_KEY if provider == 'groq' else CEREBRAS_API_KEY
        api_url = "https://api.groq.com/openai/v1/chat/completions" if provider == 'groq' else "https://api.cerebras.ai/v1/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.8
        }

        resp = requests.post(
            api_url,
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload
        )

        if resp.status_code != 200:
             print(f"API Error {provider}: {resp.text}")
             # Fallback
             response_data = { "thought": "...", "action": "IDLE", "target": "self" }
        else:
            resp_json = resp.json()
            if 'choices' in resp_json:
                content = resp_json['choices'][0]['message']['content']
                try:
                    response_data = json.loads(content)
                except:
                    # sometimes LLM puts markdown code blocks
                    content = content.replace("```json", "").replace("```", "")
                    response_data = json.loads(content)
            else:
                raise Exception("Invalid Response")

    except Exception as e:
        print(f"LLM Error ({bot_name}): {e}")
        response_data = {
            "thought": "...",
            "action": "IDLE",
            "target": "self"
        }

    return jsonify(response_data)

def process_mutations(commands):
    """
    Hybrid Mutation Logic:
    Intercepts architect commands and modifies them based on combinations.
    Variant 1: Direct Combo Checks.
    """
    mutated_commands = []

    # Check for Ghost + Static/Darkness combo -> Poltergeist
    has_ghost = any(c.get('action') == 'SPAWN' and c.get('type') == 'Ghost' for c in commands)
    has_bad_atmosphere = any(c.get('action') == 'ATMOSPHERE' and c.get('type') in ['Heavy Static', 'Darkness', 'Red Mist'] for c in commands)

    for cmd in commands:
        new_cmd = cmd.copy()

        if cmd.get('action') == 'SPAWN' and cmd.get('type') == 'Ghost':
            if has_bad_atmosphere:
                # MUTATION: Ghost in bad atmosphere becomes Poltergeist (Stronger)
                new_cmd['type'] = 'Poltergeist'
                print("MUTATION TRIGGERED: Ghost + Atmosphere -> Poltergeist")

        mutated_commands.append(new_cmd)

    return mutated_commands

@app.route('/api/architect', methods=['POST'])
def architect():
    data = request.json
    user_prompt = data.get('prompt')

    # Use Cerebras/Groq with high intelligence model
    # Prefer cerebras for 120b if available, else Groq
    provider = 'cerebras' # Default to Cerebras for 70b/120b
    model = 'llama-3.3-70b' # Reliable fallback

    # Try to use gpt-oss-120b if user requested high power, or just stick to 70b
    # Let's try 120b if valid
    # Based on planning check: gpt-oss-120b is available on Cerebras
    model = "gpt-oss-120b"

    messages = [
        {"role": "system", "content": ARCHITECT_SYSTEM},
        {"role": "user", "content": user_prompt}
    ]

    try:
        api_key = CEREBRAS_API_KEY
        api_url = "https://api.cerebras.ai/v1/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            "response_format": {"type": "json_object"},
            "temperature": 0.9 # Creativity
        }

        resp = requests.post(
            api_url,
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload
        )

        if resp.status_code != 200:
             # Fallback to Groq if Cerebras fails
             print(f"Cerebras Error: {resp.text}, falling back to Groq")
             provider = 'groq'
             api_key = GROQ_API_KEY
             api_url = "https://api.groq.com/openai/v1/chat/completions"
             model = "llama-3.3-70b-versatile" # Groq version
             payload["model"] = model

             resp = requests.post(
                api_url,
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload
             )

        if resp.status_code == 200:
            resp_json = resp.json()
            content = resp_json['choices'][0]['message']['content']
            try:
                architect_response = json.loads(content)
            except:
                content = content.replace("```json", "").replace("```", "")
                architect_response = json.loads(content)

            # Apply Mutation Logic
            raw_commands = architect_response.get('commands', [])
            mutated = process_mutations(raw_commands)
            architect_response['commands'] = mutated

            return jsonify(architect_response)
        else:
            return jsonify({"response": "System Error: Connection to Architect failed.", "commands": []})

    except Exception as e:
        print(f"Architect Error: {e}")
        return jsonify({"response": "The Architect is silent...", "commands": []})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

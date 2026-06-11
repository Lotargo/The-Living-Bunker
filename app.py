from flask import Flask, request, jsonify, send_from_directory
import json
import os

from config import (
    PERSONAS, ANOMALY_PROMPTS, GROQ_API_KEY, CEREBRAS_API_KEY,
    ARCHITECT_MODEL, ARCHITECT_FALLBACK_MODEL,
    SYSTEM_INSTRUCTION, CAT_INSTRUCTION, ANOMALY_INSTRUCTION, ARCHITECT_SYSTEM
)
from llm_client import call_llm, parse_json_response, get_fallback_response
from mutations import process_mutations

app = Flask(__name__, static_url_path='', static_folder='static')


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')


@app.route('/api/decide', methods=['POST'])
def decide():
    data = request.json
    bot_name = data.get('name')
    bot_type = data.get('type', 'resident')

    if bot_type == 'resident':
        if bot_name == 'Luna':
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
        resp = call_llm(provider, model, messages, temperature=0.8)

        if resp.status_code != 200:
             print(f"API Error {provider}: {resp.text}")
             response_data = get_fallback_response()
        else:
            resp_json = resp.json()
            if 'choices' in resp_json:
                content = resp_json['choices'][0]['message']['content']
                response_data = parse_json_response(content)
            else:
                raise Exception("Invalid Response")

    except Exception as e:
        print(f"LLM Error ({bot_name}): {e}")
        response_data = get_fallback_response()

    return jsonify(response_data)


@app.route('/api/architect', methods=['POST'])
def architect():
    data = request.json
    user_prompt = data.get('prompt')

    messages = [
        {"role": "system", "content": ARCHITECT_SYSTEM},
        {"role": "user", "content": user_prompt}
    ]

    try:
        resp = call_llm('cerebras', ARCHITECT_MODEL, messages, temperature=0.9)

        if resp.status_code != 200:
             print(f"Cerebras Error: {resp.text}, falling back to Groq")
             resp = call_llm('groq', ARCHITECT_FALLBACK_MODEL, messages, temperature=0.9)

        if resp.status_code == 200:
            resp_json = resp.json()
            content = resp_json['choices'][0]['message']['content']
            try:
                architect_response = parse_json_response(content)
            except (json.JSONDecodeError, ValueError):
                 print(f"Architect Error: Invalid JSON received. Content: {content}")
                 return jsonify({
                     "response": "Connection interference... Signal lost. (Invalid Protocol)",
                     "commands": []
                 })

            raw_commands = architect_response.get('commands', [])
            mutated = process_mutations(raw_commands)
            architect_response['commands'] = mutated

            return jsonify(architect_response)
        else:
            return jsonify({"response": "System Error: Connection to Architect failed.", "commands": []})

    except Exception as e:
        print(f"Architect Error: {e}")
        return jsonify({"response": "Connection interference... Signal lost.", "commands": []})


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0').lower() in ('1', 'true', 'yes')
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    app.run(host=host, port=5000, debug=debug_mode)

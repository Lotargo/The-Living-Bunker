from __future__ import annotations

from flask import Flask, request, jsonify, send_from_directory
import os
import time
from functools import wraps
from typing import Any

from bunker.ai_orchestrator import decide_for_actor, run_architect_prompt
from bunker.runtime_settings import get_settings, provider_mode, update_settings
from bunker.room_generator import RoomGenerator

app = Flask(__name__, static_url_path='', static_folder='static')

RATE_LIMIT = {}
RATE_WINDOW = 1.0
RATE_MAX = int(os.environ.get('RATE_MAX_PER_WINDOW', '30'))

def rate_limit(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if provider_mode() == 'demo' or os.environ.get('LIVING_BUNKER_DEMO', '0').lower() in ('1', 'true', 'yes', 'on'):
            return f(*args, **kwargs)

        ip = request.remote_addr or 'unknown'
        now = time.time()
        window = RATE_LIMIT.get(ip, [])
        window = [t for t in window if now - t < RATE_WINDOW]
        if len(window) >= RATE_MAX:
            return jsonify({"error": "Rate limit exceeded"}), 429
        window.append(now)
        RATE_LIMIT[ip] = window
        return f(*args, **kwargs)
    return wrapper


@app.route('/')
def index() -> Any:
    return send_from_directory('static', 'index.html')


@app.route('/api/decide', methods=['POST'])
@rate_limit
def decide() -> Any:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    try:
        return jsonify(decide_for_actor(data))
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400


@app.route('/api/architect', methods=['POST'])
@rate_limit
def architect() -> Any:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"response": "Invalid request body.", "commands": []}), 400

    user_prompt = data.get('prompt')
    if not isinstance(user_prompt, str) or not user_prompt.strip():
        return jsonify({"response": "Architect requires a non-empty prompt.", "commands": []}), 400

    return jsonify(run_architect_prompt(user_prompt.strip()))


@app.route('/api/settings', methods=['GET', 'POST'])
def settings() -> Any:
    if request.method == 'GET':
        return jsonify(get_settings())

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400
    return jsonify(update_settings(data))


@app.route('/api/generate-room', methods=['POST'])
@rate_limit
def generate_room() -> Any:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    room_type = data.get('type')
    if not isinstance(room_type, str) or not room_type.strip():
        return jsonify({"error": "Room type is required"}), 400

    try:
        gen = RoomGenerator()
        room = gen.generate(
            room_type=room_type.strip().lower(),
            x=data.get('x', 0),
            y=data.get('y', 0),
            width=data.get('width'),
            height=data.get('height'),
            owner=data.get('owner'),
            seed=data.get('seed'),
        )
        return jsonify(room)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"error": f"Generation failed: {str(exc)}"}), 500


@app.route('/api/room-types', methods=['GET'])
def room_types() -> Any:
    gen = RoomGenerator()
    types = list(gen.room_configs.keys())
    return jsonify({"types": types})


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0').lower() in ('1', 'true', 'yes')
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    app.run(host=host, port=5000, debug=debug_mode)

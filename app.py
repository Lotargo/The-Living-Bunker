from __future__ import annotations

from flask import Flask, request, jsonify, send_from_directory
import os
import time
from functools import wraps
from typing import Any

from ai_orchestrator import decide_for_actor, run_architect_prompt

app = Flask(__name__, static_url_path='', static_folder='static')

RATE_LIMIT = {}
RATE_WINDOW = 1.0
RATE_MAX = 5

def rate_limit(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
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


if __name__ == '__main__':
    debug_mode = os.environ.get('FLASK_DEBUG', '0').lower() in ('1', 'true', 'yes')
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    app.run(host=host, port=5000, debug=debug_mode)

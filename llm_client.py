import json
import requests
from config import GROQ_API_KEY, CEREBRAS_API_KEY

PROVIDER_URLS = {
    "groq": "https://api.groq.com/openai/v1/chat/completions",
    "cerebras": "https://api.cerebras.ai/v1/chat/completions"
}

PROVIDER_KEYS = {
    "groq": GROQ_API_KEY,
    "cerebras": CEREBRAS_API_KEY
}

def call_llm(provider, model, messages, temperature=0.8):
    api_key = PROVIDER_KEYS.get(provider)
    api_url = PROVIDER_URLS.get(provider)

    if not api_key or not api_url:
        raise ValueError(f"No configuration for provider: {provider}")

    payload = {
        "model": model,
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": temperature
    }

    resp = requests.post(
        api_url,
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload
    )

    return resp


def parse_json_response(content):
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        cleaned = content.replace("```json", "").replace("```", "")
        return json.loads(cleaned)


def get_fallback_response():
    return {"thought": "...", "action": "IDLE", "target": "self"}

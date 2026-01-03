import os
import requests

def get_models(provider_name, api_url, api_key):
    print(f"Fetching models for {provider_name}...")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(api_url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Handle standard OpenAI format { "data": [ { "id": "..." } ] }
            if "data" in data:
                models = [m["id"] for m in data["data"]]
                print(f"Available {provider_name} models:")
                for m in models:
                    print(f" - {m}")
            else:
                print(f"Unexpected format from {provider_name}: {data}")
        else:
            print(f"Error fetching {provider_name} models: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Exception fetching {provider_name} models: {e}")
    print("-" * 20)

def main():
    groq_key = os.environ.get("GROQ_API_KEY")
    cerebras_key = os.environ.get("CEREBRAS_API_KEY")

    if groq_key:
        get_models("Groq", "https://api.groq.com/openai/v1/models", groq_key)
    else:
        print("GROQ_API_KEY not set.")

    if cerebras_key:
        get_models("Cerebras", "https://api.cerebras.ai/v1/models", cerebras_key)
    else:
        print("CEREBRAS_API_KEY not set.")

if __name__ == "__main__":
    main()

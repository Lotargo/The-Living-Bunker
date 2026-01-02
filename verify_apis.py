import os
import requests
import json

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
CEREBRAS_API_KEY = os.environ.get("CEREBRAS_API_KEY")

def check_groq():
    print("Checking Groq API...")
    url = "https://api.groq.com/openai/v1/models"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            models = response.json()['data']
            print("Groq Models Available:")
            for m in models:
                print(f" - {m['id']}")
            return True
        else:
            print(f"Groq Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Groq Exception: {e}")
        return False

def check_cerebras():
    print("\nChecking Cerebras API...")
    # Cerebras endpoint typically follows OpenAI format but URL might differ.
    # Documentation says base url is https://api.cerebras.ai/v1
    url = "https://api.cerebras.ai/v1/models"
    headers = {
        "Authorization": f"Bearer {CEREBRAS_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            # print(json.dumps(data, indent=2))
            models = data.get('data', [])
            print("Cerebras Models Available:")
            for m in models:
                 print(f" - {m['id']}")
            return True
        else:
            print(f"Cerebras Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Cerebras Exception: {e}")
        return False

if __name__ == "__main__":
    g_ok = check_groq()
    c_ok = check_cerebras()

    if g_ok and c_ok:
        print("\nBoth APIs verified successfully.")
    else:
        print("\nSome API checks failed.")

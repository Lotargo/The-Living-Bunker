import requests
import time
import subprocess
import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_architect():
    print("Starting Flask server...")
    # Start server in background
    server = subprocess.Popen([sys.executable, 'app.py'], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        # Wait for server to start
        time.sleep(5)

        url = "http://localhost:5000/api/architect"
        headers = {"Content-Type": "application/json"}

        # Test Case 1: BUILD command
        prompt = "Build a Library next to the Kitchen."
        print(f"Testing Prompt: '{prompt}'")

        response = requests.post(url, json={"prompt": prompt}, headers=headers, timeout=30)

        if response.status_code == 200:
            data = response.json()
            print("Response:", json.dumps(data, indent=2))

            commands = data.get('commands', [])
            build_cmd = next((c for c in commands if c.get('action') == 'BUILD'), None)

            if build_cmd:
                print("SUCCESS: Received BUILD command.")
                if build_cmd.get('roomType') == 'Library':
                    print("SUCCESS: Correct Room Type.")
                else:
                    print(f"FAILURE: Incorrect Room Type: {build_cmd.get('roomType')}")
            else:
                print("FAILURE: No BUILD command found.")
        else:
            print(f"FAILURE: Server returned {response.status_code}")
            print(response.text)

        # Test Case 2: SPAWN command (to check general model health)
        prompt = "Spawn a ghost in the kitchen."
        print(f"\nTesting Prompt: '{prompt}'")
        response = requests.post(url, json={"prompt": prompt}, headers=headers, timeout=30)
        if response.status_code == 200:
             data = response.json()
             commands = data.get('commands', [])
             spawn_cmd = next((c for c in commands if c.get('action') == 'SPAWN'), None)
             if spawn_cmd:
                 print("SUCCESS: Received SPAWN command.")
             else:
                 print("FAILURE: No SPAWN command found.")

    except Exception as e:
        print(f"EXCEPTION: {e}")
    finally:
        print("Stopping server...")
        server.terminate()
        server.wait()

if __name__ == "__main__":
    test_architect()

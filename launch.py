from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
import webbrowser
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ASSET_SENTINEL = ROOT / "static" / "assets" / "cat_luna.png"
VENDOR_ASSET_SENTINEL = ROOT / "static" / "assets" / "vendor" / "characters" / "village_man_idle_down.png"
URL = "http://127.0.0.1:5000"


def find_command(name: str) -> str | None:
    candidates = [name]
    if os.name == "nt":
        candidates.insert(0, name + ".cmd")
        candidates.insert(0, name + ".exe")

    for candidate in candidates:
        path = shutil.which(candidate)
        if path:
            return path
    return None


def run_step(command: list[str], label: str) -> None:
    print(f"[launcher] {label}...")
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    try:
        run_step([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], "checking Python dependencies")

        if (ROOT / "package.json").exists():
            npm = find_command("npm")
            if not npm:
                print("[launcher] npm was not found. Install Node.js or run `npm install && npm run build` manually.")
                return 1
            run_step([npm, "install"], "checking Node dependencies")
            run_step([npm, "run", "build"], "building TypeScript")

        if not ASSET_SENTINEL.exists():
            run_step([sys.executable, "scripts/generate_assets.py"], "generating assets")

        if not VENDOR_ASSET_SENTINEL.exists() and (ROOT / "third_party_assets" / "raw").exists():
            run_step([sys.executable, "scripts/import_vendor_assets.py"], "importing third-party assets")

        env = os.environ.copy()
        env.setdefault("FLASK_HOST", "127.0.0.1")
        if not env.get("GROQ_API_KEY") and not env.get("CEREBRAS_API_KEY") and not env.get("OPENAI_COMPATIBLE_API_KEY"):
            env["LIVING_BUNKER_DEMO"] = "1"
            print("[launcher] no API keys detected, demo mode enabled")

        print(f"[launcher] starting server at {URL}")
        server = subprocess.Popen([sys.executable, "app.py"], cwd=ROOT, env=env)
        time.sleep(1.5)
        webbrowser.open(URL)
        print("[launcher] press Ctrl+C to stop the bunker")

        try:
            return server.wait()
        except KeyboardInterrupt:
            print("\n[launcher] stopping server")
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
            return 0
    except subprocess.CalledProcessError as exc:
        print(f"[launcher] step failed with exit code {exc.returncode}")
        return exc.returncode


if __name__ == "__main__":
    raise SystemExit(main())

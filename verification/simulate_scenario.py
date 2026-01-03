from playwright.sync_api import sync_playwright
import time
import os

def run_simulation():
    if not os.path.exists("verification"):
        os.makedirs("verification")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})

        # Capture console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"BROWSER ERROR: {exc}"))

        print("Loading simulation...")
        page.goto("http://localhost:5000")

        # Wait for assets
        time.sleep(5)
        page.screenshot(path="verification/sim_01_start.png")
        print("Captured: Start of simulation")

        # Let it run and capture periodically
        for i in range(2, 4):
            print(f"Running simulation... ({i}/3)")
            # Wait 10 seconds
            time.sleep(10)

            # Check logs for interesting events
            try:
                logs = page.locator("#logs").inner_text()
                print(f"Current Logs:\n{logs[:300]}...\n")
            except:
                print("Logs not found or empty.")

            filename = f"verification/sim_{i:02d}_progress.png"
            page.screenshot(path=filename)
            print(f"Captured: {filename}")

        browser.close()

if __name__ == "__main__":
    run_simulation()

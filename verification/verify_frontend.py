from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})
        try:
            page.goto("http://localhost:5000")
            # Wait for assets to load and simulation to start
            time.sleep(5)
            page.screenshot(path="verification/bunker_visuals.png")
            print("Screenshot saved to verification/bunker_visuals.png")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()

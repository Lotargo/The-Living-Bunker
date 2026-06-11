# Third-Party Assets

Original downloaded archives live in `third_party_assets/raw/`.

Do not edit or overwrite raw downloads. Processed, game-ready copies should be generated into `third_party_assets/processed/` or `static/assets/vendor/` by scripts.

## Current Direction

The downloaded packs are mostly **top-down pixel art**, not isometric. That makes them a strong candidate for a future top-down visual pass rather than a direct drop-in replacement for the current pseudo-isometric renderer.

## Workflow

1. Keep original downloads in `raw/`.
2. Track source, author, URL, license status, and integration status in `asset_manifest.json`.
3. Use scripts to copy/slice selected assets into game-facing folders.
4. Keep license files in `licenses/` when extracted or separately downloaded.

## Notes

- `perplexity-ai-clone-chat-ui-design.zip` is not part of the original game-assets shortlist. It is tracked as `needs_review` until we decide whether it belongs in the project.
- Packs without bundled license files should stay marked as `license_missing` until manually verified from the itch.io page or author terms.

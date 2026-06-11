from __future__ import annotations

import json
import zipfile
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "third_party_assets" / "raw"
OUT_PATH = ROOT / "third_party_assets" / "inventory_report.json"


def inspect_zip(path: Path) -> dict[str, Any]:
    result: dict[str, Any] = {
        "archive": path.name,
        "files": 0,
        "png": [],
        "audioCount": 0,
        "licenseFiles": [],
        "readmeFiles": [],
    }

    with zipfile.ZipFile(path) as zf:
        names = zf.namelist()
        result["files"] = len(names)
        result["audioCount"] = sum(1 for n in names if n.lower().endswith((".wav", ".ogg", ".mp3", ".m4a")))
        result["licenseFiles"] = [n for n in names if "license" in n.lower()]
        result["readmeFiles"] = [n for n in names if "readme" in n.lower()]

        pngs = [n for n in names if n.lower().endswith(".png") and "__macosx" not in n.lower()]
        for name in pngs[:40]:
            try:
                with zf.open(name) as file:
                    img = Image.open(BytesIO(file.read()))
                    result["png"].append({"path": name, "width": img.width, "height": img.height})
            except Exception as exc:
                result["png"].append({"path": name, "error": str(exc)})
        result["pngTotal"] = len(pngs)

    return result


def main() -> None:
    reports = [inspect_zip(path) for path in sorted(RAW_DIR.glob("*.zip"))]
    OUT_PATH.write_text(json.dumps({"archives": reports}, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()

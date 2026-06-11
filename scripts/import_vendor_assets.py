from __future__ import annotations

import shutil
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "third_party_assets" / "raw"
OUT = ROOT / "static" / "assets" / "vendor"


ASSETS = [
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/village_man_idle_down.png",
        "characters/village_man_idle_down.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/village_man_idle_up.png",
        "characters/village_man_idle_up.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/village_man_walk_down.png",
        "characters/village_man_walk_down.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/village_man_walk_left.png",
        "characters/village_man_walk_left.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/village_man_walk_right.png",
        "characters/village_man_walk_right.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/village_man_walk_up.png",
        "characters/village_man_walk_up.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/female_villager_idle_down.png",
        "characters/female_villager_idle_down.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/female_villager_walk_down.png",
        "characters/female_villager_walk_down.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/female_villager_walk_left.png",
        "characters/female_villager_walk_left.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/female_villager_walk_right.png",
        "characters/female_villager_walk_right.png",
    ),
    (
        "tiny-questers-npc-pack-free.zip",
        "npc_pack_free/png/atlas/female_villager_walk_up.png",
        "characters/female_villager_walk_up.png",
    ),
    ("CatPackFree.zip", "CatPackFree/Idle.png", "characters/luna_idle.png"),
    ("tiny-questers-bat-free.zip", "tiny-questers-bat/png/atlas/bat_idle_down.png", "monsters/bat_idle_down.png"),
    ("tiny-questers-bat-free.zip", "tiny-questers-bat/png/atlas/bat_walk_down.png", "monsters/bat_walk_down.png"),
]


def extract_asset(zip_name: str, source: str, target: str) -> None:
    archive = RAW / zip_name
    target_path = OUT / target
    target_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zf:
        with zf.open(source) as src, target_path.open("wb") as dst:
            shutil.copyfileobj(src, dst)
    print(f"Imported {target}")


def main() -> None:
    for zip_name, source, target in ASSETS:
        extract_asset(zip_name, source, target)


if __name__ == "__main__":
    main()

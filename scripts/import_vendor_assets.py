from __future__ import annotations

import shutil
import zipfile
from io import BytesIO
from pathlib import Path

from PIL import Image


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

INTERIOR_CROPS = [
    ("TopDownHouse_FloorsAndWalls.png", (0, 64, 16, 80), "interior/floor_wood.png"),
    ("TopDownHouse_FloorsAndWalls.png", (80, 64, 96, 80), "interior/floor_concrete.png"),
    ("TopDownHouse_FloorsAndWalls.png", (192, 64, 208, 80), "interior/floor_tile.png"),
    ("TopDownHouse_FloorsAndWalls.png", (0, 0, 16, 16), "interior/wall.png"),
    ("TopDownHouse_FurnitureState1.png", (32, 192, 64, 256), "interior/fridge.png"),
    ("TopDownHouse_FurnitureState1.png", (80, 192, 112, 240), "interior/stove.png"),
    ("TopDownHouse_FurnitureState1.png", (96, 256, 144, 288), "interior/bathtub.png"),
    ("TopDownHouse_FurnitureState1.png", (144, 256, 160, 288), "interior/toilet.png"),
    ("TopDownHouse_FurnitureState1.png", (48, 32, 96, 64), "interior/table.png"),
    ("TopDownHouse_FurnitureState1.png", (0, 160, 64, 192), "interior/sofa.png"),
    ("TopDownHouse_FurnitureState1.png", (32, 64, 96, 112), "interior/bookshelf.png"),
    ("TopDownHouse_FurnitureState1.png", (144, 112, 176, 160), "interior/mirror.png"),
    ("TopDownHouse_FurnitureState1.png", (0, 192, 32, 256), "interior/bed.png"),
    ("TopDownHouse_FurnitureState1.png", (160, 112, 208, 160), "interior/chair.png"),
    ("TopDownHouse_SmallItems.png", (0, 96, 16, 112), "interior/bottle.png"),
    ("TopDownHouse_SmallItems.png", (144, 0, 160, 16), "interior/plant_small.png"),
    ("TopDownHouse_SmallItems.png", (64, 96, 96, 112), "interior/crate.png"),
    ("TopDownHouse_SmallItems.png", (64, 16, 80, 32), "interior/papers.png"),
    ("TopDownHouse_SmallItems.png", (96, 48, 112, 64), "interior/barrel.png"),
]


def extract_asset(zip_name: str, source: str, target: str) -> None:
    archive = RAW / zip_name
    target_path = OUT / target
    target_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zf:
        with zf.open(source) as src, target_path.open("wb") as dst:
            shutil.copyfileobj(src, dst)
    print(f"Imported {target}")


def crop_interior(source: str, box: tuple[int, int, int, int], target: str) -> None:
    archive = RAW / "Top-Down_Retro_Interior.zip"
    target_path = OUT / target
    target_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as zf:
        img = Image.open(BytesIO(zf.read(source))).convert("RGBA")
        img.crop(box).save(target_path)
    print(f"Imported {target}")


def main() -> None:
    for zip_name, source, target in ASSETS:
        extract_asset(zip_name, source, target)
    for source, box, target in INTERIOR_CROPS:
        crop_interior(source, box, target)


if __name__ == "__main__":
    main()

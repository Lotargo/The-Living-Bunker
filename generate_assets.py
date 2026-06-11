import os

from generators import (
    ASSET_DIR,
    create_floor_tile,
    create_wall_tile,
    create_detailed_furniture,
    create_character,
    create_cat_asset,
    create_anomaly_assets,
)
from generators.furniture import FURNITURE_TYPES


if __name__ == "__main__":
    if not os.path.exists(ASSET_DIR):
        os.makedirs(ASSET_DIR)

    create_floor_tile("floor.png", "concrete")
    create_floor_tile("floor_wood.png", "wood")
    create_floor_tile("floor_tile.png", "tile")

    create_wall_tile("wall_left.png", "left")
    create_wall_tile("wall_right.png", "right")

    create_character("char_red.png", "#e74c3c")
    create_character("char_blue.png", "#3498db")
    create_character("char_green.png", "#2ecc71")

    for item in FURNITURE_TYPES:
        create_detailed_furniture(f"{item}.png", item)

    create_cat_asset("cat_luna.png", "lime")
    create_cat_asset("cat_evil.png", "red")

    create_anomaly_assets()

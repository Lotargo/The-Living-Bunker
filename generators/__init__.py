import os

ASSET_DIR = "static/assets"

from .textures import TextureGenerator, create_floor_tile, create_wall_tile
from .furniture import create_detailed_furniture
from .characters import create_character, create_cat_asset
from .anomalies import create_anomaly_assets

__all__ = [
    "ASSET_DIR",
    "TextureGenerator",
    "create_floor_tile",
    "create_wall_tile",
    "create_detailed_furniture",
    "create_character",
    "create_cat_asset",
    "create_anomaly_assets",
]

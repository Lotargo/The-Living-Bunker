import os
import sys
import pytest
sys.path.insert(0, '.')

from generate_assets import (
    TextureGenerator, create_floor_tile, create_wall_tile,
    create_character, create_cat_asset, create_detailed_furniture,
    create_anomaly_assets, ASSET_DIR
)

import PIL
from PIL import Image

# Fixtures inside test file
@pytest.fixture(autouse=True)
def patch_asset_dir(monkeypatch, tmp_path):
    asset_dir = tmp_path / "static" / "assets"
    asset_dir.mkdir(parents=True)
    monkeypatch.setattr('generate_assets.ASSET_DIR', str(asset_dir))
    return str(asset_dir)


class TestTextureGenerator:
    def test_add_noise_returns_image(self):
        img = Image.new("RGBA", (64, 64), (128, 128, 128, 255))
        result = TextureGenerator.add_noise(img, 20)
        assert isinstance(result, Image.Image)

    def test_add_noise_changes_pixels(self):
        img = Image.new("RGBA", (8, 8), (100, 100, 100, 255))
        original = img.copy()
        TextureGenerator.add_noise(img, 50)
        assert img.tobytes() != original.tobytes()

    def test_add_noise_skips_transparent(self):
        img = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
        original = img.copy()
        TextureGenerator.add_noise(img, 50)
        assert img.tobytes() == original.tobytes()

    def test_create_brick_texture(self):
        img = TextureGenerator.create_brick_texture(64, 48)
        assert isinstance(img, Image.Image)
        assert img.size == (64, 48)

    def test_create_wood_texture(self):
        img = TextureGenerator.create_wood_texture(64, 32)
        assert isinstance(img, Image.Image)
        assert img.size == (64, 32)

    def test_create_tile_texture(self):
        img = TextureGenerator.create_tile_texture(64, 32)
        assert isinstance(img, Image.Image)
        assert img.size == (64, 32)


class TestFloorTile:
    def test_create_concrete_floor(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "floor.png")
        create_floor_tile("floor.png", "concrete")
        assert os.path.exists(path)
        img = Image.open(path)
        assert img.size == (64, 48)

    def test_create_wood_floor(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "floor_wood.png")
        create_floor_tile("floor_wood.png", "wood")
        assert os.path.exists(path)

    def test_create_tile_floor(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "floor_tile.png")
        create_floor_tile("floor_tile.png", "tile")
        assert os.path.exists(path)


class TestWallTile:
    def test_create_left_wall(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "wall_left.png")
        create_wall_tile("wall_left.png", "left")
        assert os.path.exists(path)

    def test_create_right_wall(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "wall_right.png")
        create_wall_tile("wall_right.png", "right")
        assert os.path.exists(path)


class TestCharacter:
    def test_create_character(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "char_red.png")
        create_character("char_red.png", "#e74c3c")
        assert os.path.exists(path)
        img = Image.open(path)
        assert img.size == (32, 48)


class TestCat:
    def test_create_cat(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "cat_luna.png")
        create_cat_asset("cat_luna.png", "lime")
        assert os.path.exists(path)
        img = Image.open(path)
        assert img.size == (32, 32)

    def test_create_evil_cat(self, patch_asset_dir):
        path = os.path.join(patch_asset_dir, "cat_evil.png")
        create_cat_asset("cat_evil.png", "red")
        assert os.path.exists(path)


class TestFurniture:
    @pytest.mark.parametrize("item", [
        "fridge", "bed", "table", "chair", "sofa",
        "computer", "radio", "toilet", "sink", "shower",
        "stove", "tv", "plant", "rug"
    ])
    def test_create_furniture(self, patch_asset_dir, item):
        path = os.path.join(patch_asset_dir, f"{item}.png")
        create_detailed_furniture(f"{item}.png", item)
        assert os.path.exists(path), f"Failed to create {item}.png"
        img = Image.open(path)
        assert img.size == (64, 64)


class TestAnomalyAssets:
    def test_create_ghost(self, patch_asset_dir):
        ghost_path = os.path.join(patch_asset_dir, "ghost.png")
        glitch_path = os.path.join(patch_asset_dir, "glitch.png")
        create_anomaly_assets()
        assert os.path.exists(ghost_path)
        assert os.path.exists(glitch_path)

    def test_ghost_dimensions(self, patch_asset_dir):
        create_anomaly_assets()
        img = Image.open(os.path.join(patch_asset_dir, "ghost.png"))
        assert img.size == (32, 48)

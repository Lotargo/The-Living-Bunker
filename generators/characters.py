from __future__ import annotations

import os
from PIL import Image, ImageDraw

from . import ASSET_DIR
from .textures import TextureGenerator


def create_character(filename: str, color: str = "red") -> None:
    img = Image.new("RGBA", (32, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((4, 40, 28, 46), fill="#00000080")
    draw.rounded_rectangle((6, 30, 26, 42), radius=2, fill="#2C3E50", outline="black")
    draw.rounded_rectangle((4, 16, 28, 32), radius=4, fill=color, outline="black")
    skin_color = "#ffccaa"
    draw.ellipse((4, 2, 28, 26), fill=skin_color, outline="black")
    hair_color = "#553311"
    draw.pieslice((4, 2, 28, 26), 180, 360, fill=hair_color, outline="black")
    draw.rectangle((10, 12, 12, 14), fill="black")
    draw.rectangle((20, 12, 22, 14), fill="black")
    img = TextureGenerator.add_noise(img, 5)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")


def create_cat_asset(filename: str, eyes_color: str = "green") -> None:
    img = Image.new("RGBA", (32, 32), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    draw.ellipse((6, 24, 26, 30), fill="#00000080")
    draw.ellipse((8, 14, 24, 28), fill="#111", outline="black")
    draw.ellipse((10, 6, 22, 18), fill="#111", outline="black")
    draw.polygon([(10, 8), (8, 2), (14, 6)], fill="#111", outline="black")
    draw.polygon([(22, 8), (24, 2), (18, 6)], fill="#111", outline="black")
    draw.ellipse((12, 10, 15, 13), fill=eyes_color)
    draw.ellipse((17, 10, 20, 13), fill=eyes_color)
    draw.line((13.5, 10, 13.5, 13), fill="black", width=1)
    draw.line((18.5, 10, 18.5, 13), fill="black", width=1)
    draw.arc((20, 18, 30, 28), 0, 180, fill="#111", width=3)
    img = TextureGenerator.add_noise(img, 5)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

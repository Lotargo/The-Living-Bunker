from __future__ import annotations

import os
import random
from PIL import Image, ImageDraw

from . import ASSET_DIR
from .textures import TextureGenerator


FURNITURE_TYPES: list[str] = [
    "fridge", "bed", "table", "chair", "sofa",
    "computer", "radio", "toilet", "sink", "shower",
    "stove", "tv", "plant", "rug",
]


def create_detailed_furniture(filename: str, type: str) -> None:
    img = Image.new("RGBA", (64, 64), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    if type == "bed":
        draw.polygon([(16, 32), (48, 48), (32, 60), (0, 44)], fill="#5D2906", outline="black")
        draw.polygon([(16, 24), (48, 40), (32, 52), (0, 36)], fill="#ECF0F1", outline="#BDC3C7")
        draw.polygon([(4, 34), (16, 28), (24, 34), (12, 40)], fill="white", outline="#BDC3C7")
        draw.polygon([(24, 46), (48, 40), (32, 52), (8, 42)], fill="#E74C3C", outline="#C0392B")
    elif type == "table":
        top = [(16, 24), (48, 32), (32, 48), (0, 40)]
        draw.polygon(top, fill="#8B4513", outline="#5D2906")
        draw.polygon([(0, 40), (32, 48), (32, 52), (0, 44)], fill="#5D2906")
        draw.polygon([(32, 48), (48, 32), (48, 36), (32, 52)], fill="#3E1C02")
        draw.rectangle((4, 44, 8, 60), fill="#3E1C02")
        draw.rectangle((28, 52, 32, 64), fill="#3E1C02")
        draw.rectangle((40, 36, 44, 50), fill="#3E1C02")
    elif type == "fridge":
        front = [(16, 8), (32, 16), (32, 56), (16, 48)]
        side = [(32, 16), (48, 8), (48, 48), (32, 56)]
        top = [(32, 0), (48, 8), (32, 16), (16, 8)]
        draw.polygon(top, fill="#ECF0F1", outline="#BDC3C7")
        draw.polygon(front, fill="#BDC3C7", outline="#95A5A6")
        draw.polygon(side, fill="#95A5A6", outline="#7F8C8D")
        draw.line((18, 20, 18, 30), fill="black", width=2)
    elif type == "sofa":
        draw.polygon([(10, 32), (54, 40), (44, 52), (0, 44)], fill="#27ae60", outline="#1e8449")
        draw.polygon([(10, 32), (54, 40), (54, 20), (10, 12)], fill="#2ecc71", outline="#1e8449")
        draw.polygon([(0, 44), (10, 32), (10, 24), (0, 36)], fill="#2ecc71")
        draw.polygon([(44, 52), (54, 40), (54, 32), (44, 44)], fill="#2ecc71")
    elif type == "chair":
        draw.polygon([(20, 32), (44, 38), (32, 48), (8, 42)], fill="#8B4513", outline="#5D2906")
        draw.polygon([(20, 32), (44, 38), (44, 18), (20, 12)], fill="#A0522D", outline="#5D2906")
        draw.line((8, 42, 8, 60), fill="#3E1C02", width=3)
        draw.line((32, 48, 32, 64), fill="#3E1C02", width=3)
        draw.line((44, 38, 44, 54), fill="#3E1C02", width=3)
    elif type == "computer":
        draw.polygon([(10, 32), (54, 40), (44, 52), (0, 44)], fill="#95A5A6", outline="#7F8C8D")
        draw.line((0, 44, 0, 60), fill="#7F8C8D", width=3)
        draw.line((44, 52, 44, 64), fill="#7F8C8D", width=3)
        draw.polygon([(20, 32), (40, 36), (40, 20), (20, 16)], fill="#2C3E50", outline="black")
        draw.polygon([(22, 30), (38, 34), (38, 22), (22, 18)], fill="#3498db")
    elif type == "radio":
        draw.polygon([(20, 32), (44, 38), (44, 24), (20, 18)], fill="#8B4513", outline="black")
        draw.polygon([(44, 38), (52, 32), (52, 18), (44, 24)], fill="#5D2906", outline="black")
        draw.polygon([(20, 18), (44, 24), (52, 18), (28, 12)], fill="#A0522D", outline="black")
        draw.ellipse((24, 22, 34, 32), fill="#111", outline="#333")
    elif type == "toilet":
        draw.ellipse((20, 40, 44, 52), fill="#EEE", outline="#CCC")
        draw.ellipse((20, 32, 44, 44), fill="#FFF", outline="#CCC")
        draw.polygon([(24, 32), (40, 36), (40, 16), (24, 12)], fill="#EEE", outline="#CCC")
    elif type == "sink":
        draw.rectangle((28, 40, 36, 60), fill="#DDD")
        draw.polygon([(16, 32), (48, 40), (48, 28), (16, 20)], fill="#FFF", outline="#CCC")
        draw.line((32, 24, 32, 16), fill="silver", width=2)
    elif type == "shower":
        draw.polygon([(16, 32), (48, 48), (32, 60), (0, 44)], fill="#AED6F1", outline="#3498DB")
        draw.line((0, 44, 0, 10), fill="#FFFFFF80", width=1)
        draw.line((16, 32, 16, 0), fill="#FFFFFF80", width=1)
        draw.line((16, 5, 24, 10), fill="silver", width=2)
        draw.ellipse((20, 8, 28, 14), fill="silver")
    elif type == "stove":
        draw.polygon([(16, 32), (48, 40), (32, 52), (0, 44)], fill="#2C3E50", outline="black")
        draw.polygon([(0, 44), (32, 52), (32, 64), (0, 56)], fill="#95A5A6", outline="black")
        draw.polygon([(32, 52), (48, 40), (48, 52), (32, 64)], fill="#7F8C8D", outline="black")
        draw.ellipse((4, 38, 14, 42), fill="black")
        draw.ellipse((20, 42, 30, 46), fill="black")
    elif type == "tv":
        draw.rectangle((20, 50, 44, 60), fill="#333")
        draw.polygon([(10, 30), (54, 38), (54, 10), (10, 2)], fill="#111", outline="#333")
        draw.polygon([(14, 28), (50, 35), (50, 13), (14, 6)], fill="#222")
    elif type == "plant":
        draw.polygon([(24, 48), (40, 52), (40, 40), (24, 36)], fill="#E67E22", outline="#D35400")
        for i in range(5):
             ox = random.randint(24, 40)
             oy = random.randint(20, 40)
             draw.ellipse((ox-8, oy-8, ox+8, oy+8), fill="#2ECC71", outline="#27AE60")
    elif type == "rug":
        draw.polygon([(10, 32), (54, 40), (44, 52), (0, 44)], fill="#8E44AD", outline="#9B59B6")

    img = TextureGenerator.add_noise(img, 10)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

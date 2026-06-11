from __future__ import annotations

import os
import random
from PIL import Image, ImageDraw

from . import ASSET_DIR
from .textures import TextureGenerator


def create_anomaly_assets() -> None:
    img = Image.new("RGBA", (32, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    points = [(8, 40), (4, 20), (10, 4), (22, 4), (28, 20), (24, 40)]
    points.extend([(16, 46), (8, 40)])
    draw.polygon(points, fill=(200, 220, 255, 150), outline=(255, 255, 255, 180))
    draw.ellipse((10, 12, 14, 16), fill=(0,0,0,100))
    draw.ellipse((18, 12, 22, 16), fill=(0,0,0,100))
    img = TextureGenerator.add_noise(img, 5)
    img.save(os.path.join(ASSET_DIR, "ghost.png"))
    print("Generated ghost.png")

    img = Image.new("RGBA", (32, 48), (0,0,0,0))
    pixels = img.load()
    for x in range(32):
        for y in range(48):
            if random.random() < 0.8:
                r = random.randint(0, 255)
                g = random.randint(0, 50)
                b = random.randint(200, 255)
                pixels[x,y] = (r, g, b, 200)
    img.save(os.path.join(ASSET_DIR, "glitch.png"))
    print("Generated glitch.png")

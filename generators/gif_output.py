import math
from typing import List, Dict, Any
from PIL import Image, ImageDraw


def render_frame(state: List[Dict[str, Any]], width: int, height: int, bg_color: tuple) -> Image.Image:
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    for s in state:
        half = s['size'] / 2
        corners = [(-half, -half), (half, -half), (half, half), (-half, half)]

        rad = math.radians(s['rot'])
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)

        poly = []
        for cx, cy in corners:
            rx = cx * cos_a - cy * sin_a + s['x']
            ry = cx * sin_a + cy * cos_a + s['y']
            poly.append((rx, ry))

        draw.polygon(poly, fill=s['color'])

    return img


def render_gif(
    frames: List[Image.Image],
    output_path: str,
    fps: int
) -> None:
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=1000 // fps,
        loop=0
    )


def render_png(frame: Image.Image, output_path: str) -> None:
    frame.save(output_path)

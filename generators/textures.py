import os
import random
from PIL import Image, ImageDraw

from . import ASSET_DIR


class TextureGenerator:
    @staticmethod
    def add_noise(img, intensity=20):
        pixels = img.load()
        width, height = img.size
        for x in range(width):
            for y in range(height):
                r, g, b, a = pixels[x, y]
                if a == 0: continue
                noise = random.randint(-intensity, intensity)
                r = max(0, min(255, r + noise))
                g = max(0, min(255, g + noise))
                b = max(0, min(255, b + noise))
                pixels[x, y] = (r, g, b, a)
        return img

    @staticmethod
    def create_brick_texture(width, height, base_color="#7F8C8D", grout_color="#2C3E50"):
        img = Image.new("RGBA", (width, height), base_color)
        draw = ImageDraw.Draw(img)
        brick_h = 12
        brick_w = 20
        for row in range(0, height, brick_h):
            offset = 0 if (row // brick_h) % 2 == 0 else brick_w // 2
            for col in range(-brick_w, width, brick_w):
                x = col + offset
                draw.rectangle((x, row, x + brick_w - 2, row + brick_h - 2), fill=base_color)
                draw.line((x, row, x+brick_w-2, row), fill="#BDC3C7", width=1)
                draw.line((x+brick_w-2, row, x+brick_w-2, row+brick_h-2), fill="#555", width=1)
        return TextureGenerator.add_noise(img, 15)

    @staticmethod
    def create_wood_texture(width, height, base_color="#8B4513"):
        img = Image.new("RGBA", (width, height), base_color)
        draw = ImageDraw.Draw(img)
        plank_w = 10
        for x in range(0, width, plank_w):
             draw.line((x, 0, x, height), fill="#5D2906", width=1)
             for i in range(5):
                 rx = x + random.randint(1, plank_w-2)
                 ry = random.randint(0, height)
                 draw.line((rx, ry, rx, ry+10), fill="#5D2906", width=1)
        return TextureGenerator.add_noise(img, 10)

    @staticmethod
    def create_tile_texture(width, height, base_color="#ECF0F1", grout="#BDC3C7"):
        img = Image.new("RGBA", (width, height), base_color)
        draw = ImageDraw.Draw(img)
        tile_size = 16
        for x in range(0, width, tile_size):
            draw.line((x, 0, x, height), fill=grout, width=1)
        for y in range(0, height, tile_size):
            draw.line((0, y, width, y), fill=grout, width=1)
        return TextureGenerator.add_noise(img, 5)


def create_floor_tile(filename, type="concrete"):
    img = Image.new("RGBA", (64, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    diamond = [(32, 0), (64, 16), (32, 32), (0, 16)]
    tex = Image.new("RGBA", (64, 32), (0,0,0,0))
    if type == "wood":
        base_tex = TextureGenerator.create_wood_texture(64, 32, "#D2B48C")
    elif type == "tile":
        base_tex = TextureGenerator.create_tile_texture(64, 32, "#FFFFFF")
    else:
        base_tex = Image.new("RGBA", (64, 32), "#95a5a6")
        base_tex = TextureGenerator.add_noise(base_tex, 15)
    mask = Image.new("L", (64, 32), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(diamond, fill=255)
    tex.paste(base_tex, (0,0), mask)
    tex_draw = ImageDraw.Draw(tex)
    tex_draw.line((32, 0, 32, 32), fill="#555555" if type != "tile" else "#CCCCCC", width=1)
    tex_draw.line((0, 16, 64, 16), fill="#555555" if type != "tile" else "#CCCCCC", width=1)
    tex_draw.polygon([(32, 4), (60, 16), (32, 28), (4, 16)], outline="#FFFFFF40")
    img.paste(tex, (0,0))
    side_color = "#7f8c8d" if type == "concrete" else "#5D2906" if type == "wood" else "#BDC3C7"
    left_face = [(0, 16), (32, 32), (32, 48), (0, 32)]
    draw.polygon(left_face, fill=side_color)
    right_face = [(32, 32), (64, 16), (64, 32), (32, 48)]
    draw.polygon(right_face, fill=side_color)
    draw.polygon(right_face, fill="#00000040")
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")


def create_wall_tile(filename, side="left"):
    img = Image.new("RGBA", (64, 96), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    brick_color = "#A0522D"
    grout = "#502010"
    top_cap = "#D2B48C"
    brick_tex = TextureGenerator.create_brick_texture(64, 96, brick_color, grout)
    mask_r = Image.new("L", (64, 96), 0)
    d_r = ImageDraw.Draw(mask_r)
    d_r.polygon([(32, 32), (64, 16), (64, 80), (32, 96)], fill=255)
    mask_l = Image.new("L", (64, 96), 0)
    d_l = ImageDraw.Draw(mask_l)
    d_l.polygon([(0, 16), (32, 32), (32, 96), (0, 80)], fill=255)
    draw.polygon([(32, 0), (64, 16), (32, 32), (0, 16)], fill=top_cap)
    if side == "left":
         img.paste(brick_tex, (0,0), mask_r)
         overlay = Image.new("RGBA", (64, 96), (0,0,0,0))
         od = ImageDraw.Draw(overlay)
         od.polygon([(32, 32), (64, 16), (64, 80), (32, 96)], fill="#00000040")
         img.alpha_composite(overlay)
         img.paste(brick_tex, (0,0), mask_l)
    else:
         img.paste(brick_tex, (0,0), mask_l)
         img.paste(brick_tex, (0,0), mask_r)
         overlay = Image.new("RGBA", (64, 96), (0,0,0,0))
         od = ImageDraw.Draw(overlay)
         od.polygon([(32, 32), (64, 16), (64, 80), (32, 96)], fill="#00000060")
         img.alpha_composite(overlay)
    draw.line((32, 32, 32, 96), fill="#000000", width=1)
    draw.line((32, 0, 32, 32), fill=top_cap, width=1)
    draw.line((0, 16, 32, 32), fill="#FFFFFF40", width=1)
    draw.line((32, 32, 64, 16), fill="#FFFFFF40", width=1)
    img = TextureGenerator.add_noise(img, 10)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

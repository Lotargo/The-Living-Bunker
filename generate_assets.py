from PIL import Image, ImageDraw, ImageColor
import random
import math
import os

ASSET_DIR = "static/assets"

class TextureGenerator:
    @staticmethod
    def add_noise(img, intensity=20):
        """Adds random noise to an image."""
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
                # Highlights/Shadows on bricks
                draw.line((x, row, x+brick_w-2, row), fill="#BDC3C7", width=1) # Top highlight
                draw.line((x+brick_w-2, row, x+brick_w-2, row+brick_h-2), fill="#555", width=1) # Right shadow

        return TextureGenerator.add_noise(img, 15)

    @staticmethod
    def create_wood_texture(width, height, base_color="#8B4513"):
        img = Image.new("RGBA", (width, height), base_color)
        draw = ImageDraw.Draw(img)
        # Planks
        plank_w = 10
        for x in range(0, width, plank_w):
             draw.line((x, 0, x, height), fill="#5D2906", width=1)
             # Grain?
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

    # Texture Base
    tex = Image.new("RGBA", (64, 32), (0,0,0,0))
    if type == "wood":
        base_tex = TextureGenerator.create_wood_texture(64, 32, "#D2B48C")
    elif type == "tile":
        base_tex = TextureGenerator.create_tile_texture(64, 32, "#FFFFFF")
    else: # concrete
        base_tex = Image.new("RGBA", (64, 32), "#95a5a6")
        base_tex = TextureGenerator.add_noise(base_tex, 15)

    # Mask diamond
    mask = Image.new("L", (64, 32), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(diamond, fill=255)

    tex.paste(base_tex, (0,0), mask)

    # Highlights
    tex_draw = ImageDraw.Draw(tex)
    tex_draw.line((32, 0, 32, 32), fill="#555555" if type != "tile" else "#CCCCCC", width=1) # Center seam? No
    tex_draw.line((0, 16, 64, 16), fill="#555555" if type != "tile" else "#CCCCCC", width=1)

    tex_draw.polygon([(32, 4), (60, 16), (32, 28), (4, 16)], outline="#FFFFFF40")

    img.paste(tex, (0,0))

    # Sides (thickness)
    side_color = "#7f8c8d" if type == "concrete" else "#5D2906" if type == "wood" else "#BDC3C7"

    left_face = [(0, 16), (32, 32), (32, 48), (0, 32)]
    draw.polygon(left_face, fill=side_color)
    right_face = [(32, 32), (64, 16), (64, 32), (32, 48)]
    draw.polygon(right_face, fill=side_color)
    draw.polygon(right_face, fill="#00000040") # Shadow side

    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

def create_wall_tile(filename, side="left"):
    # ... Existing logic for brick walls ...
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

def create_character(filename, color="red"):
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

def create_cat_asset(filename, eyes_color="green"):
    # Isometric cat is tricky, let's do a simple one
    img = Image.new("RGBA", (32, 32), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Shadow
    draw.ellipse((6, 24, 26, 30), fill="#00000080")

    # Body (Sitting)
    draw.ellipse((8, 14, 24, 28), fill="#111", outline="black")

    # Head
    draw.ellipse((10, 6, 22, 18), fill="#111", outline="black")

    # Ears
    draw.polygon([(10, 8), (8, 2), (14, 6)], fill="#111", outline="black") # Left
    draw.polygon([(22, 8), (24, 2), (18, 6)], fill="#111", outline="black") # Right

    # Eyes
    draw.ellipse((12, 10, 15, 13), fill=eyes_color)
    draw.ellipse((17, 10, 20, 13), fill=eyes_color)

    # Pupils
    draw.line((13.5, 10, 13.5, 13), fill="black", width=1)
    draw.line((18.5, 10, 18.5, 13), fill="black", width=1)

    # Tail
    draw.arc((20, 18, 30, 28), 0, 180, fill="#111", width=3)

    img = TextureGenerator.add_noise(img, 5)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")


def create_detailed_furniture(filename, type):
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

    # New Assets
    elif type == "toilet":
        # White ceramic
        # Base
        draw.ellipse((20, 40, 44, 52), fill="#EEE", outline="#CCC")
        # Bowl
        draw.ellipse((20, 32, 44, 44), fill="#FFF", outline="#CCC")
        # Tank
        draw.polygon([(24, 32), (40, 36), (40, 16), (24, 12)], fill="#EEE", outline="#CCC")

    elif type == "sink":
        # Pedestal
        draw.rectangle((28, 40, 36, 60), fill="#DDD")
        # Basin
        draw.polygon([(16, 32), (48, 40), (48, 28), (16, 20)], fill="#FFF", outline="#CCC")
        # Faucet
        draw.line((32, 24, 32, 16), fill="silver", width=2)

    elif type == "shower":
        # Base
        draw.polygon([(16, 32), (48, 48), (32, 60), (0, 44)], fill="#AED6F1", outline="#3498DB")
        # Glass Walls (suggested lines)
        draw.line((0, 44, 0, 10), fill="#FFFFFF80", width=1)
        draw.line((16, 32, 16, 0), fill="#FFFFFF80", width=1)
        # Head
        draw.line((16, 5, 24, 10), fill="silver", width=2)
        draw.ellipse((20, 8, 28, 14), fill="silver")

    elif type == "stove":
        # Box
        draw.polygon([(16, 32), (48, 40), (32, 52), (0, 44)], fill="#2C3E50", outline="black") # Top
        draw.polygon([(0, 44), (32, 52), (32, 64), (0, 56)], fill="#95A5A6", outline="black") # Front
        draw.polygon([(32, 52), (48, 40), (48, 52), (32, 64)], fill="#7F8C8D", outline="black") # Side
        # Burners
        draw.ellipse((4, 38, 14, 42), fill="black")
        draw.ellipse((20, 42, 30, 46), fill="black")

    elif type == "tv":
        # Stand
        draw.rectangle((20, 50, 44, 60), fill="#333")
        # Screen Body
        draw.polygon([(10, 30), (54, 38), (54, 10), (10, 2)], fill="#111", outline="#333")
        # Screen
        draw.polygon([(14, 28), (50, 35), (50, 13), (14, 6)], fill="#222")

    elif type == "plant":
        # Pot
        draw.polygon([(24, 48), (40, 52), (40, 40), (24, 36)], fill="#E67E22", outline="#D35400")
        # Leaves
        for i in range(5):
             ox = random.randint(24, 40)
             oy = random.randint(20, 40)
             draw.ellipse((ox-8, oy-8, ox+8, oy+8), fill="#2ECC71", outline="#27AE60")

    elif type == "rug":
        # Flat on floor
        draw.polygon([(10, 32), (54, 40), (44, 52), (0, 44)], fill="#8E44AD", outline="#9B59B6")

    img = TextureGenerator.add_noise(img, 10)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

def create_anomaly_assets():
    # Ghost
    # Ethereal, semi-transparent, blueish
    img = Image.new("RGBA", (32, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Body (Wobbly)
    points = [(8, 40), (4, 20), (10, 4), (22, 4), (28, 20), (24, 40)]
    # Tail
    points.extend([(16, 46), (8, 40)])

    draw.polygon(points, fill=(200, 220, 255, 150), outline=(255, 255, 255, 180))

    # Eyes (Hollow)
    draw.ellipse((10, 12, 14, 16), fill=(0,0,0,100))
    draw.ellipse((18, 12, 22, 16), fill=(0,0,0,100))

    img = TextureGenerator.add_noise(img, 5)
    img.save(os.path.join(ASSET_DIR, "ghost.png"))
    print("Generated ghost.png")

    # Glitch Overlay (Used for glitch entity)
    # A block of static noise
    img = Image.new("RGBA", (32, 48), (0,0,0,0))
    pixels = img.load()
    for x in range(32):
        for y in range(48):
            if random.random() < 0.8:
                r = random.randint(0, 255)
                g = random.randint(0, 50)
                b = random.randint(200, 255) # Purple/Blue tint
                pixels[x,y] = (r, g, b, 200)

    img.save(os.path.join(ASSET_DIR, "glitch.png"))
    print("Generated glitch.png")

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

    for item in ["fridge", "bed", "table", "chair", "sofa", "computer", "radio",
                 "toilet", "sink", "shower", "stove", "tv", "plant", "rug"]:
        create_detailed_furniture(f"{item}.png", item)

    # New Assets
    create_cat_asset("cat_luna.png", "lime")
    create_cat_asset("cat_evil.png", "red")

    create_anomaly_assets()

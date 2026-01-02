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

class IsoDraw:
    """Helper for drawing isometric shapes."""
    @staticmethod
    def draw_cube(draw, x, y, w, h, d, color_top, color_left, color_right, outline=None):
        """
        Draws an isometric cube at screen position x,y (bottom center of the object's footprint).
        w, h, d are dimensions in isometric space (roughly).
        This is a heuristic drawing, not true 3D projection.
        """
        # Center of the base
        # cx, cy = x, y

        # Dimensions are approximate pixels.
        # w = width (x-axis), d = depth (y-axis), h = height (z-axis)

        # Let's define the 3 visible faces relative to a center point.
        # Vertices of the front corner (bottom)
        # c_btm = (x, y)

        # This is hard to generalize without a proper projection matrix.
        # Let's stick to polygon drawing with "intuitive" coords relative to a 64x64 canvas.
        pass

def create_floor_tile(filename):
    img = Image.new("RGBA", (64, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    top_color = "#95a5a6"
    side_color = "#7f8c8d"
    highlight = "#bdc3c7"
    shadow = "#555555"

    diamond = [(32, 0), (64, 16), (32, 32), (0, 16)]

    tex = Image.new("RGBA", (64, 32), (0,0,0,0))
    tex_draw = ImageDraw.Draw(tex)
    tex_draw.polygon(diamond, fill=top_color)
    tex_draw.line((32, 0, 32, 32), fill=shadow, width=1)
    tex_draw.line((0, 16, 64, 16), fill=shadow, width=1)
    tex_draw.polygon([(32, 4), (60, 16), (32, 28), (4, 16)], outline=highlight)

    tex = TextureGenerator.add_noise(tex, 15)
    img.alpha_composite(tex, (0,0))

    left_face = [(0, 16), (32, 32), (32, 48), (0, 32)]
    draw.polygon(left_face, fill=side_color)
    right_face = [(32, 32), (64, 16), (64, 32), (32, 48)]
    draw.polygon(right_face, fill=side_color)
    draw.polygon(right_face, fill="#00000040")

    img = TextureGenerator.add_noise(img, 10)
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

def create_character(filename, color="red"):
    img = Image.new("RGBA", (32, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Shadow
    draw.ellipse((4, 40, 28, 46), fill="#00000080")

    # Pants (Dark Grey)
    draw.rounded_rectangle((6, 30, 26, 42), radius=2, fill="#2C3E50", outline="black")

    # Shirt (Color)
    draw.rounded_rectangle((4, 16, 28, 32), radius=4, fill=color, outline="black")

    # Head
    skin_color = "#ffccaa"
    draw.ellipse((4, 2, 28, 26), fill=skin_color, outline="black")

    # Hair
    hair_color = "#553311"
    draw.pieslice((4, 2, 28, 26), 180, 360, fill=hair_color, outline="black")

    # Eyes
    draw.rectangle((10, 12, 12, 14), fill="black")
    draw.rectangle((20, 12, 22, 14), fill="black")

    img = TextureGenerator.add_noise(img, 5)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

def create_detailed_furniture(filename, type):
    img = Image.new("RGBA", (64, 64), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    if type == "bed":
        # Better Isometric Bed
        # Frame
        draw.polygon([(16, 32), (48, 48), (32, 60), (0, 44)], fill="#5D2906", outline="black") # Side/Base
        # Mattress Top
        draw.polygon([(16, 24), (48, 40), (32, 52), (0, 36)], fill="#ECF0F1", outline="#BDC3C7")
        # Pillow (Top Left)
        draw.polygon([(4, 34), (16, 28), (24, 34), (12, 40)], fill="white", outline="#BDC3C7")
        # Blanket (Bottom half)
        draw.polygon([(24, 46), (48, 40), (32, 52), (8, 42)], fill="#E74C3C", outline="#C0392B")

    elif type == "table":
        # Top
        top = [(16, 24), (48, 32), (32, 48), (0, 40)]
        draw.polygon(top, fill="#8B4513", outline="#5D2906")
        # Thickness
        draw.polygon([(0, 40), (32, 48), (32, 52), (0, 44)], fill="#5D2906")
        draw.polygon([(32, 48), (48, 32), (48, 36), (32, 52)], fill="#3E1C02")
        # Legs
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
        draw.line((18, 20, 18, 30), fill="black", width=2) # Handle

    elif type == "sofa":
        # Base
        draw.polygon([(10, 32), (54, 40), (44, 52), (0, 44)], fill="#27ae60", outline="#1e8449")
        # Backrest
        draw.polygon([(10, 32), (54, 40), (54, 20), (10, 12)], fill="#2ecc71", outline="#1e8449")
        # Armrest Left
        draw.polygon([(0, 44), (10, 32), (10, 24), (0, 36)], fill="#2ecc71")
        # Armrest Right
        draw.polygon([(44, 52), (54, 40), (54, 32), (44, 44)], fill="#2ecc71")

    elif type == "chair":
        # Simple Chair
        # Seat
        draw.polygon([(20, 32), (44, 38), (32, 48), (8, 42)], fill="#8B4513", outline="#5D2906")
        # Backrest
        draw.polygon([(20, 32), (44, 38), (44, 18), (20, 12)], fill="#A0522D", outline="#5D2906")
        # Legs
        draw.line((8, 42, 8, 60), fill="#3E1C02", width=3)
        draw.line((32, 48, 32, 64), fill="#3E1C02", width=3)
        draw.line((44, 38, 44, 54), fill="#3E1C02", width=3)

    elif type == "computer":
        # Desk with PC
        # Desk Top
        draw.polygon([(10, 32), (54, 40), (44, 52), (0, 44)], fill="#95A5A6", outline="#7F8C8D")
        # Legs
        draw.line((0, 44, 0, 60), fill="#7F8C8D", width=3)
        draw.line((44, 52, 44, 64), fill="#7F8C8D", width=3)
        # Monitor
        draw.polygon([(20, 32), (40, 36), (40, 20), (20, 16)], fill="#2C3E50", outline="black")
        # Screen
        draw.polygon([(22, 30), (38, 34), (38, 22), (22, 18)], fill="#3498db")

    elif type == "radio":
        # Small box on floor/table. Let's draw it big enough to see.
        # Box
        draw.polygon([(20, 32), (44, 38), (44, 24), (20, 18)], fill="#8B4513", outline="black")
        # Side
        draw.polygon([(44, 38), (52, 32), (52, 18), (44, 24)], fill="#5D2906", outline="black")
        # Top
        draw.polygon([(20, 18), (44, 24), (52, 18), (28, 12)], fill="#A0522D", outline="black")
        # Speaker
        draw.ellipse((24, 22, 34, 32), fill="#111", outline="#333")

    img = TextureGenerator.add_noise(img, 10)
    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

if __name__ == "__main__":
    if not os.path.exists(ASSET_DIR):
        os.makedirs(ASSET_DIR)

    create_floor_tile("floor.png")
    create_wall_tile("wall_left.png", "left")
    create_wall_tile("wall_right.png", "right")

    create_character("char_red.png", "#e74c3c")
    create_character("char_blue.png", "#3498db")
    create_character("char_green.png", "#2ecc71")

    for item in ["fridge", "bed", "table", "chair", "sofa", "computer", "radio"]:
        create_detailed_furniture(f"{item}.png", item)

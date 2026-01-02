from PIL import Image, ImageDraw, ImageColor
import math
import os

ASSET_DIR = "static/assets"
TILE_WIDTH = 64
TILE_HEIGHT = 32 # This is the "top face" height in isometric projection.
# Total height of a tile image usually includes the vertical depth (walls, thickness).
# For a flat floor tile, we might add a little thickness.
# For a wall, it will be much taller.

# Isometric helper
# Convert grid (x,y) to screen (sx, sy) isn't needed here, we just draw the tile itself.
# A standard iso tile fits in a rectangle.
#     /\
#    /  \
#    \  /
#     \/

def create_floor_tile(filename, color="#555555", border="#444444"):
    # Standard tile size: 64x32
    # But let's give it some "thickness" so it looks like a slab.
    # Total image size: 64x48 (16px thickness)
    img = Image.new("RGBA", (64, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Coordinates for top face (rhombus)
    # Top: (32, 0)
    # Right: (64, 16)
    # Bottom: (32, 32)
    # Left: (0, 16)
    top_face = [(32, 0), (64, 16), (32, 32), (0, 16)]

    # Draw Thickness (Left side and Right side)
    # Left Side: (0,16) -> (32,32) -> (32, 48) -> (0, 32)
    left_face = [(0, 16), (32, 32), (32, 48), (0, 32)]

    # Right Side: (32,32) -> (64,16) -> (64, 32) -> (32, 48)
    right_face = [(32, 32), (64, 16), (64, 32), (32, 48)]

    # Darker shades for sides to simulate lighting
    c = ImageColor.getrgb(color)
    c_left = (max(0, c[0]-40), max(0, c[1]-40), max(0, c[2]-40))
    c_right = (max(0, c[0]-60), max(0, c[1]-60), max(0, c[2]-60))

    draw.polygon(left_face, fill=c_left, outline=border)
    draw.polygon(right_face, fill=c_right, outline=border)
    draw.polygon(top_face, fill=color, outline=border)

    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

def create_wall_tile(filename, side="left", color="#777777"):
    # A wall tile usually sits "behind" the floor tile in the grid sorting.
    # It needs to be tall.
    # Dimensions: 64 wide. Height?
    # If a floor is 32 high (top face), a wall usually extends up.
    # Let's make it 64x96.

    img = Image.new("RGBA", (64, 96), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Base rhombus (footprint) is same as floor: (32,64) to (64,80) etc.
    # We offset everything so the "bottom" aligns with where a floor would be.
    # The floor tile's "center" is at 32, 16 (in 0-32 space).
    # Let's assume the sprite origin is bottom-center specific.

    # Let's keep it simple:
    # A "Left Wall" corresponds to the X-axis edge.
    # A "Right Wall" corresponds to the Y-axis edge.

    c = ImageColor.getrgb(color)
    c_dark = (max(0, c[0]-30), max(0, c[1]-30), max(0, c[2]-30))

    if side == "left":
        # Wall along the "left" edge (bottom-left to center)
        # Face: (0, 80) -> (32, 96) -> (32, 16) -> (0, 0)
        # Shifted to fit image:
        # Left corner at (0, 64). Bottom corner (32, 80). Top corner (32, 0). Left-Top (0, 16 implied? No)

        # Let's draw a vertical plane aligned with the left grid edge.
        # Grid Left Edge: (0, 16) to (32, 32) relative to a 64x32 tile.
        # Wall extends UP from that.
        # Bottom-Left: (0, 16 + offset)
        # Bottom-Right: (32, 32 + offset)
        # Top-Right: (32, 32 + offset - height)
        # Top-Left: (0, 16 + offset - height)

        # We align the bottom of the wall with the floor.
        # Floor bottom is at Y=32 (for the top face) + thickness.

        # Let's say the wall is 64px tall.

        # Coordinates in 64x96 image.
        # Bottom anchor should be compatible with floor.
        # Floor center is at (32, 16) relative to its top-left.

        # Let's just draw a simple vertical slab.
        # Face visible: The "Right" side of the wall (facing camera).
        poly = [
            (0, 32),   # Bottom Left (Screen)
            (32, 48),  # Bottom Right (Center of tile)
            (32, 0),   # Top Right
            (0, -16)   # Top Left (Offscreen? Clip it)
        ]
        # Adjusted for 64x96 image where bottom anchor is consistent.
        # Let's center it.
        # "Left Wall" is the wall ON the left side of the room.
        # We see its face.

        poly = [
            (0, 48), (32, 64), (32, 16), (0, 0)
        ]
        draw.polygon(poly, fill=color, outline="#333")

    elif side == "right":
         poly = [
            (32, 64), (64, 48), (64, 0), (32, 16)
        ]
         draw.polygon(poly, fill=c_dark, outline="#333")

    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

def create_character(filename, color="red"):
    # Simple capsule/pawn shape
    img = Image.new("RGBA", (32, 48), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # Body
    draw.ellipse((8, 16, 24, 44), fill=color, outline="black")
    # Head
    draw.ellipse((8, 4, 24, 20), fill="#ffccaa", outline="black")

    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

def create_furniture(filename, type="fridge"):
    img = Image.new("RGBA", (64, 64), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    if type == "fridge":
        # Tall white box
        # Footprint at (16, 32) (48, 48) approx
        # Front face, Side face, Top face

        # Top
        draw.polygon([(32, 0), (48, 8), (32, 16), (16, 8)], fill="#eeeeee", outline="#ccc")
        # Left Side
        draw.polygon([(16, 8), (32, 16), (32, 56), (16, 48)], fill="#cccccc", outline="#aaa")
        # Right Side
        draw.polygon([(32, 16), (48, 8), (48, 48), (32, 56)], fill="#dddddd", outline="#aaa")

    elif type == "bed":
        # Flat rect
        # Top
        draw.polygon([(16, 24), (48, 32), (32, 48), (0, 40)], fill="#aa3333", outline="#550000")
        # Thickness
        draw.polygon([(0, 40), (32, 48), (32, 52), (0, 44)], fill="#550000") # Left
        draw.polygon([(32, 48), (48, 32), (48, 36), (32, 52)], fill="#330000") # Right

        # Pillow
        draw.polygon([(2, 38), (14, 44), (20, 38), (8, 32)], fill="white")

    img.save(os.path.join(ASSET_DIR, filename))
    print(f"Generated {filename}")

if __name__ == "__main__":
    if not os.path.exists(ASSET_DIR):
        os.makedirs(ASSET_DIR)

    create_floor_tile("floor.png", "#555566") # Concrete
    create_wall_tile("wall_left.png", "left", "#444455")
    create_wall_tile("wall_right.png", "right", "#333344")

    create_character("char_red.png", "#e74c3c")
    create_character("char_blue.png", "#3498db")
    create_character("char_green.png", "#2ecc71")

    create_furniture("fridge.png", "fridge")
    create_furniture("bed.png", "bed")

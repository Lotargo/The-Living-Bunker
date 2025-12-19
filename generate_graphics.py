import math
import random
from PIL import Image, ImageDraw

# Configuration
WIDTH, HEIGHT = 500, 500
BG_COLOR = (255, 255, 255)
MAIN_COLOR = (0, 0, 0)
ACCENT_COLOR = (128, 0, 32) # Burgundy #800020
FPS = 30
DURATION = 4 # seconds
TOTAL_FRAMES = FPS * DURATION
GRID_SIZE = 10
CELL_SIZE = WIDTH // GRID_SIZE
SHAPE_SIZE = CELL_SIZE * 0.6

# Animation Logic
# We want a loop: Order -> Chaos -> Order
# Chaos will be represented by random rotations and slight position offsets.
# We pre-calculate random values for each cell to ensure consistency.

random.seed(42)
cells = []
for x in range(GRID_SIZE):
    for y in range(GRID_SIZE):
        is_accent = random.random() < 0.1 # 10% chance of being burgundy

        # Random parameters for chaos
        chaos_rot_speed = random.uniform(-2, 2) * 360 # Total rotation in degrees
        chaos_offset_x = random.uniform(-20, 20)
        chaos_offset_y = random.uniform(-20, 20)

        cells.append({
            'gx': x, 'gy': y,
            'cx': x * CELL_SIZE + CELL_SIZE / 2,
            'cy': y * CELL_SIZE + CELL_SIZE / 2,
            'is_accent': is_accent,
            'chaos_rot': chaos_rot_speed,
            'chaos_off_x': chaos_offset_x,
            'chaos_off_y': chaos_offset_y
        })

def ease_in_out(t):
    # t is 0..1
    # Simple ease in out
    return t * t * (3 - 2 * t)

def get_state(frame_idx):
    """
    Returns the state of all cells at a given frame.
    t goes from 0 to 1.
    Cycle: Order (0) -> Chaos (0.5) -> Order (1)
    """
    progress = frame_idx / TOTAL_FRAMES

    # We want 0 -> 1 -> 0 cycle for the "chaos amount"
    # sin(0) = 0, sin(pi) = 0. Wait, sin(pi/2) is 1.
    # phase = 0..2PI
    phase = progress * 2 * math.pi
    chaos_amount = (1 - math.cos(phase)) / 2 # 0 at start, 1 at mid, 0 at end

    # Apply easing to chaos_amount for snappier transition
    chaos_amount = ease_in_out(chaos_amount)

    current_state = []
    for cell in cells:
        # Rotation:
        # Order: 0
        # Chaos: cell['chaos_rot'] * chaos_amount (but we want it to loop?)
        # Actually, let's just make them rotate.
        # Order: Aligned (0 rotation)
        # Chaos: Rotated randomly

        # Better Idea: Continuous rotation that aligns periodically?
        # Or just displacement?

        # Let's go with Displacement and Rotation.

        rot = cell['chaos_rot'] * chaos_amount
        ox = cell['chaos_off_x'] * chaos_amount
        oy = cell['chaos_off_y'] * chaos_amount

        current_state.append({
            'x': cell['cx'] + ox,
            'y': cell['cy'] + oy,
            'rot': rot,
            'color': ACCENT_COLOR if cell['is_accent'] else MAIN_COLOR,
            'size': SHAPE_SIZE
        })
    return current_state

# --- GIF Generation (Pillow) ---
frames = []
for i in range(TOTAL_FRAMES):
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    state = get_state(i)

    for s in state:
        # Draw rotated square
        # Compute corners
        half = s['size'] / 2
        corners = [
            (-half, -half), (half, -half), (half, half), (-half, half)
        ]

        # Rotate and translate
        rad = math.radians(s['rot'])
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)

        poly = []
        for cx, cy in corners:
            rx = cx * cos_a - cy * sin_a + s['x']
            ry = cx * sin_a + cy * cos_a + s['y']
            poly.append((rx, ry))

        draw.polygon(poly, fill=s['color'])

    frames.append(img)

# Save GIF
frames[0].save(
    'avatars/gif/chaos_order.gif',
    save_all=True,
    append_images=frames[1:],
    duration=1000/FPS,
    loop=0
)

# Save PNG (Frame 0 is Order, maybe Frame mid (Chaos) looks cooler?
# But usually avatar should be the start. Let's save the midpoint for "chaos" preview or start for "clean"?)
# User said "show chaos and order".
# Let's save the midpoint (Chaos) as the PNG so it looks interesting static.
mid_frame = TOTAL_FRAMES // 2
frames[mid_frame].save('avatars/png/chaos_order.png')


# --- SVG Generation ---
# For SVG, we can use SMIL <animate> or CSS @keyframes.
# Since we have complex per-particle logic (random noise), CSS Keyframes per particle is best.
# We will generate a <rect> for each cell, and give it a unique ID or inline style with keyframes.

svg_content = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">']
svg_content.append(f'<rect width="100%" height="100%" fill="white"/>')

# Define Styles / Keyframes
style_block = ["<style>"]

for i, cell in enumerate(cells):
    # Calculate keyframes matching the logic above
    # logic: chaos_amount = (1 - cos(t * 2pi))/2
    # We can sample this at 0%, 25%, 50%, 75%, 100%

    # We need to construct the transform string for CSS
    # transform: translate(tx, ty) rotate(deg)
    # Default (Order): translate(cx-half, cy-half) rotate(0)
    # NOTE: SVG rotation is around (0,0) unless specified.
    # Best to use transform-origin: center (but that's relative to element bounding box).

    # Center of square: cell['cx'], cell['cy']
    # Initial X, Y (top left for rect): cell['cx'] - half, cell['cy'] - half

    base_x = cell['cx'] - SHAPE_SIZE/2
    base_y = cell['cy'] - SHAPE_SIZE/2
    center_x = cell['cx']
    center_y = cell['cy']

    # We will animate 'transform'.
    # Use transform-box: fill-box; transform-origin: center; to make rotation easy.

    cls_name = f"c{i}"

    # Keyframes
    # 0% -> Chaos 0 -> x=0, y=0, rot=0
    # 50% -> Chaos 1 -> x=off_x, y=off_y, rot=max_rot
    # 100% -> Chaos 0 -> ...

    max_rot = cell['chaos_rot']
    off_x = cell['chaos_off_x']
    off_y = cell['chaos_off_y']

    # CSS Keyframe syntax
    kf = f"""
    @keyframes a{i} {{
        0%, 100% {{ transform: translate(0px, 0px) rotate(0deg); }}
        50% {{ transform: translate({off_x:.1f}px, {off_y:.1f}px) rotate({max_rot:.1f}deg); }}
    }}
    .{cls_name} {{
        fill: {'#800020' if cell['is_accent'] else 'black'};
        transform-box: fill-box;
        transform-origin: center;
        animation: a{i} {DURATION}s ease-in-out infinite;
    }}
    """
    style_block.append(kf)

style_block.append("</style>")
svg_content.append("\n".join(style_block))

# Draw Rects
for i, cell in enumerate(cells):
    base_x = cell['cx'] - SHAPE_SIZE/2
    base_y = cell['cy'] - SHAPE_SIZE/2
    svg_content.append(f'<rect class="c{i}" x="{base_x:.1f}" y="{base_y:.1f}" width="{SHAPE_SIZE}" height="{SHAPE_SIZE}" />')

svg_content.append('</svg>')

with open('avatars/svg/chaos_order.svg', 'w') as f:
    f.write("\n".join(svg_content))

print("Done.")

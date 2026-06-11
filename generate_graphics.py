import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from generators.animation import init_cells, get_state
from generators.gif_output import render_frame, render_gif, render_png
from generators.svg_output import render_svg

WIDTH, HEIGHT = 500, 500
BG_COLOR = (255, 255, 255)
FPS = 30
DURATION = 4
TOTAL_FRAMES = FPS * DURATION
GRID_SIZE = 10
CELL_SIZE = WIDTH // GRID_SIZE
SHAPE_SIZE = CELL_SIZE * 0.6

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'avatars')
GIF_DIR = os.path.join(OUTPUT_DIR, 'gif')
PNG_DIR = os.path.join(OUTPUT_DIR, 'png')
SVG_DIR = os.path.join(OUTPUT_DIR, 'svg')


def ensure_dirs():
    for d in [GIF_DIR, PNG_DIR, SVG_DIR]:
        os.makedirs(d, exist_ok=True)


def main():
    ensure_dirs()
    cells = init_cells(GRID_SIZE, CELL_SIZE, SHAPE_SIZE)

    frames = []
    for i in range(TOTAL_FRAMES):
        state = get_state(i, TOTAL_FRAMES, cells, SHAPE_SIZE)
        frames.append(render_frame(state, WIDTH, HEIGHT, BG_COLOR))

    render_gif(frames, os.path.join(GIF_DIR, 'chaos_order.gif'), FPS)
    render_png(frames[TOTAL_FRAMES // 2], os.path.join(PNG_DIR, 'chaos_order.png'))
    render_svg(cells, WIDTH, HEIGHT, SHAPE_SIZE, DURATION, os.path.join(SVG_DIR, 'chaos_order.svg'))

    print("Done.")


if __name__ == "__main__":
    main()

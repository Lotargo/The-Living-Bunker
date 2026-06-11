import math
import random
from typing import List, Dict, Any


def ease_in_out(t: float) -> float:
    return t * t * (3 - 2 * t)


def init_cells(grid_size: int, cell_size: int, shape_size: float) -> List[Dict[str, Any]]:
    random.seed(42)
    cells = []
    for x in range(grid_size):
        for y in range(grid_size):
            is_accent = random.random() < 0.1
            chaos_rot_speed = random.uniform(-2, 2) * 360
            chaos_offset_x = random.uniform(-20, 20)
            chaos_offset_y = random.uniform(-20, 20)
            cells.append({
                'gx': x, 'gy': y,
                'cx': x * cell_size + cell_size / 2,
                'cy': y * cell_size + cell_size / 2,
                'is_accent': is_accent,
                'chaos_rot': chaos_rot_speed,
                'chaos_off_x': chaos_offset_x,
                'chaos_off_y': chaos_offset_y
            })
    return cells


def get_state(frame_idx: int, total_frames: int, cells: List[Dict[str, Any]], shape_size: float) -> List[Dict[str, Any]]:
    progress = frame_idx / total_frames
    phase = progress * 2 * math.pi
    chaos_amount = ease_in_out((1 - math.cos(phase)) / 2)

    accent_color = (128, 0, 32)
    main_color = (0, 0, 0)

    current_state = []
    for cell in cells:
        rot = cell['chaos_rot'] * chaos_amount
        ox = cell['chaos_off_x'] * chaos_amount
        oy = cell['chaos_off_y'] * chaos_amount
        current_state.append({
            'x': cell['cx'] + ox,
            'y': cell['cy'] + oy,
            'rot': rot,
            'color': accent_color if cell['is_accent'] else main_color,
            'size': shape_size
        })
    return current_state

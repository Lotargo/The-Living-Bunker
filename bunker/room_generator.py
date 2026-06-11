"""
Room Generator - procedurally generates room layouts using Jinja2 templates.

Usage:
    from bunker.room_generator import RoomGenerator
    
    gen = RoomGenerator()
    room = gen.generate("kitchen", x=2, y=2)
    # Returns dict with furniture, doors, windows, props positions
"""

import json
import random
from pathlib import Path
from typing import Optional
from jinja2 import Environment, FileSystemLoader


TEMPLATES_DIR = Path(__file__).parent / "templates" / "rooms"


class RoomGenerator:
    def __init__(self):
        self.env = Environment(
            loader=FileSystemLoader(str(TEMPLATES_DIR)),
            trim_blocks=True,
            lstrip_blocks=True
        )
        self.room_configs = self._load_room_configs()

    def _load_room_configs(self) -> dict:
        """Base configurations for each room type."""
        return {
            "kitchen": {
                "floor": "floor_tile",
                "min_size": (8, 6),
                "max_size": (12, 10),
                "required_furniture": [
                    {"type": "fridge", "wall": "top", "offset": 1},
                    {"type": "stove", "wall": "top", "offset": 3},
                    {"type": "table", "center": True},
                ],
                "optional_furniture": [
                    {"type": "chair", "near": "table", "count": 2},
                    {"type": "crate", "wall": "bottom", "count": 1},
                    {"type": "barrel", "corner": True, "count": 1},
                ],
                "props": ["bottle", "papers"],
                "windows": {"min": 1, "max": 2, "walls": ["top", "right"]},
            },
            "livingroom": {
                "floor": "floor_wood",
                "min_size": (10, 8),
                "max_size": (14, 12),
                "required_furniture": [
                    {"type": "sofa", "wall": "left", "offset": 2},
                    {"type": "tv", "wall": "left", "offset": 8},
                    {"type": "bookshelf", "wall": "right", "offset": 1},
                ],
                "optional_furniture": [
                    {"type": "radio", "near": "sofa", "count": 1},
                    {"type": "table", "center": True, "count": 1},
                ],
                "props": ["rug", "plant", "mirror"],
                "windows": {"min": 1, "max": 3, "walls": ["top", "right", "bottom"]},
            },
            "bedroom": {
                "floor": "floor_wood",
                "min_size": (8, 6),
                "max_size": (10, 8),
                "required_furniture": [
                    {"type": "bed", "wall": "top", "offset": 1},
                ],
                "optional_furniture": [
                    {"type": "table", "wall": "right", "count": 1},
                    {"type": "chair", "near": "table", "count": 1},
                    {"type": "bookshelf", "wall": "bottom", "count": 1},
                ],
                "props": ["plant", "mirror"],
                "windows": {"min": 1, "max": 2, "walls": ["top", "right"]},
            },
            "bathroom": {
                "floor": "floor_tile",
                "min_size": (6, 5),
                "max_size": (8, 7),
                "required_furniture": [
                    {"type": "shower", "wall": "left", "offset": 1},
                    {"type": "toilet", "wall": "top", "offset": 2},
                    {"type": "sink", "wall": "top", "offset": 5},
                ],
                "optional_furniture": [],
                "props": ["mirror"],
                "windows": {"min": 0, "max": 1, "walls": ["top"]},
            },
            "lab": {
                "floor": "floor_concrete",
                "min_size": (8, 6),
                "max_size": (12, 10),
                "required_furniture": [
                    {"type": "computer", "wall": "top", "offset": 2},
                    {"type": "table", "wall": "top", "offset": 4},
                    {"type": "chair", "near": "table", "count": 1},
                ],
                "optional_furniture": [
                    {"type": "radio", "wall": "right", "count": 1},
                    {"type": "bookshelf", "wall": "bottom", "count": 1},
                ],
                "props": ["papers", "crate"],
                "windows": {"min": 0, "max": 1, "walls": ["top"]},
            },
            "corridor": {
                "floor": "floor_concrete",
                "min_size": (3, 6),
                "max_size": (4, 12),
                "required_furniture": [],
                "optional_furniture": [
                    {"type": "plant", "wall": "left", "count": 1},
                ],
                "props": ["papers"],
                "windows": {"min": 0, "max": 0, "walls": []},
            },
            "storage": {
                "floor": "floor_concrete",
                "min_size": (8, 6),
                "max_size": (10, 8),
                "required_furniture": [
                    {"type": "crate", "wall": "top", "offset": 1},
                    {"type": "crate", "wall": "top", "offset": 4},
                    {"type": "barrel", "wall": "left", "offset": 1},
                ],
                "optional_furniture": [
                    {"type": "crate", "wall": "bottom", "count": 2},
                    {"type": "barrel", "corner": True, "count": 1},
                    {"type": "table", "center": True, "count": 1},
                ],
                "props": ["bottle", "papers", "crate"],
                "windows": {"min": 0, "max": 1, "walls": ["top"]},
            },
            "medbay": {
                "floor": "floor_tile",
                "min_size": (8, 6),
                "max_size": (10, 8),
                "required_furniture": [
                    {"type": "bed", "wall": "top", "offset": 1},
                    {"type": "sink", "wall": "top", "offset": 5},
                    {"type": "table", "wall": "right", "offset": 2},
                ],
                "optional_furniture": [
                    {"type": "chair", "near": "table", "count": 1},
                    {"type": "bookshelf", "wall": "bottom", "count": 1},
                ],
                "props": ["mirror", "papers"],
                "windows": {"min": 1, "max": 2, "walls": ["top", "right"]},
            },
        }

    def generate(
        self,
        room_type: str,
        x: int = 0,
        y: int = 0,
        width: Optional[int] = None,
        height: Optional[int] = None,
        owner: Optional[str] = None,
        seed: Optional[int] = None,
    ) -> dict:
        """Generate a complete room layout."""
        if seed is not None:
            random.seed(seed)

        config = self.room_configs.get(room_type)
        if not config:
            raise ValueError(f"Unknown room type: {room_type}")

        w = width or random.randint(config["min_size"][0], config["max_size"][0])
        h = height or random.randint(config["min_size"][1], config["max_size"][1])

        furniture = self._place_furniture(config, w, h, owner)
        doors = self._place_doors(w, h)
        windows = self._place_windows(config, w, h)
        props = self._place_props(config, w, h, furniture)

        spawn_x = w // 2 if w > 4 else None
        spawn_y = h // 2 if h > 4 else None

        template = self.env.get_template("room_base.json.j2")
        room_json = template.render(
            name=room_type.capitalize(),
            room_type=room_type,
            x=x,
            y=y,
            width=w,
            height=h,
            floor_type=config["floor"],
            spawn_x=spawn_x,
            spawn_y=spawn_y,
            furniture=furniture,
            doors=doors,
            windows=windows,
            props=props,
        )

        return json.loads(room_json)

    def _place_furniture(self, config: dict, w: int, h: int, owner: Optional[str]) -> list:
        """Place furniture according to room config rules."""
        furniture = []
        occupied = set()

        for item in config["required_furniture"]:
            pos = self._find_position(item, w, h, occupied)
            if pos:
                entry = {
                    "id": f"{item['type'].capitalize()}_{len(furniture)}",
                    "type": f"{item['type']}.png",
                    "dx": pos[0],
                    "dy": pos[1],
                }
                if owner and item["type"] == "bed":
                    entry["owner"] = owner
                furniture.append(entry)
                occupied.add(pos)

        for item in config.get("optional_furniture", []):
            count = item.get("count", 1)
            for _ in range(count):
                if random.random() < 0.7:
                    pos = self._find_position(item, w, h, occupied)
                    if pos:
                        furniture.append({
                            "id": f"{item['type'].capitalize()}_{len(furniture)}",
                            "type": f"{item['type']}.png",
                            "dx": pos[0],
                            "dy": pos[1],
                        })
                        occupied.add(pos)

        return furniture

    def _find_position(self, item: dict, w: int, h: int, occupied: set) -> Optional[tuple]:
        """Find a valid position for furniture item."""
        margin = 1
        attempts = 0

        while attempts < 20:
            if "wall" in item:
                pos = self._pos_on_wall(item["wall"], item.get("offset", 1), w, h)
            elif "center" in item:
                pos = (w // 2 + random.randint(-1, 1), h // 2 + random.randint(-1, 1))
            elif "corner" in item:
                corners = [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2)]
                pos = random.choice(corners)
            else:
                pos = (
                    random.randint(margin, w - margin - 1),
                    random.randint(margin, h - margin - 1),
                )

            if (
                margin <= pos[0] < w - margin
                and margin <= pos[1] < h - margin
                and pos not in occupied
            ):
                return pos
            attempts += 1

        return None

    def _pos_on_wall(self, wall: str, offset: int, w: int, h: int) -> tuple:
        """Get position along a specific wall."""
        if wall == "top":
            return (offset, 1)
        elif wall == "bottom":
            return (offset, h - 2)
        elif wall == "left":
            return (1, offset)
        elif wall == "right":
            return (w - 2, offset)
        return (1, 1)

    def _place_doors(self, w: int, h: int) -> list:
        """Place 1-2 doors on room walls."""
        doors = []
        wall = random.choice(["right", "bottom"])

        if wall == "right":
            door_y = random.randint(2, h - 3)
            doors.append({"x": w, "y": door_y, "type": "door_open_frame_wood"})
        else:
            door_x = random.randint(2, w - 3)
            doors.append({"x": door_x, "y": h, "type": "door_open_frame_wood"})

        return doors

    def _place_windows(self, config: dict, w: int, h: int) -> list:
        """Place windows on allowed walls."""
        windows = []
        win_config = config.get("windows", {})
        count = random.randint(win_config.get("min", 0), win_config.get("max", 0))

        for _ in range(count):
            wall = random.choice(win_config.get("walls", []))
            if wall == "top":
                windows.append({"x": random.randint(2, w - 3), "y": 0, "type": "window_small.png"})
            elif wall == "right":
                windows.append({"x": w, "y": random.randint(2, h - 3), "type": "window_small.png"})
            elif wall == "bottom":
                windows.append({"x": random.randint(2, w - 3), "y": h, "type": "window_small.png"})

        return windows

    def _place_props(self, config: dict, w: int, h: int, furniture: list) -> list:
        """Place decorative props in empty spaces."""
        props = []
        occupied = {(f["dx"], f["dy"]) for f in furniture}
        prop_types = config.get("props", [])
        count = random.randint(1, min(3, len(prop_types) + 1))

        for _ in range(count):
            if not prop_types:
                break
            prop_type = random.choice(prop_types)
            attempts = 0
            while attempts < 10:
                pos = (
                    random.randint(1, w - 2),
                    random.randint(1, h - 2),
                )
                if pos not in occupied:
                    props.append({"type": f"{prop_type}.png", "x": pos[0], "y": pos[1]})
                    occupied.add(pos)
                    break
                attempts += 1

        return props


def generate_room_for_frontend(room_type: str, **kwargs) -> dict:
    """Convenience function to generate room data for frontend consumption."""
    gen = RoomGenerator()
    return gen.generate(room_type, **kwargs)

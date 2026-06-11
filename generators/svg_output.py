from typing import List, Dict, Any


def render_svg(
    cells: List[Dict[str, Any]],
    width: int,
    height: int,
    shape_size: float,
    duration: int,
    output_path: str
) -> None:
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">']
    svg.append(f'<rect width="100%" height="100%" fill="white"/>')

    style = ["<style>"]
    for i, cell in enumerate(cells):
        base_x = cell['cx'] - shape_size / 2
        base_y = cell['cy'] - shape_size / 2
        cls = f"c{i}"

        max_rot = cell['chaos_rot']
        off_x = cell['chaos_off_x']
        off_y = cell['chaos_off_y']
        fill = '#800020' if cell['is_accent'] else 'black'

        kf = f"""
        @keyframes a{i} {{
            0%, 100% {{ transform: translate(0px, 0px) rotate(0deg); }}
            50% {{ transform: translate({off_x:.1f}px, {off_y:.1f}px) rotate({max_rot:.1f}deg); }}
        }}
        .{cls} {{
            fill: {fill};
            transform-box: fill-box;
            transform-origin: center;
            animation: a{i} {duration}s ease-in-out infinite;
        }}
        """
        style.append(kf)

    style.append("</style>")
    svg.append("\n".join(style))

    for i, cell in enumerate(cells):
        base_x = cell['cx'] - shape_size / 2
        base_y = cell['cy'] - shape_size / 2
        svg.append(f'<rect class="c{i}" x="{base_x:.1f}" y="{base_y:.1f}" width="{shape_size}" height="{shape_size}" />')

    svg.append('</svg>')

    with open(output_path, 'w') as f:
        f.write("\n".join(svg))

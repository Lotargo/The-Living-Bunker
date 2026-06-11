const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer: Renderer = new Renderer('gameCanvas');
let pf: Pathfinding = new Pathfinding(GRID_SIZE);

initMap();

world.addResident(new Resident("Red", "Red", 15, 15));
world.addResident(new Resident("Blue", "Blue", 15, 17));
world.addResident(new Resident("Green", "Green", 15, 19));
world.addResident(new Resident("Luna", "Black", 10, 10, 'cat'));

for (let x: number = 0; x < GRID_SIZE; x++) {
    for (let y: number = 0; y < GRID_SIZE; y++) {
        if (world.map[x][y] === 1 && pf) pf.setObstacle(x, y);
    }
}

function isTileVisible(gx: number, gy: number): boolean {
    const pos: ScreenPos = renderer.isoToScreen(gx, gy);
    const margin: number = renderer.tileW * 2;
    return pos.x > -margin && pos.x < renderer.width + margin &&
           pos.y > -margin && pos.y < renderer.height + margin;
}

let cachedStaticList: RenderItem[] = [];

function rebuildStaticList(): void {
    cachedStaticList = [];
    world.objects.forEach(function(o: WorldObject): void {
        if (isTileVisible(o.x, o.y)) {
            cachedStaticList.push({ type: 'obj', ref: o, x: o.x, y: o.y, sortZ: o.x + o.y });
        }
    });
    world.walls.forEach(function(w: Wall): void {
        if (isTileVisible(w.x, w.y)) {
            cachedStaticList.push({ type: 'wall', ref: w, x: w.x, y: w.y, sortZ: w.x + w.y });
        }
    });
    world.clearStaticDirty();
}

function loop(): void {
    renderer.clear();

    for (let x: number = 0; x < GRID_SIZE; x++) {
        for (let y: number = 0; y < GRID_SIZE; y++) {
            if (!isTileVisible(x, y)) continue;
            const ft: number = world.floorTypes[x][y];
            let fSprite: string = 'floor.png';
            if (ft === FLOOR_WOOD) fSprite = 'floor_wood.png';
            if (ft === FLOOR_TILE) fSprite = 'floor_tile.png';
            renderer.drawTile(fSprite, x, y);
        }
    }

    world.residents.forEach(function(r: Resident): void { r.update(); });
    AnomalyManager.update();

    if (world.staticDirty) {
        rebuildStaticList();
    }

    let dynamicList: RenderItem[] = [];
    world.residents.forEach(function(r: Resident): void {
        if (isTileVisible(r.x, r.y)) {
            dynamicList.push({ type: 'res', ref: r, x: r.x, y: r.y, sortZ: r.x + r.y });
        }
    });
    world.anomalies.forEach(function(a: Anomaly): void {
        if (isTileVisible(a.x, a.y)) {
            dynamicList.push({ type: 'anomaly', ref: a, x: a.x, y: a.y, sortZ: a.x + a.y + 1 });
        }
    });

    const renderList: RenderItem[] = cachedStaticList.concat(dynamicList);
    renderList.sort(function(a: RenderItem, b: RenderItem): number { return a.sortZ - b.sortZ; });

    renderList.forEach(function(item: RenderItem): void {
        if (item.type === 'obj' || item.type === 'wall') {
            renderer.drawTile(item.ref.type, item.x, item.ref.y);
        } else if (item.type === 'res') {
            renderer.drawTile(item.ref.sprite, item.x, item.y);
            const thought: string = item.ref.state === 'THINKING' ? "..." : item.ref.lastThought;
            const display: string = thought.length > 20 ? thought.substring(0, 18) + '..' : thought;
            renderer.drawText(display, item.x, item.y, '#FFFFFF');
        } else if (item.type === 'anomaly') {
            if (item.ref.stage === 'ACTIVE' || item.ref.revealed) {
                renderer.drawTile(item.ref.sprite, item.x, item.y);
                if (item.ref.lastThought && item.ref.lastThought !== "Manifesting...") {
                    renderer.drawText(item.ref.lastThought.substring(0, 15), item.x, item.y, '#FF00FF');
                }
            }
        }
    });

    updateUI();
    requestAnimationFrame(loop);
}

const assetNames: string[] = [
    'floor.png', 'floor_wood.png', 'floor_tile.png',
    'wall_left.png', 'wall_right.png',
    'char_red.png', 'char_blue.png', 'char_green.png',
    'fridge.png', 'bed.png', 'table.png', 'chair.png', 'sofa.png', 'computer.png', 'radio.png',
    'toilet.png', 'sink.png', 'shower.png', 'stove.png', 'tv.png', 'plant.png', 'rug.png',
    'ghost.png', 'glitch.png', 'cat_luna.png', 'cat_evil.png'
];

renderer.loadAssets(assetNames, function(): void {
    loop();
});

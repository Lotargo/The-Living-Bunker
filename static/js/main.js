const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer('gameCanvas');
const pf = new Pathfinding(GRID_SIZE);

initMap();

world.residents.push(new Resident("Red", "Red", 15, 15));
world.residents.push(new Resident("Blue", "Blue", 15, 17));
world.residents.push(new Resident("Green", "Green", 15, 19));
world.residents.push(new Resident("Luna", "Black", 10, 10, 'cat'));

for(let x=0; x<GRID_SIZE; x++) {
    for(let y=0; y<GRID_SIZE; y++) {
        if (world.map[x][y] === 1 && pf) pf.setObstacle(x, y);
    }
}

function isTileVisible(gx, gy) {
    const pos = renderer.isoToScreen(gx, gy);
    const margin = renderer.tileW * 2;
    return pos.x > -margin && pos.x < renderer.width + margin &&
           pos.y > -margin && pos.y < renderer.height + margin;
}

function loop() {
    renderer.clear();

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            if (!isTileVisible(x, y)) continue;
            let ft = world.floorTypes[x][y];
            let fSprite = 'floor.png';
            if (ft === FLOOR_WOOD) fSprite = 'floor_wood.png';
            if (ft === FLOOR_TILE) fSprite = 'floor_tile.png';
            renderer.drawTile(fSprite, x, y);
        }
    }

    world.residents.forEach(function(r) { r.update(); });
    AnomalyManager.update();

    let renderList = [];
    world.objects.forEach(function(o) {
        if (isTileVisible(o.x, o.y)) {
            renderList.push({ type: 'obj', ref: o, x: o.x, y: o.y, sortZ: o.x + o.y });
        }
    });
    world.walls.forEach(function(w) {
        if (isTileVisible(w.x, w.y)) {
            renderList.push({ type: 'wall', ref: w, x: w.x, y: w.y, sortZ: w.x + w.y });
        }
    });
    world.residents.forEach(function(r) {
        if (isTileVisible(r.x, r.y)) {
            renderList.push({ type: 'res', ref: r, x: r.x, y: r.y, sortZ: r.x + r.y });
        }
    });
    world.anomalies.forEach(function(a) {
        if (isTileVisible(a.x, a.y)) {
            renderList.push({ type: 'anomaly', ref: a, x: a.x, y: a.y, sortZ: a.x + a.y + 1 });
        }
    });

    renderList.sort(function(a, b) { return a.sortZ - b.sortZ; });

    renderList.forEach(function(item) {
        if (item.type === 'obj' || item.type === 'wall') {
            renderer.drawTile(item.ref.type, item.x, item.ref.y);
        } else if (item.type === 'res') {
            renderer.drawTile(item.ref.sprite, item.x, item.y);
            const thought = item.ref.state === 'THINKING' ? "..." : item.ref.lastThought;
            const display = thought.length > 20 ? thought.substring(0, 18) + '..' : thought;
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

const assetNames = [
    'floor.png', 'floor_wood.png', 'floor_tile.png',
    'wall_left.png', 'wall_right.png',
    'char_red.png', 'char_blue.png', 'char_green.png',
    'fridge.png', 'bed.png', 'table.png', 'chair.png', 'sofa.png', 'computer.png', 'radio.png',
    'toilet.png', 'sink.png', 'shower.png', 'stove.png', 'tv.png', 'plant.png', 'rug.png',
    'ghost.png', 'glitch.png', 'cat_luna.png', 'cat_evil.png'
];

renderer.loadAssets(assetNames, function() {
    loop();
});

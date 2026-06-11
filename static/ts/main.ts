const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer: Renderer = new Renderer('gameCanvas');
let pf: Pathfinding = new Pathfinding(GRID_SIZE);
let constructorCtrl: ConstructorController;
let currentLayout: RoomLayout | null = null;

initMap();

function restartSimulation(): void {
    world.resetMap(GRID_SIZE);
    world.resetRooms();
    world.resetWalls();
    world.resetObjects();
    world.resetResidents();
    world.resetAnomalies();
    world.setAtmosphere('Normal');
    pf = new Pathfinding(GRID_SIZE);

    proceduralGen.generateBunkerLayout().then(layout => {
        currentLayout = layout;
        proceduralGen.buildLayout(layout, () => {
            world.addResident(new Resident("Red", "Red", 15, 15));
            world.addResident(new Resident("Blue", "Blue", 15, 17));
            world.addResident(new Resident("Green", "Green", 15, 19));
            world.addResident(new Resident("Luna", "Black", 10, 10, 'cat'));
            syncPathfindingObstacles();
            rebuildStaticList();
        });
    }).catch(err => {
        console.error('Procedural generation failed, using static layout:', err);
        initMap();
        world.addResident(new Resident("Red", "Red", 15, 15));
        world.addResident(new Resident("Blue", "Blue", 15, 17));
        world.addResident(new Resident("Green", "Green", 15, 19));
        world.addResident(new Resident("Luna", "Black", 10, 10, 'cat'));
        syncPathfindingObstacles();
        rebuildStaticList();
    });
}

function continueSimulation(): void {
    world.resetMap(GRID_SIZE);
    world.resetRooms();
    world.resetWalls();
    world.resetObjects();
    world.resetResidents();
    world.resetAnomalies();
    world.setAtmosphere('Normal');
    pf = new Pathfinding(GRID_SIZE);

    if (currentLayout) {
        proceduralGen.buildLayout(currentLayout, () => {
            world.addResident(new Resident("Red", "Red", 15, 15));
            world.addResident(new Resident("Blue", "Blue", 15, 17));
            world.addResident(new Resident("Green", "Green", 15, 19));
            world.addResident(new Resident("Luna", "Black", 10, 10, 'cat'));
            syncPathfindingObstacles();
            rebuildStaticList();
        });
    } else {
        initMap();
        world.addResident(new Resident("Red", "Red", 15, 15));
        world.addResident(new Resident("Blue", "Blue", 15, 17));
        world.addResident(new Resident("Green", "Green", 15, 19));
        world.addResident(new Resident("Luna", "Black", 10, 10, 'cat'));
        syncPathfindingObstacles();
        rebuildStaticList();
    }
}

function showMainMenu(): void {
    Runtime.paused = true;
    BrainClient.clearQueue();
    document.getElementById('main-menu')!.classList.remove('hidden');
}

function syncPathfindingObstacles(): void {
    for (let x: number = 0; x < GRID_SIZE; x++) {
        for (let y: number = 0; y < GRID_SIZE; y++) {
            if (world.map[x][y] === 1 && pf) pf.setObstacle(x, y);
        }
    }
}

function isTileVisible(gx: number, gy: number): boolean {
    const pos: ScreenPos = renderer.isoToScreen(gx, gy);
    const margin: number = renderer.tileW * 2;
    return pos.x > -margin && pos.x < renderer.width + margin &&
           pos.y > -margin && pos.y < renderer.height + margin;
}

let cachedStaticList: RenderItem[] = [];
let cachedStaticViewVersion: number = -1;
let lastUiUpdate: number = 0;

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
    cachedStaticViewVersion = renderer.viewVersion;
}

function loop(): void {
    Runtime.frame++;
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

    if (!Runtime.paused) {
        world.residents.forEach(function(r: Resident): void { r.update(); });
        AnomalyManager.update();
        BunkerMoments.update();
    }

    if (world.staticDirty || cachedStaticViewVersion !== renderer.viewVersion) {
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
            const frame: SpriteFrameConfig | null = item.ref.getSpriteFrame();
            if (frame) {
                renderer.drawSpriteFrame(frame.image, item.x, item.y, frame.frameW, frame.frameH, Math.floor(item.ref.animationTick / 8), frame.scale || 1);
            } else {
                renderer.drawTile(item.ref.sprite, item.x, item.y);
            }
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

    const now: number = performance.now();
    if (now - lastUiUpdate >= UI.UPDATE_INTERVAL_MS) {
        updateUI();
        lastUiUpdate = now;
    }
    requestAnimationFrame(loop);
}

const assetNames: string[] = [
    'floor.png', 'floor_wood.png', 'floor_tile.png',
    'wall_left.png', 'wall_right.png',
    'char_red.png', 'char_blue.png', 'char_green.png',
    'fridge.png', 'bed.png', 'table.png', 'chair.png', 'sofa.png', 'computer.png', 'radio.png',
    'toilet.png', 'sink.png', 'shower.png', 'stove.png', 'tv.png', 'plant.png', 'rug.png',
    'ghost.png', 'glitch.png', 'cat_luna.png', 'cat_evil.png',
    'vendor/characters/village_man_idle_down.png',
    'vendor/characters/village_man_idle_up.png',
    'vendor/characters/village_man_walk_down.png',
    'vendor/characters/village_man_walk_left.png',
    'vendor/characters/village_man_walk_right.png',
    'vendor/characters/village_man_walk_up.png',
    'vendor/characters/female_villager_idle_down.png',
    'vendor/characters/female_villager_idle_up.png',
    'vendor/characters/female_villager_walk_down.png',
    'vendor/characters/female_villager_walk_left.png',
    'vendor/characters/female_villager_walk_right.png',
    'vendor/characters/female_villager_walk_up.png',
    'vendor/characters/luna_idle.png',
    'vendor/characters/luna_box.png',
    'vendor/characters/dracula_cat_walk.png',
    'vendor/monsters/bat_idle_down.png',
    'vendor/monsters/bat_idle_up.png',
    'vendor/monsters/bat_walk_down.png',
    'vendor/monsters/bat_walk_up.png',
    'vendor/monsters/bat_walk_left.png',
    'vendor/monsters/bat_walk_right.png',
    'vendor/monsters/bat_attack_down.png',
    'vendor/monsters/bat_hit_down.png',
    'vendor/monsters/bat_die_down.png',
    'vendor/interior/floor_wood.png',
    'vendor/interior/floor_concrete.png',
    'vendor/interior/floor_tile.png',
    'vendor/interior/wall.png',
    'vendor/interior/fridge.png',
    'vendor/interior/stove.png',
    'vendor/interior/bathtub.png',
    'vendor/interior/toilet.png',
    'vendor/interior/mirror.png',
    'vendor/interior/table.png',
    'vendor/interior/sofa.png',
    'vendor/interior/bookshelf.png',
    'vendor/interior/bed.png',
    'vendor/interior/chair.png',
    'vendor/interior/bottle.png',
    'vendor/interior/plant_small.png',
    'vendor/interior/crate.png',
    'vendor/interior/papers.png',
    'vendor/interior/barrel.png',
    'vendor/interior/door_wood_dark.png',
    'vendor/interior/door_wood_medium.png',
    'vendor/interior/door_wood_light.png',
    'vendor/interior/door_open_frame_wood.png',
    'vendor/interior/door_open_frame_brick.png',
    'vendor/interior/door_open_frame_stone.png',
    'vendor/interior/window_small.png',
    'vendor/interior/window_medium.png',
    'vendor/interior/window_large.png',
    'vendor/interior/window_small_curtain.png',
    'vendor/interior/window_medium_curtain.png',
    'vendor/interior/window_large_curtain.png',
    'vendor/interior/window_small_frost.png',
    'vendor/interior/window_medium_frost.png',
    'vendor/interior/window_large_frost.png',
    'vendor/interior/stairs_wood.png',
    'vendor/interior/stairs_wood_railing.png'
];

renderer.loadAssets(assetNames, function(): void {
    restartSimulation();
    MainMenu.init();
    constructorCtrl = new ConstructorController();
    loop();
});

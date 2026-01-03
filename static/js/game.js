const GRID_SIZE = 32;
const TILE_SIZE = 64;

// Expanded World State
const world = {
    residents: [],
    anomalies: [],
    objects: [],
    walls: [],
    map: [],
    floorTypes: [],
    atmosphere: "Normal"
};

function initMap() {
    // 0: Concrete, 2: Wood, 3: Tile
    world.map = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    world.floorTypes = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

    function buildRoom(x, y, w, h, floorType, wallType) {
        for(let i=x; i<x+w; i++) {
            for(let j=y; j<y+h; j++) {
                if(i>=0 && i<GRID_SIZE && j>=0 && j<GRID_SIZE) {
                    world.floorTypes[i][j] = floorType;
                }
            }
        }
        for(let i=x; i<x+w; i++) {
             world.walls.push({ x: i, y: y, type: 'wall_right.png' });
             world.map[i][y] = 1;
             world.walls.push({ x: i, y: y+h, type: 'wall_right.png' });
             world.map[i][y+h] = 1;
        }
        for(let j=y; j<y+h; j++) {
             world.walls.push({ x: x, y: j, type: 'wall_left.png' });
             world.map[x][j] = 1;
             world.walls.push({ x: x+w, y: j, type: 'wall_left.png' });
             world.map[x+w][j] = 1;
        }
    }

    world.walls = [];
    // Kitchen
    buildRoom(2, 2, 10, 8, 3, 'wall');
    world.objects.push({ id: 'Fridge', x: 3, y: 3, type: 'fridge.png' });
    world.objects.push({ id: 'Stove', x: 5, y: 3, type: 'stove.png' });
    world.objects.push({ id: 'Table', x: 7, y: 6, type: 'table.png' });
    world.objects.push({ id: 'Chair1', x: 6, y: 6, type: 'chair.png' });
    world.objects.push({ id: 'Chair2', x: 8, y: 6, type: 'chair.png' });

    // Living Room
    buildRoom(2, 10, 10, 12, 2, 'wall');
    world.objects.push({ id: 'Rug1', x: 7, y: 16, type: 'rug.png' });
    world.objects.push({ id: 'Sofa1', x: 4, y: 14, type: 'sofa.png' });
    world.objects.push({ id: 'TV', x: 4, y: 20, type: 'tv.png' });
    world.objects.push({ id: 'Plant1', x: 10, y: 11, type: 'plant.png' });
    world.objects.push({ id: 'Radio', x: 9, y: 18, type: 'radio.png' });

    // Bathroom
    buildRoom(2, 22, 10, 8, 3, 'wall');
    world.objects.push({ id: 'Shower', x: 3, y: 23, type: 'shower.png' });
    world.objects.push({ id: 'Toilet', x: 6, y: 23, type: 'toilet.png' });
    world.objects.push({ id: 'Sink', x: 9, y: 23, type: 'sink.png' });

    // Bedroom 1 (Red)
    buildRoom(20, 2, 10, 8, 2, 'wall');
    world.objects.push({ id: 'Bed_Red', x: 22, y: 3, type: 'bed.png', owner: 'Red' });
    world.objects.push({ id: 'Desk1', x: 28, y: 4, type: 'table.png' });

    // Bedroom 2 (Blue)
    buildRoom(20, 12, 10, 8, 2, 'wall');
    world.objects.push({ id: 'Bed_Blue', x: 22, y: 13, type: 'bed.png', owner: 'Blue' });
    world.objects.push({ id: 'Plant2', x: 29, y: 13, type: 'plant.png' });

    // Lab / Bedroom 3 (Green)
    buildRoom(20, 22, 10, 8, 0, 'wall');
    world.objects.push({ id: 'Bed_Green', x: 28, y: 28, type: 'bed.png', owner: 'Green' });
    world.objects.push({ id: 'Computer', x: 22, y: 23, type: 'computer.png' });
    world.objects.push({ id: 'ChairLab', x: 23, y: 24, type: 'chair.png' });

    function makeDoor(x, y) {
        world.walls = world.walls.filter(w => !(w.x === x && w.y === y));
        world.map[x][y] = 0;
    }

    makeDoor(12, 6); makeDoor(12, 7);
    makeDoor(12, 16); makeDoor(12, 17);
    makeDoor(12, 26);
    makeDoor(20, 6);
    makeDoor(20, 16);
    makeDoor(20, 26);
}

class Resident {
    constructor(name, color, startX, startY, type="resident") {
        this.name = name;
        this.color = color;
        this.x = startX;
        this.y = startY;
        this.type = type; // resident or cat
        if (type === 'cat') {
            this.sprite = 'cat_luna.png';
        } else {
            this.sprite = `char_${color.toLowerCase()}.png`;
        }

        this.state = "IDLE";
        this.path = [];
        this.target = null;

        this.needs = {
            hunger: 50,
            energy: 60,
            fun: 50,
            hygiene: 50
        };
        this.health = 100;

        this.lastThought = "Initializing...";
        this.actionQueue = [];
        this.cooldown = 0;
    }

    update(dt) {
        // Needs Decay
        this.needs.hunger += 0.03;
        this.needs.energy -= 0.01;
        this.needs.fun -= 0.02;
        this.needs.hygiene -= 0.02;

        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        if (this.state === "MOVING") {
            this.moveAlongPath();
        } else if (this.state === "IDLE") {
            if (this.actionQueue.length > 0) {
                const nextAction = this.actionQueue.shift();
                this.executeAction(nextAction);
            } else {
                if (Math.random() < 0.02 || this.needs.hunger > 70 || this.needs.energy < 30) {
                    this.think();
                }
            }
        }
    }

    moveAlongPath() {
        if (this.path.length === 0) {
            this.state = "IDLE";
            return;
        }
        const next = this.path[0];
        const speed = this.type === 'cat' ? 0.15 : 0.1; // Cat is faster
        const dx = next.x - this.x;
        const dy = next.y - this.y;

        if (Math.abs(dx) < speed && Math.abs(dy) < speed) {
            this.x = next.x;
            this.y = next.y;
            this.path.shift();
        } else {
            this.x += Math.sign(dx) * speed;
            this.y += Math.sign(dy) * speed;
        }
    }

    async think() {
        this.state = "THINKING";

        let nearby = world.objects.map(o => {
            return {
                id: o.id,
                type: o.type,
                dist: Math.abs(o.x - this.x) + Math.abs(o.y - this.y)
            };
        }).sort((a,b) => a.dist - b.dist).slice(0, 8);

        // Residents see "Active" anomalies. Cat sees all.
        let visibleAnomalies = world.anomalies.map(a => ({
             type: a.type,
             stage: a.stage,
             dist: Math.abs(a.x - this.x) + Math.abs(a.y - this.y)
        })).filter(a => {
            if (this.type === 'cat') return a.dist < 15; // Cat sees everything
            return a.stage === 'ACTIVE' && a.dist < 10;
        });

        // Add Cat to nearby logic for humans
        if (this.type !== 'cat') {
            const luna = world.residents.find(r => r.name === 'Luna');
            if (luna && (Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y)) < 8) {
                nearby.push({ id: 'Luna', type: 'Cat', behavior: luna.lastThought }); // "Meow..."
            }
        }

        const context = {
            name: this.name,
            state: "IDLE",
            needs: this.needs,
            health: this.health,
            nearby: nearby.map(o => ({ id: o.id, type: o.type, behavior: o.behavior })),
            anomalies: visibleAnomalies,
            atmosphere: world.atmosphere
        };

        try {
            const res = await fetch('/api/decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context)
            });
            const decision = await res.json();

            this.lastThought = decision.thought || "No thought";
            addLog(this.name, `"${this.lastThought}"`);

            this.processDecision(decision);

        } catch (e) {
            console.error(e);
            this.state = "IDLE";
            this.cooldown = 100;
        }
    }

    processDecision(d) {
        const target = d.target;

        if (d.action === "MOVE") {
            this.actionQueue.push({ type: 'MOVE', target: target });
        }
        else if (d.action === "STARE") {
             // Cat staring at anomaly
             this.state = "IDLE";
             this.cooldown = 60;
             addLog(this.name, "Stares intently at nothing...");
        }
        else if (["EAT", "SLEEP", "SIT", "PLAY", "LISTEN", "USE", "SHOWER", "WATCH", "INSPECT", "HISS", "PURR"].includes(d.action)) {
            const targetObj = world.objects.find(o => o.id === target);
            if (targetObj) {
                const dist = Math.abs(targetObj.x - this.x) + Math.abs(targetObj.y - this.y);
                if (dist > 1.5) {
                    this.actionQueue.push({ type: 'MOVE', target: target });
                }
                this.actionQueue.push({ type: 'INTERACT', action: d.action, target: target });
            } else {
                 this.actionQueue.push({ type: 'WAIT', duration: 30 });
            }
        }
        else {
            this.actionQueue.push({ type: 'WAIT', duration: 30 });
        }
        this.state = "IDLE";
    }

    executeAction(act) {
        if (act.type === 'MOVE') {
            let tx, ty;
            const targetObj = world.objects.find(o => o.id === act.target);
            const targetRes = world.residents.find(r => r.name === act.target);

            if (targetObj) {
                tx = targetObj.x;
                ty = targetObj.y;
            } else if (targetRes) {
                tx = targetRes.x;
                ty = targetRes.y;
            } else if (act.target === 'random') {
                 tx = Math.floor(Math.random() * GRID_SIZE);
                 ty = Math.floor(Math.random() * GRID_SIZE);
            } else {
                 return;
            }

            const path = pf.findPath(Math.round(this.x), Math.round(this.y), tx, ty);
            if (path && path.length > 0) {
                this.path = path;
                this.state = "MOVING";
            } else {
                // addLog(this.name, "Can't reach target.");
            }
        }
        else if (act.type === 'INTERACT') {
            const op = act.action;
            this.cooldown = 100;

            if (op === 'EAT') {
                this.needs.hunger = Math.max(0, this.needs.hunger - 50);
            } else if (op === 'SLEEP') {
                this.needs.energy = 100;
                this.cooldown = 300;
            } else if (op === 'SIT' || op === 'PLAY' || op === 'USE' || op === 'LISTEN' || op === 'WATCH') {
                this.needs.fun += 20;
            }
        }
        else if (act.type === 'WAIT') {
            this.cooldown = act.duration;
        }
    }
}

class Anomaly {
    constructor(type, x, y) {
        this.type = type; // Ghost, Glitch, Doppelganger
        this.x = x;
        this.y = y;
        this.lifespan = 800 + Math.random() * 500;
        this.stage = 'GESTATING'; // Invisible initially
        this.gestationTimer = 200 + Math.random() * 300; // How long it stays invisible

        this.goal = "Cause confusion";
        this.lastThought = "Manifesting...";
        this.cooldown = 0;
        this.revealed = false; // For Doppelganger

        if (type === 'Ghost') this.sprite = 'ghost.png';
        if (type === 'Glitch') this.sprite = 'glitch.png';
        if (type === 'Doppelganger') this.sprite = 'cat_luna.png'; // Mimic
    }

    update() {
        this.lifespan--;
        if (this.lifespan <= 0) return false;

        // Gestation Phase
        if (this.stage === 'GESTATING') {
            this.gestationTimer--;
            if (this.gestationTimer <= 0) {
                this.stage = 'ACTIVE';
                addLog("SYSTEM", `ANOMALY MANIFESTED: ${this.type}`);
                world.atmosphere = "Heavy Static";
            } else {
                // Precursor Effects (Atmosphere)
                if (Math.random() < 0.005) {
                    world.atmosphere = "Cold Draft";
                }
            }
            return true;
        }

        // Active Phase
        if (this.cooldown > 0) {
            this.cooldown--;
            return true;
        }

        // Doppelganger specific death
        if (this.type === 'Doppelganger') {
            const luna = world.residents.find(r => r.name === 'Luna');
            const dist = Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y);
            if (dist < 4) {
                addLog("Doppelgänger", "SCREEECH! (Dissolves upon meeting original)");
                return false; // Dies
            }
        }

        if (Math.random() < 0.03) {
            this.think();
        } else {
            this.x += (Math.random() - 0.5) * 0.2;
            this.y += (Math.random() - 0.5) * 0.2;
        }
        return true;
    }

    async think() {
        // Find Luna dist
        const luna = world.residents.find(r => r.name === 'Luna');
        const lunaDist = luna ? (Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y)) : 999;

        const context = {
            type: 'anomaly',
            anomalyType: this.type,
            stage: this.stage,
            lifespan: Math.floor(this.lifespan),
            nearbyResidents: world.residents.map(r => r.name),
            lunaDist: lunaDist
        };

        try {
            const res = await fetch('/api/decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context)
            });
            const decision = await res.json();
            this.lastThought = decision.thought || "...";

            // Log only if audible
            if (this.stage === 'ACTIVE') {
                 addLog(this.type, `Said: "${this.lastThought}"`);
            }

            if (decision.reveal && this.type === 'Doppelganger') {
                this.revealed = true;
                this.sprite = 'cat_evil.png';
                addLog("Doppelgänger", "REVEALS TRUE FORM!");
                this.lifespan = 50; // Instantly unstable

                // Damage nearby
                world.residents.forEach(r => {
                    if (Math.abs(r.x - this.x) < 5) {
                         r.health -= 20;
                         addLog(r.name, "Takes psychic damage!");
                    }
                });
            }

            if (decision.action === 'HAUNT' || decision.action === 'MOVE' || decision.action === 'MIMIC') {
                if (world.residents.length > 0) {
                    const target = world.residents[Math.floor(Math.random() * world.residents.length)];
                    this.x = target.x + (Math.random() - 0.5) * 4;
                    this.y = target.y + (Math.random() - 0.5) * 4;
                }
            }
            this.cooldown = 60;
        } catch(e) {
            console.error(e);
        }
    }
}

// Anomaly Manager
const AnomalyManager = {
    spawnChance: 0.002,
    update: () => {
        world.anomalies = world.anomalies.filter(a => a.update());

        if (world.anomalies.length === 0) world.atmosphere = "Normal";

        if (Math.random() < AnomalyManager.spawnChance && world.anomalies.length < 2) {
            const types = ['Ghost', 'Glitch', 'Doppelganger'];
            const type = types[Math.floor(Math.random() * types.length)];
            const x = Math.random() * GRID_SIZE;
            const y = Math.random() * GRID_SIZE;
            world.anomalies.push(new Anomaly(type, x, y));
            // No log yet, it starts invisible
        }
    }
};

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
        if (world.map[x][y] === 1) pf.setObstacle(x, y);
    }
}

function addLog(who, msg) {
    const log = document.getElementById('logs');
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.innerHTML = `<b>${who}:</b> ${msg}`;
    log.prepend(div);
}

function updateUI() {
    const list = document.getElementById('residents-list');
    list.innerHTML = '';
    // Atmosphere
    const atm = document.createElement('div');
    atm.innerHTML = `<b>Atmosphere:</b> ${world.atmosphere}`;
    list.appendChild(atm);

    world.residents.forEach(r => {
        const div = document.createElement('div');
        div.className = 'resident-card';
        if (r.type === 'cat') div.style.border = "1px solid #9b59b6";

        div.innerHTML = `
            <h4>${r.name}</h4>
            <div style="font-size:10px">${r.lastThought}</div>
            <div class="bar-container" title="Hunger"><div class="bar-fill" style="width:${r.needs.hunger}%; background:#e74c3c;"></div></div>
            <div class="bar-container" title="Health"><div class="bar-fill" style="width:${r.health}%; background:#c0392b;"></div></div>
        `;
        list.appendChild(div);
    });
}

function loop() {
    renderer.clear();

    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            let ft = world.floorTypes[x][y];
            let fSprite = 'floor.png';
            if (ft === 2) fSprite = 'floor_wood.png';
            if (ft === 3) fSprite = 'floor_tile.png';
            renderer.drawTile(fSprite, x, y);
        }
    }

    world.residents.forEach(r => r.update());
    AnomalyManager.update();

    let renderList = [];
    world.objects.forEach(o => { renderList.push({ type: 'obj', ref: o, x: o.x, y: o.y, sortZ: o.x + o.y }); });
    world.walls.forEach(w => { renderList.push({ type: 'wall', ref: w, x: w.x, y: w.y, sortZ: w.x + w.y }); });
    world.residents.forEach(r => { renderList.push({ type: 'res', ref: r, x: r.x, y: r.y, sortZ: r.x + r.y }); });
    world.anomalies.forEach(a => {
        // Only render if active OR if using cheat/cat vision (but here we only render what player sees)
        // Actually player sees everything?
        // User request: "Gestating... visible/detectable by cat".
        // Player should probably see a "distortion" or nothing?
        // Let's make Gestating faint ghost or nothing.
        // "Invisible to humans" -> Invisible to player? Usually player is observer.
        // Let's render Gestating as semi-transparent shadow.
        renderList.push({ type: 'anomaly', ref: a, x: a.x, y: a.y, sortZ: a.x + a.y + 1 });
    });

    renderList.sort((a, b) => a.sortZ - b.sortZ);

    renderList.forEach(item => {
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
            } else {
                // Gestating - Invisible to player or maybe very faint?
                // Let's leave it invisible to player for the surprise factor.
                // But debugging needs to know.
                // renderer.drawText("?", item.x, item.y, '#555');
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

renderer.loadAssets(assetNames, () => {
    console.log("Assets Loaded");
    loop();
});

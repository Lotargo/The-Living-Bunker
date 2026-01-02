const GRID_SIZE = 20;
const TILE_SIZE = 64;

// Expanded World State
const world = {
    residents: [],
    objects: [],
    walls: [], // For room separation (visual + collision)
    map: []
};

// Map Layout Definition (Rooms)
// 0: Floor, 1: Wall
// Let's procedurally generate a layout
function initMap() {
    // Fill floor
    world.map = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));

    // Define Rooms (Walls)
    // Vertical Wall at x=10 (splitting Left/Right)
    for (let y = 0; y < GRID_SIZE; y++) {
        if (y !== 4 && y !== 15) { // Doors
             world.map[10][y] = 1;
             world.walls.push({ x: 10, y: y, type: 'wall_left.png' }); // Visual placeholder logic
        }
    }

    // Horizontal Wall at y=10 (splitting Top/Bottom)
    for (let x = 0; x < GRID_SIZE; x++) {
        if (x !== 4 && x !== 15) { // Doors
            world.map[x][10] = 1;
            // Visuals for internal walls need care, let's just use obstacles for now
            // world.walls.push({ x: x, y: 10, type: 'wall_right.png' });
        }
    }

    // Room 1 (Top Left): Kitchen
    world.objects.push({ id: 'Fridge', x: 2, y: 2, type: 'fridge.png' });
    world.objects.push({ id: 'KitchenTable', x: 5, y: 5, type: 'table.png' });
    world.objects.push({ id: 'Chair1', x: 4, y: 5, type: 'chair.png' });
    world.objects.push({ id: 'Chair2', x: 6, y: 5, type: 'chair.png' });

    // Room 2 (Top Right): Bedroom
    world.objects.push({ id: 'Bed_Red', x: 12, y: 2, type: 'bed.png', owner: 'Red' });
    world.objects.push({ id: 'Bed_Blue', x: 14, y: 2, type: 'bed.png', owner: 'Blue' });
    world.objects.push({ id: 'Bed_Green', x: 16, y: 2, type: 'bed.png', owner: 'Green' });

    // Room 3 (Bottom Left): Lounge
    world.objects.push({ id: 'Sofa1', x: 2, y: 15, type: 'sofa.png' });
    world.objects.push({ id: 'Radio', x: 5, y: 18, type: 'radio.png' });

    // Room 4 (Bottom Right): Tech / Lab
    world.objects.push({ id: 'Computer', x: 15, y: 15, type: 'computer.png' });
    world.objects.push({ id: 'DeskChair', x: 16, y: 16, type: 'chair.png' });
}

class Resident {
    constructor(name, color, startX, startY) {
        this.name = name;
        this.color = color;
        this.x = startX;
        this.y = startY;
        this.sprite = `char_${color.toLowerCase()}.png`;

        this.state = "IDLE";
        this.path = [];
        this.target = null;

        this.needs = {
            hunger: 50,
            energy: 60,
            fun: 50
        };

        this.lastThought = "Initializing...";
        this.actionQueue = [];
        this.cooldown = 0;
    }

    update(dt) {
        // Needs Decay
        this.needs.hunger += 0.03;
        this.needs.energy -= 0.01;
        this.needs.fun -= 0.02;

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
                // Autonomy Loop
                // Think if Needs are high or just random chance (more frequent)
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
        const speed = 0.1; // Faster movement
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

        // Find nearest 5 objects to keep prompt small
        // Simple distance check
        let nearby = world.objects.map(o => {
            return {
                id: o.id,
                type: o.type,
                dist: Math.abs(o.x - this.x) + Math.abs(o.y - this.y)
            };
        }).sort((a,b) => a.dist - b.dist).slice(0, 5);

        const context = {
            name: this.name,
            state: "IDLE", // Always pass idle state to LLM when asking for new plan
            needs: this.needs,
            nearby: nearby.map(o => ({ id: o.id, type: o.type }))
        };

        try {
            const res = await fetch('/api/decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context)
            });
            const decision = await res.json();

            this.lastThought = decision.thought || "No thought";
            addLog(this.name, `Thought: "${this.lastThought}" | Plan: ${decision.action}`);

            this.processDecision(decision);

        } catch (e) {
            console.error(e);
            this.state = "IDLE";
            this.cooldown = 100; // Wait before retrying
        }
    }

    processDecision(d) {
        // Convert LLM decision to Actions
        const target = d.target;

        if (d.action === "MOVE") {
            this.actionQueue.push({ type: 'MOVE', target: target });
        }
        else if (["EAT", "SLEEP", "SIT", "PLAY", "LISTEN", "USE"].includes(d.action)) {
            // Need to move there first?
            // Check distance
            const targetObj = world.objects.find(o => o.id === target);
            if (targetObj) {
                const dist = Math.abs(targetObj.x - this.x) + Math.abs(targetObj.y - this.y);
                if (dist > 1.5) {
                    this.actionQueue.push({ type: 'MOVE', target: target });
                }
                this.actionQueue.push({ type: 'INTERACT', action: d.action, target: target });
            } else {
                 // If target not found or self
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
            if (targetObj) {
                tx = targetObj.x;
                ty = targetObj.y;
            } else if (act.target === 'random') {
                 tx = Math.floor(Math.random() * GRID_SIZE);
                 ty = Math.floor(Math.random() * GRID_SIZE);
            } else {
                 return; // Fail silently
            }

            // Pathfinding
            const path = pf.findPath(Math.round(this.x), Math.round(this.y), tx, ty);
            if (path && path.length > 0) {
                // Remove last step if it's an object (occupied)
                // Actually residents can stand ON objects like floors, but furniture usually blocks?
                // Let's assume they stand ON the tile of the furniture to use it.
                this.path = path;
                this.state = "MOVING";
            } else {
                // No path
                addLog(this.name, "Can't reach target.");
            }
        }
        else if (act.type === 'INTERACT') {
            const op = act.action;
            // Visual feedback?
            this.cooldown = 100; // Busy interacting

            if (op === 'EAT') {
                this.needs.hunger = Math.max(0, this.needs.hunger - 50);
                addLog(this.name, "Ate food.");
            } else if (op === 'SLEEP') {
                this.needs.energy = 100;
                this.cooldown = 300; // Sleep long
                addLog(this.name, "Sleeping...");
            } else if (op === 'SIT') {
                this.needs.energy += 10;
                addLog(this.name, "Sat down to rest.");
            } else if (op === 'PLAY' || op === 'USE') {
                this.needs.fun = 100;
                addLog(this.name, "Used computer.");
            } else if (op === 'LISTEN') {
                this.needs.fun += 30;
                addLog(this.name, "Listened to radio.");
            }
        }
        else if (act.type === 'WAIT') {
            this.cooldown = act.duration;
        }
    }
}

// Init
const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer('gameCanvas');
const pf = new Pathfinding(GRID_SIZE);

initMap();

// Init Residents
world.residents.push(new Resident("Red", "Red", 2, 2));
world.residents.push(new Resident("Blue", "Blue", 14, 2));
world.residents.push(new Resident("Green", "Green", 2, 15));

// Walls to Pathfinding
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
    world.residents.forEach(r => {
        const div = document.createElement('div');
        div.className = 'resident-card';
        div.innerHTML = `
            <h4>${r.name}</h4>
            <div style="font-size:10px">${r.lastThought}</div>
            <div class="bar-container" title="Hunger"><div class="bar-fill" style="width:${r.needs.hunger}%; background:#e74c3c;"></div></div>
            <div class="bar-container" title="Energy"><div class="bar-fill" style="width:${r.needs.energy}%; background:#f1c40f;"></div></div>
            <div class="bar-container" title="Fun"><div class="bar-fill" style="width:${r.needs.fun}%; background:#3498db;"></div></div>
        `;
        list.appendChild(div);
    });
}

// Main Loop
function loop() {
    renderer.clear();

    // Draw Floor
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            renderer.drawTile('floor.png', x, y);
        }
    }

    // Draw Walls (Outer)
    for (let y = 0; y < GRID_SIZE; y++) renderer.drawTile('wall_left.png', 0, y);
    for (let x = 0; x < GRID_SIZE; x++) renderer.drawTile('wall_right.png', x, 0);

    // Update Residents
    world.residents.forEach(r => r.update());

    // Render Sorted
    let renderList = [];

    // Objects
    world.objects.forEach(o => {
        renderList.push({ type: 'obj', ref: o, x: o.x, y: o.y, sortZ: o.x + o.y });
    });

    // Internal Walls (from world.walls)
    world.walls.forEach(w => {
        // Use wall_left or wall_right based on orientation context, or just default.
        // In initMap we set type.
        renderList.push({ type: 'wall', ref: w, x: w.x, y: w.y, sortZ: w.x + w.y });
    });

    // Residents
    world.residents.forEach(r => {
        renderList.push({ type: 'res', ref: r, x: r.x, y: r.y, sortZ: r.x + r.y });
    });

    renderList.sort((a, b) => a.sortZ - b.sortZ);

    renderList.forEach(item => {
        if (item.type === 'obj' || item.type === 'wall') {
            renderer.drawTile(item.ref.type, item.x, item.ref.y);
        } else {
            renderer.drawTile(item.ref.sprite, item.x, item.y);
            // Draw Thought Bubble for Residents
            if (item.type === 'res') {
                const thought = item.ref.state === 'THINKING' ? "..." : item.ref.lastThought;
                // Truncate if too long
                const display = thought.length > 20 ? thought.substring(0, 18) + '..' : thought;
                renderer.drawText(display, item.x, item.y, '#FFFFFF');
            }
        }
    });

    updateUI();

    requestAnimationFrame(loop);
}

const assetNames = [
    'floor.png', 'wall_left.png', 'wall_right.png',
    'char_red.png', 'char_blue.png', 'char_green.png',
    'fridge.png', 'bed.png', 'table.png', 'chair.png', 'sofa.png', 'computer.png', 'radio.png'
];

renderer.loadAssets(assetNames, () => {
    console.log("Assets Loaded");
    loop();
});

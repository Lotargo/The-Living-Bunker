const GRID_SIZE = 10;
const TILE_SIZE = 64;

// Game State
const world = {
    residents: [],
    objects: [
        { id: 'Fridge', x: 2, y: 2, type: 'fridge.png', interactable: true },
        { id: 'Bed_Red', x: 7, y: 7, type: 'bed.png', owner: 'Red', interactable: true },
        { id: 'Bed_Blue', x: 8, y: 7, type: 'bed.png', owner: 'Blue', interactable: true },
        { id: 'Bed_Green', x: 9, y: 7, type: 'bed.png', owner: 'Green', interactable: true }
    ],
    map: []
};

class Resident {
    constructor(name, color, startX, startY) {
        this.name = name;
        this.color = color;
        this.x = startX;
        this.y = startY;
        this.sprite = `char_${color.toLowerCase()}.png`;

        this.state = "IDLE"; // MOVING, ACTING, THINKING
        this.path = [];
        this.target = null;

        this.needs = {
            hunger: 50, // 0-100 (100 is starving)
            energy: 50, // 0-100 (0 is exhausted)
            social: 50
        };

        this.lastThought = "I exist.";
        this.actionQueue = [];
    }

    update(dt) {
        // Needs Tick
        this.needs.hunger += 0.05;
        this.needs.energy -= 0.02;

        if (this.state === "MOVING") {
            this.moveAlongPath(dt);
        } else if (this.state === "IDLE") {
            // Check if queue empty
            if (this.actionQueue.length > 0) {
                const nextAction = this.actionQueue.shift();
                this.executeAction(nextAction);
            } else {
                // If nothing to do and needs are critical OR random chance -> THINK
                if (Math.random() < 0.01 || this.needs.hunger > 80) {
                    this.think();
                }
            }
        }
    }

    moveAlongPath(dt) {
        if (this.path.length === 0) {
            this.state = "IDLE";
            return;
        }

        // Simple jump to next tile (for prototype)
        // Ideally interpolate
        const next = this.path[0];

        // Move towards
        const speed = 0.05;
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
        addLog(this.name, "Thinking...");

        // Prepare context
        const context = {
            name: this.name,
            state: this.state,
            needs: this.needs,
            nearby: world.objects.map(o => ({ id: o.id, type: o.type }))
        };

        try {
            const res = await fetch('/api/decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context)
            });
            const decision = await res.json();

            this.lastThought = decision.thought;
            addLog(this.name, `Thought: "${decision.thought}"`);

            // Process Action
            if (decision.action === "MOVE") {
                this.actionQueue.push({ type: 'MOVE', target: decision.target });
            } else if (decision.action === "EAT") {
                this.actionQueue.push({ type: 'MOVE', target: 'Fridge' });
                this.actionQueue.push({ type: 'USE', target: 'Fridge' });
            } else if (decision.action === "SLEEP") {
                this.actionQueue.push({ type: 'MOVE', target: `Bed_${this.name}` });
                this.actionQueue.push({ type: 'USE', target: 'Bed' });
            } else {
                 this.actionQueue.push({ type: 'WAIT', duration: 50 });
            }

            this.state = "IDLE"; // Ready to execute queue

        } catch (e) {
            console.error(e);
            this.state = "IDLE";
        }
    }

    executeAction(act) {
        if (act.type === 'MOVE') {
            let tx, ty;
            // Find target coords
            const targetObj = world.objects.find(o => o.id === act.target);
            if (targetObj) {
                tx = targetObj.x;
                ty = targetObj.y;
            } else if (act.target === 'random') {
                 tx = Math.floor(Math.random() * GRID_SIZE);
                 ty = Math.floor(Math.random() * GRID_SIZE);
            } else {
                return; // Invalid
            }

            // Calc Path
            const path = pf.findPath(Math.round(this.x), Math.round(this.y), tx, ty);
            if (path) {
                this.path = path;
                this.state = "MOVING";
            }
        } else if (act.type === 'USE') {
            if (act.target === 'Fridge') {
                this.needs.hunger = 0;
                addLog(this.name, "Ate some food.");
            } else if (act.target === 'Bed') {
                this.needs.energy = 100;
                addLog(this.name, "Slept.");
            }
        }
    }
}

// Init
const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer('gameCanvas');
const pf = new Pathfinding(GRID_SIZE);

// Init World
world.residents.push(new Resident("Red", "Red", 1, 1));
world.residents.push(new Resident("Blue", "Blue", 8, 1));
world.residents.push(new Resident("Green", "Green", 4, 4));

// Set obstacles (Walls)
// Let's assume boundary walls are not on grid, but drawn around.
// Objects are obstacles?
world.objects.forEach(o => {
    // Walkable or not? Fridge is obstacle.
    pf.setObstacle(o.x, o.y);
});


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
            <h4>${r.name} (${r.state})</h4>
            <div style="font-size:10px">${r.lastThought}</div>
            <div class="bar-container"><div class="bar-fill" style="width:${r.needs.hunger}%"></div></div>
        `;
        list.appendChild(div);
    });
}

// Main Loop
function loop() {
    renderer.clear();

    // Draw Map (Floor)
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
            renderer.drawTile('floor.png', x, y);
        }
    }

    // Draw Walls (Back)
    // Left Wall (x=0 to x=0, y=0 to GRID)
    for (let y = 0; y < GRID_SIZE; y++) renderer.drawTile('wall_left.png', 0, y);
    for (let x = 0; x < GRID_SIZE; x++) renderer.drawTile('wall_right.png', x, 0);

    // Update Residents Logic
    world.residents.forEach(r => r.update());

    // Render List (Sort by Depth: X + Y)
    // We include Objects and Residents
    let renderList = [];

    world.objects.forEach(o => {
        renderList.push({ type: 'obj', ref: o, x: o.x, y: o.y, sortZ: o.x + o.y });
    });

    world.residents.forEach(r => {
        // Residents move smoothly, use current x/y
        renderList.push({ type: 'res', ref: r, x: r.x, y: r.y, sortZ: r.x + r.y });
    });

    // Sort
    renderList.sort((a, b) => a.sortZ - b.sortZ);

    // Draw Sorted
    renderList.forEach(item => {
        if (item.type === 'obj') {
            renderer.drawTile(item.ref.type, item.x, item.ref.y); // Furniture often static on grid
        } else {
            renderer.drawTile(item.ref.sprite, item.x, item.y);
        }
    });

    updateUI();

    requestAnimationFrame(loop);
}

// Start
const assetNames = [
    'floor.png', 'wall_left.png', 'wall_right.png',
    'char_red.png', 'char_blue.png', 'char_green.png',
    'fridge.png', 'bed.png'
];

renderer.loadAssets(assetNames, () => {
    console.log("Assets Loaded");
    loop();
});

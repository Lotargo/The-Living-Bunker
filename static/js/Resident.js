class Resident {
    constructor(name, color, startX, startY, type) {
        this.name = name;
        this.color = color;
        this.x = startX;
        this.y = startY;
        this.type = type || "resident";
        if (this.type === 'cat') {
            this.sprite = 'cat_luna.png';
        } else {
            this.sprite = 'char_' + color.toLowerCase() + '.png';
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

        this.whisperCount = 0;
        this.memories = [];
    }

    update(dt) {
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
        const speed = this.type === 'cat' ? 0.15 : 0.1;
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

        let nearby = world.objects.map(function(o) {
            return {
                id: o.id,
                type: o.type,
                dist: Math.abs(o.x - this.x) + Math.abs(o.y - this.y)
            };
        }, this).sort(function(a,b) { return a.dist - b.dist; }).slice(0, 8);

        let visibleAnomalies = world.anomalies.map(function(a) {
            return {
                type: a.type,
                stage: a.stage,
                dist: Math.abs(a.x - this.x) + Math.abs(a.y - this.y)
            };
        }, this).filter(function(a) {
            if (this.type === 'cat') return a.dist < 15;
            return a.stage === 'ACTIVE' && a.dist < 10;
        }, this);

        if (this.type !== 'cat') {
            const luna = world.residents.find(function(r) { return r.name === 'Luna'; });
            if (luna && (Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y)) < 8) {
                nearby.push({ id: 'Luna', type: 'Cat', behavior: luna.lastThought });
            }
        }

        const context = {
            name: this.name,
            state: "IDLE",
            needs: this.needs,
            health: this.health,
            nearby: nearby.map(function(o) { return { id: o.id, type: o.type, behavior: o.behavior }; }),
            anomalies: visibleAnomalies,
            atmosphere: world.atmosphere,
            memory: {
                whisper_count: this.whisperCount,
                recent_memories: this.memories.slice(-3)
            }
        };

        try {
            const res = await fetch('/api/decide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context)
            });
            const decision = await res.json();

            this.lastThought = decision.thought || "No thought";
            addLog(this.name, '"' + this.lastThought + '"');

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
             this.state = "IDLE";
             this.cooldown = 60;
             addLog(this.name, "Stares intently at nothing...");
        }
        else if (["EAT", "SLEEP", "SIT", "PLAY", "LISTEN", "USE", "SHOWER", "WATCH", "INSPECT", "HISS", "PURR"].includes(d.action)) {
            const targetObj = world.objects.find(function(o) { return o.id === target; });
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
            const targetObj = world.objects.find(function(o) { return o.id === act.target; });
            const targetRes = world.residents.find(function(r) { return r.name === act.target; });

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

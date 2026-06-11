class Resident {
    name: string;
    color: string;
    x: number;
    y: number;
    type: string;
    sprite: string;
    state: string;
    path: PathNode[];
    target: string | null;
    needs: Needs;
    health: number;
    lastThought: string;
    actionQueue: { type: string; target?: string; action?: string; duration?: number }[];
    cooldown: number;
    whisperCount: number;
    memories: string[];
    facing: string;
    animationTick: number;
    lastLoggedThought: string;
    thoughtLogCooldown: number;

    constructor(name: string, color: string, startX: number, startY: number, type?: string) {
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
            hunger: NEEDS.INITIAL_HUNGER,
            energy: NEEDS.INITIAL_ENERGY,
            fun: NEEDS.INITIAL_FUN,
            hygiene: NEEDS.INITIAL_HYGIENE
        };
        this.health = 100;

        this.lastThought = "Initializing...";
        this.actionQueue = [];
        this.cooldown = 0;

        this.whisperCount = 0;
        this.memories = [];
        this.facing = 'down';
        this.animationTick = 0;
        this.lastLoggedThought = '';
        this.thoughtLogCooldown = 0;
    }

    update(_dt?: number): void {
        if (Runtime.paused) return;

        if (this.thoughtLogCooldown > 0) {
            this.thoughtLogCooldown--;
        }

        this.needs.hunger += NEEDS.DECAY_HUNGER;
        this.needs.energy += NEEDS.DECAY_ENERGY;
        this.needs.fun += NEEDS.DECAY_FUN;
        this.needs.hygiene += NEEDS.DECAY_HYGIENE;

        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        if (this.state === "MOVING") {
            this.moveAlongPath();
        } else if (this.state === "IDLE") {
            if (this.actionQueue.length > 0) {
                const nextAction = this.actionQueue.shift()!;
                this.executeAction(nextAction);
            } else {
                if (Math.random() < NEEDS.THINK_CHANCE || this.needs.hunger > NEEDS.THINK_THRESHOLD_HUNGER || this.needs.energy < NEEDS.THINK_THRESHOLD_ENERGY) {
                    this.think();
                }
            }
        }
    }

    moveAlongPath(): void {
        if (this.path.length === 0) {
            this.state = "IDLE";
            return;
        }
        const next: PathNode = this.path[0];
        const speed: number = this.type === 'cat' ? MOVEMENT.CAT_SPEED : MOVEMENT.HUMAN_SPEED;
        const dx: number = next.x - this.x;
        const dy: number = next.y - this.y;
        this.updateFacing(dx, dy);
        this.animationTick++;

        if (Math.abs(dx) < speed && Math.abs(dy) < speed) {
            this.x = next.x;
            this.y = next.y;
            this.path.shift();
        } else {
            this.x += Math.sign(dx) * speed;
            this.y += Math.sign(dy) * speed;
        }
    }

    updateFacing(dx: number, dy: number): void {
        if (Math.abs(dx) > Math.abs(dy)) {
            this.facing = dx > 0 ? 'right' : 'left';
        } else if (Math.abs(dy) > 0) {
            this.facing = dy > 0 ? 'down' : 'up';
        }
    }

    getSpriteFrame(): SpriteFrameConfig | null {
        const moving: boolean = this.state === 'MOVING';
        if (this.type === 'cat') {
            return { image: 'vendor/characters/luna_idle.png', frameW: 32, frameH: 32, scale: 1.2 };
        }

        const action: string = moving ? 'walk' : 'idle';
        if (this.name === 'Green') {
            const greenDir: string = action === 'idle' ? 'down' : this.facing;
            return { image: 'vendor/characters/female_villager_' + action + '_' + greenDir + '.png', frameW: 64, frameH: 64, scale: 1.1 };
        }

        const dir: string = action === 'idle' ? (this.facing === 'up' ? 'up' : 'down') : this.facing;
        return { image: 'vendor/characters/village_man_' + action + '_' + dir + '.png', frameW: 64, frameH: 64, scale: 1.1 };
    }

    async think(): Promise<void> {
        this.state = "THINKING";
        const self: Resident = this;

        let nearby: NearbyObject[] = world.objects.map(function(o: WorldObject): NearbyObject {
            return {
                id: o.id,
                type: o.type,
                dist: Math.abs(o.x - self.x) + Math.abs(o.y - self.y)
            };
        }).sort(function(a: NearbyObject, b: NearbyObject): number { return (a.dist || 0) - (b.dist || 0); }).slice(0, 8);

        let visibleAnomalies: VisibleAnomaly[] = world.anomalies.map(function(a: Anomaly): VisibleAnomaly {
            return {
                type: a.type,
                stage: a.stage,
                dist: Math.abs(a.x - self.x) + Math.abs(a.y - self.y)
            };
        }).filter(function(a: VisibleAnomaly): boolean {
            if (self.type === 'cat') return a.dist < 15;
            return a.stage === 'ACTIVE' && a.dist < 10;
        });

        if (this.type !== 'cat') {
            const luna: Resident | undefined = world.residents.find(function(r: Resident): boolean { return r.name === 'Luna'; });
            if (luna && (Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y)) < 8) {
                nearby.push({ id: 'Luna', type: 'Cat', behavior: luna.lastThought });
            }
        }

        const context: Context = {
            name: this.name,
            state: "IDLE",
            needs: this.needs,
            health: this.health,
            nearby: nearby.map(function(o: NearbyObject) { return { id: o.id, type: o.type, behavior: o.behavior }; }),
            anomalies: visibleAnomalies,
            atmosphere: world.atmosphere,
            memory: {
                whisper_count: this.whisperCount,
                recent_memories: this.memories.slice(-3)
            }
        };

        try {
            const decision: Decision = await BrainClient.decide(context);

            this.lastThought = this.normalizeThought(decision.thought || "No thought");
            EventBus.emit('agent.thought', 'agent', {
                actor: this.name,
                thought: this.lastThought,
                intent: decision.real_intent
            });
            if (this.shouldLogThought(this.lastThought)) {
                addLog(this.name, '"' + this.lastThought + '"');
            }

            this.processDecision(decision);

        } catch (e) {
            console.error(e);
            this.state = "IDLE";
            this.cooldown = COOLDOWNS.ERROR_RETRY;
        }
    }

    normalizeThought(thought: string): string {
        if (this.type === 'cat' && thought.toLowerCase().includes('meow')) {
            const dangerVisible: boolean = world.anomalies.some(function(a: Anomaly): boolean {
                return a.stage === 'GESTATING' || a.stage === 'ACTIVE';
            });
            return dangerVisible ? thought : 'Meow.';
        }
        return thought;
    }

    shouldLogThought(thought: string): boolean {
        if (thought === this.lastLoggedThought && this.thoughtLogCooldown > 0) {
            return false;
        }
        this.lastLoggedThought = thought;
        this.thoughtLogCooldown = this.type === 'cat' ? COOLDOWNS.CAT_VOICE_LOG : COOLDOWNS.THOUGHT_LOG;
        return true;
    }

    processDecision(d: Decision): void {
        const target: string | undefined = d.target;
        EventBus.emit('agent.action', 'agent', {
            actor: this.name,
            action: d.action,
            target: target
        });

        if (d.action === "MOVE") {
            this.actionQueue.push({ type: 'MOVE', target: target });
        }
        else if (d.action === "STARE") {
            this.state = "IDLE";
            this.cooldown = COOLDOWNS.CAT_STARE;
            addLog(this.name, "Stares intently at nothing...");
        }
        else if (["EAT", "SLEEP", "SIT", "PLAY", "LISTEN", "USE", "SHOWER", "WATCH", "INSPECT", "HISS", "PURR"].includes(d.action)) {
            const targetObj: WorldObject | undefined = world.objects.find(function(o: WorldObject): boolean { return o.id === target; });
            if (targetObj) {
                const dist: number = Math.abs(targetObj.x - this.x) + Math.abs(targetObj.y - this.y);
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

    executeAction(act: { type: string; target?: string; action?: string; duration?: number }): void {
        if (act.type === 'MOVE') {
            let tx: number | undefined;
            let ty: number | undefined;
            const targetObj: WorldObject | undefined = world.objects.find(function(o: WorldObject): boolean { return o.id === act.target; });
            const targetRes: Resident | undefined = world.residents.find(function(r: Resident): boolean { return r.name === act.target; });

            if (targetObj) {
                const reachable: PathNode | null = this.findReachableNeighbor(targetObj.x, targetObj.y);
                if (!reachable) {
                    addLog(this.name, "Cannot reach " + targetObj.id + ".");
                    this.cooldown = COOLDOWNS.ERROR_RETRY;
                    return;
                }
                tx = reachable.x;
                ty = reachable.y;
            } else if (targetRes) {
                tx = targetRes.x;
                ty = targetRes.y;
            } else if (act.target === 'random') {
                tx = Math.floor(Math.random() * GRID_SIZE);
                ty = Math.floor(Math.random() * GRID_SIZE);
            } else {
                return;
            }

            const path: PathNode[] | null = pf.findPath(Math.round(this.x), Math.round(this.y), tx!, ty!);
            if (path && path.length > 0) {
                this.path = path;
                this.state = "MOVING";
            }
        }
        else if (act.type === 'INTERACT') {
            const op: string = act.action || '';
            const targetObj: WorldObject | undefined = world.objects.find(function(o: WorldObject): boolean { return o.id === act.target; });
            if (targetObj) {
                const dist: number = Math.abs(targetObj.x - this.x) + Math.abs(targetObj.y - this.y);
                if (dist > 1.5) {
                    const path: PathNode[] | null = pf.findPath(
                        Math.round(this.x),
                        Math.round(this.y),
                        Math.round(targetObj.x),
                        Math.round(targetObj.y)
                    );
                    if (path && path.length > 0) {
                        this.path = path;
                        this.actionQueue.unshift(act);
                        this.state = "MOVING";
                    } else {
                        this.cooldown = COOLDOWNS.ERROR_RETRY;
                        addLog(this.name, "Cannot reach " + targetObj.id + ".");
                    }
                    return;
                }
            }
            this.cooldown = COOLDOWNS.INTERACT;

            if (op === 'EAT') {
                this.needs.hunger = Math.max(0, this.needs.hunger - 50);
            } else if (op === 'SLEEP') {
                this.needs.energy = 100;
                this.cooldown = COOLDOWNS.SLEEP;
            } else if (op === 'SIT' || op === 'PLAY' || op === 'USE' || op === 'LISTEN' || op === 'WATCH') {
                this.needs.fun += 20;
            }
        }
        else if (act.type === 'WAIT') {
            this.cooldown = act.duration || 0;
        }
    }

    findReachableNeighbor(tx: number, ty: number): PathNode | null {
        const candidates: PathNode[] = [
            { x: Math.round(tx), y: Math.round(ty) },
            { x: Math.round(tx) + 1, y: Math.round(ty) },
            { x: Math.round(tx) - 1, y: Math.round(ty) },
            { x: Math.round(tx), y: Math.round(ty) + 1 },
            { x: Math.round(tx), y: Math.round(ty) - 1 }
        ];

        let best: { node: PathNode; pathLen: number } | null = null;
        for (const candidate of candidates) {
            if (!pf.isWalkable(candidate.x, candidate.y)) continue;
            const path: PathNode[] | null = pf.findPath(Math.round(this.x), Math.round(this.y), candidate.x, candidate.y);
            if (!path || path.length === 0) continue;
            if (!best || path.length < best.pathLen) {
                best = { node: candidate, pathLen: path.length };
            }
        }
        return best ? best.node : null;
    }
}

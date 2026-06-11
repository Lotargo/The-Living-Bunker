class Anomaly {
    type: string;
    x: number;
    y: number;
    lifespan: number;
    stage: string;
    gestationTimer: number;
    goal: string;
    lastThought: string;
    cooldown: number;
    revealed: boolean;
    sprite: string;

    constructor(type: string, x: number, y: number) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.lifespan = ANOMALY.BASE_LIFESPAN + Math.random() * ANOMALY.LIFESPAN_VARIANCE;
        this.stage = 'GESTATING';
        this.gestationTimer = ANOMALY.BASE_GESTATION + Math.random() * ANOMALY.GESTATION_VARIANCE;

        this.goal = "Cause confusion";
        this.lastThought = "Manifesting...";
        this.cooldown = 0;
        this.revealed = false;
        this.sprite = 'ghost.png';

        if (type === 'Ghost') this.sprite = 'ghost.png';
        if (type === 'Glitch') this.sprite = 'glitch.png';
        if (type === 'Doppelganger') this.sprite = 'cat_luna.png';
    }

    update(): boolean {
        if (Runtime.paused) return true;

        this.lifespan--;
        if (this.lifespan <= 0) return false;

        if (this.stage === 'GESTATING') {
            this.gestationTimer--;
            if (this.gestationTimer <= 0) {
                this.stage = 'ACTIVE';
                addLog("SYSTEM", "ANOMALY MANIFESTED: " + this.type);
                world.setAtmosphere("Heavy Static");
            } else {
                if (Math.random() < ANOMALY.ATMOSPHERE_PRECURSOR_CHANCE) {
                    world.setAtmosphere("Cold Draft");
                }
            }
            return true;
        }

        if (this.cooldown > 0) {
            this.cooldown--;
            return true;
        }

        if (this.type === 'Doppelganger') {
            const luna: Resident | undefined = world.residents.find(function(r: Resident): boolean { return r.name === 'Luna'; });
            if (luna) {
                const dist: number = Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y);
                if (dist < 4) {
                    addLog("Doppelgänger", "SCREEECH! (Dissolves upon meeting original)");
                    return false;
                }
            }
        }

        if (Math.random() < ANOMALY.RANDOM_MOVE_CHANCE) {
            this.think();
        } else {
            this.x += (Math.random() - 0.5) * 0.2;
            this.y += (Math.random() - 0.5) * 0.2;
        }
        return true;
    }

    async think(): Promise<void> {
        const self: Anomaly = this;
        const luna: Resident | undefined = world.residents.find(function(r: Resident): boolean { return r.name === 'Luna'; });
        const lunaDist: number = luna ? (Math.abs(luna.x - self.x) + Math.abs(luna.y - self.y)) : 999;

        const context: AnomalyContext = {
            type: 'anomaly',
            anomalyType: this.type,
            stage: this.stage,
            lifespan: Math.floor(this.lifespan),
            nearbyResidents: world.residents.map(function(r: Resident): string { return r.name; }),
            lunaDist: lunaDist
        };

        try {
            const decision: Decision = await BrainClient.decide(context);
            this.lastThought = decision.thought || "...";
            EventBus.emit('agent.thought', 'agent', {
                actor: this.type,
                thought: this.lastThought
            });

            if (this.stage === 'ACTIVE') {
                addLog(this.type, 'Said: "' + this.lastThought + '"');
            }

            EventBus.emit('agent.action', 'agent', {
                actor: this.type,
                action: decision.action,
                target: decision.target
            });

            if (decision.reveal && this.type === 'Doppelganger') {
                this.revealed = true;
                this.sprite = 'cat_evil.png';
                addLog("Doppelgänger", "REVEALS TRUE FORM!");
                this.lifespan = 50;

                world.residents.forEach(function(r: Resident): void {
                    if (Math.abs(r.x - self.x) < 5) {
                        r.health -= 20;
                        addLog(r.name, "Takes psychic damage!");
                    }
                });
            }

            if (decision.action === 'HAUNT' || decision.action === 'MOVE' || decision.action === 'MIMIC') {
                if (world.residents.length > 0) {
                    const target: Resident = world.residents[Math.floor(Math.random() * world.residents.length)];
                    if (target) {
                        this.x = target.x + (Math.random() - 0.5) * 4;
                        this.y = target.y + (Math.random() - 0.5) * 4;
                    }
                }
            }
            this.cooldown = COOLDOWNS.ANOMALY_THINK;
        } catch (e) {
            console.error(e);
        }
    }
}

const AnomalyManager = {
    spawnChance: ANOMALY.SPAWN_CHANCE,
    update: function(): void {
        world.removeAnomalies(function(a: Anomaly): boolean { return a.update(); });

        if (world.anomalies.length === 0) world.setAtmosphere("Normal");

        if (Math.random() < AnomalyManager.spawnChance && world.anomalies.length < ANOMALY.MAX_ANOMALIES) {
            const types: string[] = ['Ghost', 'Glitch', 'Doppelganger'];
            const type: string = types[Math.floor(Math.random() * types.length)];
            const x: number = Math.random() * GRID_SIZE;
            const y: number = Math.random() * GRID_SIZE;
            world.addAnomaly(new Anomaly(type, x, y));
        }
    }
};

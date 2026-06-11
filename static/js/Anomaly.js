class Anomaly {
    /** @param {string} type @param {number} x @param {number} y */
    constructor(type, x, y) {
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

        if (type === 'Ghost') this.sprite = 'ghost.png';
        if (type === 'Glitch') this.sprite = 'glitch.png';
        if (type === 'Doppelganger') this.sprite = 'cat_luna.png';
    }

    /** Tick the anomaly: gestate, move, or decay. Returns false when it expires. */
    update() {
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
            const luna = world.residents.find(function(r) { return r.name === 'Luna'; });
            if (luna) {
                const dist = Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y);
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

    async think() {
        const luna = world.residents.find(function(r) { return r.name === 'Luna'; });
        const lunaDist = luna ? (Math.abs(luna.x - this.x) + Math.abs(luna.y - this.y)) : 999;

        const context = {
            type: 'anomaly',
            anomalyType: this.type,
            stage: this.stage,
            lifespan: Math.floor(this.lifespan),
            nearbyResidents: world.residents.map(function(r) { return r.name; }),
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

            if (this.stage === 'ACTIVE') {
                 addLog(this.type, 'Said: "' + this.lastThought + '"');
            }

            if (decision.reveal && this.type === 'Doppelganger') {
                this.revealed = true;
                this.sprite = 'cat_evil.png';
                addLog("Doppelgänger", "REVEALS TRUE FORM!");
                this.lifespan = 50;

                world.residents.forEach(function(r) {
                    if (Math.abs(r.x - this.x) < 5) {
                         r.health -= 20;
                         addLog(r.name, "Takes psychic damage!");
                    }
                }, this);
            }

            if (decision.action === 'HAUNT' || decision.action === 'MOVE' || decision.action === 'MIMIC') {
                if (world.residents.length > 0) {
                    const target = world.residents[Math.floor(Math.random() * world.residents.length)];
                    if (target) {
                        this.x = target.x + (Math.random() - 0.5) * 4;
                        this.y = target.y + (Math.random() - 0.5) * 4;
                    }
                }
            }
            this.cooldown = COOLDOWNS.ANOMALY_THINK;
        } catch(e) {
            console.error(e);
        }
    }
}

const AnomalyManager = {
    spawnChance: ANOMALY.SPAWN_CHANCE,
    /** Updates all anomalies, manages atmosphere, and randomly spawns new ones. */
    update: function() {
        world.removeAnomalies(function(a) { return a.update(); });

        if (world.anomalies.length === 0) world.setAtmosphere("Normal");

        if (Math.random() < AnomalyManager.spawnChance && world.anomalies.length < ANOMALY.MAX_ANOMALIES) {
            const types = ['Ghost', 'Glitch', 'Doppelganger'];
            const type = types[Math.floor(Math.random() * types.length)];
            const x = Math.random() * GRID_SIZE;
            const y = Math.random() * GRID_SIZE;
            world.addAnomaly(new Anomaly(type, x, y));
        }
    }
};

function executeGodCommand(cmd: GodCommand): void {
    if (cmd.action === 'SPAWN') {
        const type: string = cmd.type || 'Ghost';
        let loc: string = cmd.location || 'Random';

        let x: number = 0, y: number = 0;

        const center = getRoomSpawnCenter(loc);
        if (center) {
            x = center.x;
            y = center.y;
        } else {
            x = Math.random() * GRID_SIZE;
            y = Math.random() * GRID_SIZE;
        }

        x += (Math.random() - 0.5) * 3;
        y += (Math.random() - 0.5) * 3;

        x = Math.max(1, Math.min(GRID_SIZE - 2, x));
        y = Math.max(1, Math.min(GRID_SIZE - 2, y));

        const anomaly: Anomaly = new Anomaly(type, x, y);
        if (type === 'Poltergeist') {
            anomaly.sprite = 'ghost.png';
            anomaly.lifespan = ROOM.POLTERGEIST_LIFESPAN;
            anomaly.stage = 'ACTIVE';
            addLog('SYSTEM', 'WARNING: POLTERGEIST DETECTED!');
        }

        world.addAnomaly(anomaly);
        logConsole('system', 'Spawned ' + type + ' at ' + loc + '.');
    }

    else if (cmd.action === 'ATMOSPHERE') {
        world.setAtmosphere(cmd.type || 'Normal');
        logConsole('system', 'Atmosphere changed to: ' + cmd.type);
    }

    else if (cmd.action === 'WHISPER') {
        const targetName: string = cmd.target || 'All';
        const msg: string = cmd.content || '';

        const targets: Resident[] = [];
        if (targetName === 'All') {
            targets.push.apply(targets, world.residents);
        } else {
            const t: Resident | undefined = world.residents.find(function(r: Resident): boolean { return r.name === targetName; });
            if (t) targets.push(t);
        }

        targets.forEach(function(r: Resident): void {
            r.lastThought = '(Voice): ' + msg;
            addLog(r.name, 'Hears whisper: "' + msg + '"');
            r.whisperCount++;
            r.memories.push('Heard a voice say: "' + msg + '"');
        });

        logConsole('system', 'Whispered to ' + targetName + '.');
    }

    else if (cmd.action === 'EVENT' && cmd.type === 'MASS_HYSTERIA') {
        const loc: string = cmd.location || 'LivingRoom';
        logConsole('system', 'EVENT TRIGGERED: MASS HYSTERIA');
        addLog('SYSTEM', 'WARNING: Residents exhibiting pack panic behavior.');

        let targetX: number = 15, targetY: number = 15;
        const center = getRoomSpawnCenter(loc);
        if (center) {
            targetX = center.x;
            targetY = center.y;
        }

        world.residents.forEach(function(r: Resident): void {
            r.actionQueue = [];
            r.state = "IDLE";
            const tx: number = targetX + Math.random() * 4;
            const ty: number = targetY + Math.random() * 4;

            if (typeof pf !== 'undefined' && pf) {
                r.path = pf.findPath(Math.round(r.x), Math.round(r.y), Math.round(tx), Math.round(ty)) || [];
            }
            if (r.path && r.path.length > 0) {
                r.state = "MOVING";
                r.actionQueue.push({ type: 'WAIT', duration: 500 });
            }

            r.lastThought = "WE NEED TO STICK TOGETHER!";
            addLog(r.name, "Screams: 'EVERYONE TO THE LIVING ROOM!'");
            r.whisperCount += 5;
        });
    }

    else if (cmd.action === 'BUILD') {
        const type: string = cmd.roomType || 'Empty';
        const near: string = cmd.near || 'Kitchen';

        logConsole('system', 'Initiating construction: ' + type + ' near ' + near + '...');

        setTimeout(function(): void {
            const success: boolean = RoomBuilder.build(type, near);
            if (!success) {
                addLog('SYSTEM', 'Construction failed: No suitable terrain.');
            } else {
                addLog('SYSTEM', 'New Sector Added: ' + type);
            }
        }, 1000);
    }
}

const consoleInput = document.getElementById('console-input') as HTMLInputElement;
const consoleOutput = document.getElementById('console-output')!;

consoleInput.addEventListener('keydown', async function(e: KeyboardEvent): Promise<void> {
    if (e.key === 'Enter') {
        const text: string = consoleInput.value.trim();
        if (!text) return;

        logConsole('user', text);
        consoleInput.value = '';
        consoleInput.disabled = true;

        try {
            const res: Response = await fetch('/api/architect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data: ArchitectResponse = await res.json();

            if (data.response) {
                logConsole('architect', data.response);
            }

            if (data.commands && Array.isArray(data.commands)) {
                data.commands.forEach(function(cmd: GodCommand): void { executeGodCommand(cmd); });
            }

        } catch (err) {
            logConsole('system', "Error contacting Architect.");
            console.error(err);
        } finally {
            consoleInput.disabled = false;
            consoleInput.focus();
        }
    }
});

/** Dispatches a god command object: SPAWN, ATMOSPHERE, WHISPER, EVENT, or BUILD. */
function executeGodCommand(cmd) {
    if (cmd.action === 'SPAWN') {
        const type = cmd.type;
        let loc = cmd.location || 'Random';

        let x = 0, y = 0;

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

        x = Math.max(1, Math.min(GRID_SIZE-2, x));
        y = Math.max(1, Math.min(GRID_SIZE-2, y));

        const anomaly = new Anomaly(type, x, y);
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
        world.setAtmosphere(cmd.type);
        logConsole('system', 'Atmosphere changed to: ' + cmd.type);
    }

    else if (cmd.action === 'WHISPER') {
        const targetName = cmd.target;
        const msg = cmd.content;

        const targets = [];
        if (targetName === 'All') {
            targets.push.apply(targets, world.residents);
        } else {
            const t = world.residents.find(function(r) { return r.name === targetName; });
            if (t) targets.push(t);
        }

        targets.forEach(function(r) {
            r.lastThought = '(Voice): ' + msg;
            addLog(r.name, 'Hears whisper: "' + msg + '"');
            r.whisperCount++;
            r.memories.push('Heard a voice say: "' + msg + '"');
        });

        logConsole('system', 'Whispered to ' + targetName + '.');
    }

    else if (cmd.action === 'EVENT' && cmd.type === 'MASS_HYSTERIA') {
        const loc = cmd.location || 'LivingRoom';
        logConsole('system', 'EVENT TRIGGERED: MASS HYSTERIA');
        addLog('SYSTEM', 'WARNING: Residents exhibiting pack panic behavior.');

        let targetX = 15, targetY = 15;
        const center = getRoomSpawnCenter(loc);
        if (center) {
            targetX = center.x;
            targetY = center.y;
        }

        world.residents.forEach(function(r) {
             r.actionQueue = [];
             r.state = "IDLE";
             const tx = targetX + Math.random() * 4;
             const ty = targetY + Math.random() * 4;

             if (typeof pf !== 'undefined' && pf) {
                 r.path = pf.findPath(Math.round(r.x), Math.round(r.y), Math.round(tx), Math.round(ty));
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
        const type = cmd.roomType || 'Empty';
        const near = cmd.near || 'Kitchen';

        logConsole('system', 'Initiating construction: ' + type + ' near ' + near + '...');

        setTimeout(function() {
            const success = RoomBuilder.build(type, near);
            if (!success) {
                addLog('SYSTEM', 'Construction failed: No suitable terrain.');
            } else {
                addLog('SYSTEM', 'New Sector Added: ' + type);
            }
        }, 1000);
    }
}

const consoleInput = document.getElementById('console-input');
const consoleOutput = document.getElementById('console-output');

consoleInput.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter') {
        const text = consoleInput.value.trim();
        if (!text) return;

        logConsole('user', text);
        consoleInput.value = '';
        consoleInput.disabled = true;

        try {
            const res = await fetch('/api/architect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text })
            });
            const data = await res.json();

            if (data.response) {
                logConsole('architect', data.response);
            }

            if (data.commands && Array.isArray(data.commands)) {
                data.commands.forEach(function(cmd) { executeGodCommand(cmd); });
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

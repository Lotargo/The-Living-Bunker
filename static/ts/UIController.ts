function addLog(who: string, msg: string): void {
    const log: HTMLElement = document.getElementById('logs')!;
    const div: HTMLElement = document.createElement('div');
    div.className = 'log-entry';
    const strong: HTMLElement = document.createElement('strong');
    strong.textContent = who + ': ';
    div.appendChild(strong);
    div.appendChild(document.createTextNode(msg));
    log.prepend(div);
    EventBus.emit('log.entry', 'system', { who: who, message: msg });
    while (log.children.length > UI.MAX_EVENT_LOG_ENTRIES) {
        log.removeChild(log.lastElementChild!);
    }
}

function updateUI(): void {
    const list: HTMLElement = document.getElementById('residents-list')!;
    list.innerHTML = '';
    const atm: HTMLElement = document.createElement('div');
    const atmStrong: HTMLElement = document.createElement('strong');
    atmStrong.textContent = 'Atmosphere: ';
    atm.appendChild(atmStrong);
    atm.appendChild(document.createTextNode(world.atmosphere));
    list.appendChild(atm);

    world.residents.forEach(function(r: Resident): void {
        const div: HTMLElement = document.createElement('div');
        div.className = 'resident-card';
        if (r.type === 'cat') div.style.border = "1px solid #9b59b6";

        const h4: HTMLElement = document.createElement('h4');
        h4.textContent = r.name;
        div.appendChild(h4);

        const thought: HTMLElement = document.createElement('div');
        thought.style.fontSize = '10px';
        thought.textContent = r.lastThought;
        div.appendChild(thought);

        const bars = [
            { key: 'health', color: '#2ecc71', val: r.health },
            { key: 'needs.hunger', color: '#e74c3c', val: r.needs.hunger },
            { key: 'needs.energy', color: '#f1c40f', val: r.needs.energy },
            { key: 'needs.fun', color: '#3498db', val: r.needs.fun },
            { key: 'needs.hygiene', color: '#27ae60', val: r.needs.hygiene },
        ];
        bars.forEach(function(b: { key: string; color: string; val: number }): void {
            const bar: HTMLElement = document.createElement('div');
            bar.className = 'bar-container';
            bar.title = b.key;
            const fill: HTMLElement = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.width = Math.min(100, b.val) + '%';
            fill.style.background = b.color;
            bar.appendChild(fill);
            div.appendChild(bar);
        });

        list.appendChild(div);
    });
}

function logConsole(type: string, text: string): void {
    const consoleOutput: HTMLElement = document.getElementById('console-output')!;
    const div: HTMLElement = document.createElement('div');
    div.className = 'console-line ' + type;
    div.innerText = (type === 'user' ? '> ' : '') + text;
    consoleOutput.appendChild(div);
    EventBus.emit('log.entry', type, { who: type, message: text });
    while (consoleOutput.children.length > UI.MAX_CONSOLE_LINES) {
        consoleOutput.removeChild(consoleOutput.firstElementChild!);
    }
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function addLog(who, msg) {
    const log = document.getElementById('logs');
    const div = document.createElement('div');
    div.className = 'log-entry';
    const strong = document.createElement('strong');
    strong.textContent = who + ': ';
    div.appendChild(strong);
    div.appendChild(document.createTextNode(msg));
    log.prepend(div);
}

function updateUI() {
    const list = document.getElementById('residents-list');
    list.innerHTML = '';
    const atm = document.createElement('div');
    const atmStrong = document.createElement('strong');
    atmStrong.textContent = 'Atmosphere: ';
    atm.appendChild(atmStrong);
    atm.appendChild(document.createTextNode(world.atmosphere));
    list.appendChild(atm);

    world.residents.forEach(function(r) {
        const div = document.createElement('div');
        div.className = 'resident-card';
        if (r.type === 'cat') div.style.border = "1px solid #9b59b6";

        const h4 = document.createElement('h4');
        h4.textContent = r.name;
        div.appendChild(h4);

        const thought = document.createElement('div');
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
        bars.forEach(function(b) {
            const bar = document.createElement('div');
            bar.className = 'bar-container';
            bar.title = b.key;
            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.width = Math.min(100, b.val) + '%';
            fill.style.background = b.color;
            bar.appendChild(fill);
            div.appendChild(bar);
        });

        list.appendChild(div);
    });
}

function logConsole(type, text) {
    const consoleOutput = document.getElementById('console-output');
    const div = document.createElement('div');
    div.className = 'console-line ' + type;
    div.innerText = (type === 'user' ? '> ' : '') + text;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

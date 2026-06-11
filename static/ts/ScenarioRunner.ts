const ScenarioRunner = {
    run: function(name: string): boolean {
        if (name === 'first_ghost') {
            world.setAtmosphere('Cold Draft');
            world.addAnomaly(new Anomaly('Ghost', 14, 14));
            addLog('SCENARIO', 'First Ghost: something begins forming near the kitchen.');
            return true;
        }

        if (name === 'luna_warning_ignored') {
            const luna: Resident | undefined = world.residents.find(function(r: Resident): boolean {
                return r.name === 'Luna';
            });
            if (luna) {
                luna.lastThought = 'MEEEOW!!';
                luna.cooldown = COOLDOWNS.CAT_STARE;
            }
            world.setAtmosphere('Heavy Static');
            world.addAnomaly(new Anomaly('Doppelganger', 18, 16));
            addLog('SCENARIO', 'Luna Warning Ignored: the bunker receives a second cat.');
            return true;
        }

        return false;
    }
};

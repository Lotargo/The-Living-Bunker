const BunkerMoments = {
    cooldown: 0,
    lunaAlertCooldown: 0,

    update: function(): void {
        if (BunkerMoments.cooldown > 0) BunkerMoments.cooldown--;
        if (BunkerMoments.lunaAlertCooldown > 0) BunkerMoments.lunaAlertCooldown--;

        const luna: Resident | undefined = world.residents.find(function(r: Resident): boolean {
            return r.name === 'Luna';
        });

        if (luna && BunkerMoments.lunaAlertCooldown <= 0 && luna.lastThought.includes('MEEEOW')) {
            addLog('SYSTEM', 'Everyone pauses. Luna is staring at something nobody else can see.');
            BunkerMoments.lunaAlertCooldown = 900;
            return;
        }

        if (BunkerMoments.cooldown > 0) return;

        const chance: number = world.atmosphere === 'Normal' ? 0.0008 : 0.006;
        if (Math.random() > chance) return;

        const moment: string = BunkerMoments.pickMoment();
        addLog('BUNKER', moment);
        BunkerMoments.cooldown = 600;
    },

    pickMoment: function(): string {
        if (world.atmosphere === 'Cold Draft') {
            return BunkerMoments.pick([
                'A thin line of frost appears on the inside of the kitchen door.',
                'Someone exhales, and the breath hangs in the room too long.',
                'The vents whisper as if the bunker is breathing backward.'
            ]);
        }

        if (world.atmosphere === 'Heavy Static') {
            return BunkerMoments.pick([
                'The radio spits out half a number station, then dies.',
                'Every screen flashes the same impossible frame.',
                'The lights buzz in a rhythm that almost sounds intentional.'
            ]);
        }

        if (world.atmosphere === 'Red Mist' || world.atmosphere === 'Darkness') {
            return BunkerMoments.pick([
                'The far hallway looks longer than it should.',
                'A shadow moves against the direction of the light.',
                'For one second, all furniture points toward the same wall.'
            ]);
        }

        return BunkerMoments.pick([
            'The pipes knock once. Everyone pretends not to notice.',
            'A cupboard opens by a finger-width, then stops.',
            'The bunker hum changes pitch and returns to normal.'
        ]);
    },

    pick: function(items: string[]): string {
        return items[Math.floor(Math.random() * items.length)];
    }
};

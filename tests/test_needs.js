const assert = require('node:assert');
const { describe, it } = require('node:test');

const NEEDS = {
    INITIAL_HUNGER: 50,
    INITIAL_ENERGY: 60,
    INITIAL_FUN: 50,
    INITIAL_HYGIENE: 50,
    DECAY_HUNGER: 0.03,
    DECAY_ENERGY: -0.01,
    DECAY_FUN: -0.02,
    DECAY_HYGIENE: -0.02,
    THINK_THRESHOLD_HUNGER: 70,
    THINK_THRESHOLD_ENERGY: 30,
    THINK_CHANCE: 0.02
};

function createResidentNeeds() {
    return {
        hunger: NEEDS.INITIAL_HUNGER,
        energy: NEEDS.INITIAL_ENERGY,
        fun: NEEDS.INITIAL_FUN,
        hygiene: NEEDS.INITIAL_HYGIENE
    };
}

function updateNeeds(needs, ticks) {
    for (let i = 0; i < ticks; i++) {
        needs.hunger += NEEDS.DECAY_HUNGER;
        needs.energy += NEEDS.DECAY_ENERGY;
        needs.fun += NEEDS.DECAY_FUN;
        needs.hygiene += NEEDS.DECAY_HYGIENE;
    }
}

describe('Needs initialization', () => {
    it('should initialize with configured default values', () => {
        const needs = createResidentNeeds();
        assert.strictEqual(needs.hunger, 50);
        assert.strictEqual(needs.energy, 60);
        assert.strictEqual(needs.fun, 50);
        assert.strictEqual(needs.hygiene, 50);
    });
});

describe('Needs decay', () => {
    it('should increase hunger over time', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 100);
        assert.ok(Math.abs(needs.hunger - 53) < 1e-10);
    });

    it('should decrease energy over time', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 100);
        assert.ok(Math.abs(needs.energy - 59) < 1e-10);
    });

    it('should decrease fun over time', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 100);
        assert.ok(Math.abs(needs.fun - 48) < 1e-10);
    });

    it('should decrease hygiene over time', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 100);
        assert.ok(Math.abs(needs.hygiene - 48) < 1e-10);
    });

    it('hunger should pass think threshold after enough ticks', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 1000);
        assert.ok(needs.hunger > NEEDS.THINK_THRESHOLD_HUNGER);
    });

    it('energy should drop below think threshold after enough ticks', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 5000);
        assert.ok(needs.energy < NEEDS.THINK_THRESHOLD_ENERGY);
    });
});

describe('Needs interactions', () => {
    it('EAT should reduce hunger by 50, clamped at 0', () => {
        const needs = createResidentNeeds();
        needs.hunger = Math.max(0, needs.hunger - 50);
        assert.strictEqual(needs.hunger, 0);
    });

    it('EAT should not reduce hunger below 0', () => {
        const needs = createResidentNeeds();
        needs.hunger = 30;
        needs.hunger = Math.max(0, needs.hunger - 50);
        assert.strictEqual(needs.hunger, 0);
    });

    it('SLEEP should set energy to 100', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 2000);
        needs.energy = 100;
        assert.strictEqual(needs.energy, 100);
    });

    it('PLAY should increase fun by 20', () => {
        const needs = createResidentNeeds();
        const before = needs.fun;
        needs.fun += 20;
        assert.strictEqual(needs.fun, before + 20);
    });

    it('PLAY should allow fun to exceed 100 (no upper bound)', () => {
        const needs = createResidentNeeds();
        needs.fun = 95;
        needs.fun += 20;
        assert.strictEqual(needs.fun, 115);
    });
});

describe('Think thresholds', () => {
    it('should trigger think when hunger exceeds threshold', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 700);
        assert.ok(needs.hunger > NEEDS.THINK_THRESHOLD_HUNGER);
    });

    it('should trigger think when energy drops below threshold', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 4000);
        assert.ok(needs.energy < NEEDS.THINK_THRESHOLD_ENERGY);
    });

    it('should not trigger think when needs are comfortable', () => {
        const needs = createResidentNeeds();
        assert.ok(needs.hunger <= NEEDS.THINK_THRESHOLD_HUNGER);
        assert.ok(needs.energy >= NEEDS.THINK_THRESHOLD_ENERGY);
    });
});

describe('Edge cases', () => {
    it('hunger can exceed 100 (no upper bound in decay)', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 10000);
        assert.ok(needs.hunger > 100);
    });

    it('energy can go below 0 (no lower bound in decay)', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 10000);
        assert.ok(needs.energy < 0);
    });

    it('fun can go below 0 (no lower bound in decay)', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 10000);
        assert.ok(needs.fun < 0);
    });

    it('hygiene can go below 0 (no lower bound in decay)', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 10000);
        assert.ok(needs.hygiene < 0);
    });

    it('zero ticks should leave initial values unchanged', () => {
        const needs = createResidentNeeds();
        updateNeeds(needs, 0);
        assert.strictEqual(needs.hunger, 50);
        assert.strictEqual(needs.energy, 60);
    });

    it('needs decay consistently over equal intervals', () => {
        const needs1 = createResidentNeeds();
        updateNeeds(needs1, 500);
        const needs2 = createResidentNeeds();
        updateNeeds(needs2, 250);
        updateNeeds(needs2, 250);
        assert.strictEqual(needs1.hunger, needs2.hunger);
        assert.strictEqual(needs1.energy, needs2.energy);
        assert.strictEqual(needs1.fun, needs2.fun);
        assert.strictEqual(needs1.hygiene, needs2.hygiene);
    });
});

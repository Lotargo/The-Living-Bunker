const GRID_SIZE = 64;
const TILE_SIZE = 64;

const FLOOR_CONCRETE = 0;
const FLOOR_WOOD = 2;
const FLOOR_TILE = 3;

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

const MOVEMENT = {
    CAT_SPEED: 0.15,
    HUMAN_SPEED: 0.1
};

const COOLDOWNS = {
    INTERACT: 100,
    SLEEP: 300,
    ANOMALY_THINK: 60,
    ANOMALY_IDLE: 60,
    ANOMALY_RANDOM_MOVE_CHANCE: 0.03,
    ERROR_RETRY: 100,
    CAT_STARE: 60
};

const ANOMALY = {
    BASE_LIFESPAN: 800,
    LIFESPAN_VARIANCE: 500,
    BASE_GESTATION: 200,
    GESTATION_VARIANCE: 300,
    SPAWN_CHANCE: 0.002,
    MAX_ANOMALIES: 2,
    ATMOSPHERE_PRECURSOR_CHANCE: 0.005,
    RANDOM_MOVE_CHANCE: 0.03
};

const ROOM = {
    DEFAULT_WIDTH: 10,
    DEFAULT_HEIGHT: 8,
    CORRIDOR_PADDING: 2,
    POLTERGEIST_LIFESPAN: 2000
};

const FurnitureTemplates = {
    'Kitchen': [
        { id: 'Fridge', type: 'fridge.png', dx: 1, dy: 1 },
        { id: 'Stove', type: 'stove.png', dx: 3, dy: 1 },
        { id: 'Table', type: 'table.png', dx: 5, dy: 4 },
        { id: 'Chair', type: 'chair.png', dx: 4, dy: 4 }
    ],
    'Bedroom': [
        { id: 'Bed', type: 'bed.png', dx: 1, dy: 1 },
        { id: 'Rug', type: 'rug.png', dx: 3, dy: 4 }
    ],
    'LivingRoom': [
        { id: 'Sofa', type: 'sofa.png', dx: 2, dy: 2 },
        { id: 'TV', type: 'tv.png', dx: 2, dy: 8 },
        { id: 'Rug', type: 'rug.png', dx: 5, dy: 5 }
    ],
    'Library': [
        { id: 'Bookshelf', type: 'fridge.png', dx: 1, dy: 1 },
        { id: 'Desk', type: 'table.png', dx: 3, dy: 3 },
        { id: 'Chair', type: 'chair.png', dx: 2, dy: 3 }
    ],
    'Medbay': [
        { id: 'Bed_Med', type: 'bed.png', dx: 2, dy: 2 },
        { id: 'Scanner', type: 'computer.png', dx: 4, dy: 2 }
    ],
    'Empty': []
};

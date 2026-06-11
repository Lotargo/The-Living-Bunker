const ROOMS_DATA = [
    {
        name: "Kitchen",
        x: 2, y: 2, w: 10, h: 8,
        floor: "tile",
        spawnCenter: { x: 4, y: 4 },
        furniture: [
            { id: "Fridge", type: "fridge.png", dx: 1, dy: 1 },
            { id: "Stove", type: "stove.png", dx: 3, dy: 1 },
            { id: "Table", type: "table.png", dx: 5, dy: 4 },
            { id: "Chair1", type: "chair.png", dx: 4, dy: 4 },
            { id: "Chair2", type: "chair.png", dx: 6, dy: 4 }
        ],
        doors: [
            { x: 12, y: 6 },
            { x: 12, y: 7 }
        ]
    },
    {
        name: "LivingRoom",
        x: 2, y: 10, w: 10, h: 12,
        floor: "wood",
        spawnCenter: { x: 6, y: 14 },
        furniture: [
            { id: "Rug1", type: "rug.png", dx: 5, dy: 6 },
            { id: "Sofa1", type: "sofa.png", dx: 2, dy: 4 },
            { id: "TV", type: "tv.png", dx: 2, dy: 10 },
            { id: "Plant1", type: "plant.png", dx: 8, dy: 1 },
            { id: "Radio", type: "radio.png", dx: 7, dy: 8 }
        ],
        doors: [
            { x: 12, y: 16 },
            { x: 12, y: 17 }
        ]
    },
    {
        name: "Bathroom",
        x: 2, y: 22, w: 10, h: 8,
        floor: "tile",
        spawnCenter: null,
        furniture: [
            { id: "Shower", type: "shower.png", dx: 1, dy: 1 },
            { id: "Toilet", type: "toilet.png", dx: 4, dy: 1 },
            { id: "Sink", type: "sink.png", dx: 7, dy: 1 }
        ],
        doors: [
            { x: 12, y: 26 }
        ]
    },
    {
        name: "BedroomRed",
        x: 20, y: 2, w: 10, h: 8,
        floor: "wood",
        spawnCenter: { x: 25, y: 4 },
        furniture: [
            { id: "Bed_Red", type: "bed.png", dx: 2, dy: 1, owner: "Red" },
            { id: "Desk1", type: "table.png", dx: 8, dy: 2 }
        ],
        doors: [
            { x: 20, y: 6 }
        ]
    },
    {
        name: "BedroomBlue",
        x: 20, y: 12, w: 10, h: 8,
        floor: "wood",
        spawnCenter: { x: 25, y: 14 },
        furniture: [
            { id: "Bed_Blue", type: "bed.png", dx: 2, dy: 1, owner: "Blue" },
            { id: "Plant2", type: "plant.png", dx: 9, dy: 1 }
        ],
        doors: [
            { x: 20, y: 16 }
        ]
    },
    {
        name: "Lab",
        x: 20, y: 22, w: 10, h: 8,
        floor: "concrete",
        spawnCenter: { x: 25, y: 25 },
        furniture: [
            { id: "Bed_Green", type: "bed.png", dx: 8, dy: 6, owner: "Green" },
            { id: "Computer", type: "computer.png", dx: 2, dy: 1 },
            { id: "ChairLab", type: "chair.png", dx: 3, dy: 2 }
        ],
        doors: [
            { x: 20, y: 26 }
        ]
    }
];

const FLOOR_MAP = {
    "concrete": 0,
    "wood": 2,
    "tile": 3
};

const GRID_SIZE = 64;
const TILE_SIZE = 64;

const FLOOR_CONCRETE = 0;
const FLOOR_WOOD = 2;
const FLOOR_TILE = 3;

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

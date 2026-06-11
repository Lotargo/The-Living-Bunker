const world = {
    residents: [],
    anomalies: [],
    objects: [],
    walls: [],
    map: [],
    floorTypes: [],
    atmosphere: "Normal",
    rooms: []
};

function initMap() {
    world.map = create2DGrid(GRID_SIZE, 0);
    world.floorTypes = create2DGrid(GRID_SIZE, 0);
    world.rooms = [];

    function buildRoom(x, y, w, h, floorType, wallType, name) {
        world.rooms.push({ name: name, x: x, y: y, w: w, h: h });
        fillRoomFloors({ x: x, y: y, w: w, h: h }, floorType);
        buildRoomWalls({ x: x, y: y, w: w, h: h });
    }

    world.walls = [];
    buildRoom(2, 2, 10, 8, FLOOR_TILE, 'wall', 'Kitchen');
    world.objects.push({ id: 'Fridge', x: 3, y: 3, type: 'fridge.png' });
    world.objects.push({ id: 'Stove', x: 5, y: 3, type: 'stove.png' });
    world.objects.push({ id: 'Table', x: 7, y: 6, type: 'table.png' });
    world.objects.push({ id: 'Chair1', x: 6, y: 6, type: 'chair.png' });
    world.objects.push({ id: 'Chair2', x: 8, y: 6, type: 'chair.png' });

    buildRoom(2, 10, 10, 12, FLOOR_WOOD, 'wall', 'LivingRoom');
    world.objects.push({ id: 'Rug1', x: 7, y: 16, type: 'rug.png' });
    world.objects.push({ id: 'Sofa1', x: 4, y: 14, type: 'sofa.png' });
    world.objects.push({ id: 'TV', x: 4, y: 20, type: 'tv.png' });
    world.objects.push({ id: 'Plant1', x: 10, y: 11, type: 'plant.png' });
    world.objects.push({ id: 'Radio', x: 9, y: 18, type: 'radio.png' });

    buildRoom(2, 22, 10, 8, FLOOR_TILE, 'wall', 'Bathroom');
    world.objects.push({ id: 'Shower', x: 3, y: 23, type: 'shower.png' });
    world.objects.push({ id: 'Toilet', x: 6, y: 23, type: 'toilet.png' });
    world.objects.push({ id: 'Sink', x: 9, y: 23, type: 'sink.png' });

    buildRoom(20, 2, 10, 8, FLOOR_WOOD, 'wall', 'BedroomRed');
    world.objects.push({ id: 'Bed_Red', x: 22, y: 3, type: 'bed.png', owner: 'Red' });
    world.objects.push({ id: 'Desk1', x: 28, y: 4, type: 'table.png' });

    buildRoom(20, 12, 10, 8, FLOOR_WOOD, 'wall', 'BedroomBlue');
    world.objects.push({ id: 'Bed_Blue', x: 22, y: 13, type: 'bed.png', owner: 'Blue' });
    world.objects.push({ id: 'Plant2', x: 29, y: 13, type: 'plant.png' });

    buildRoom(20, 22, 10, 8, FLOOR_CONCRETE, 'wall', 'Lab');
    world.objects.push({ id: 'Bed_Green', x: 28, y: 28, type: 'bed.png', owner: 'Green' });
    world.objects.push({ id: 'Computer', x: 22, y: 23, type: 'computer.png' });
    world.objects.push({ id: 'ChairLab', x: 23, y: 24, type: 'chair.png' });

    function makeDoor(x, y) {
        world.walls = world.walls.filter(w => !(w.x === x && w.y === y));
        world.map[x][y] = 0;
    }

    makeDoor(12, 6); makeDoor(12, 7);
    makeDoor(12, 16); makeDoor(12, 17);
    makeDoor(12, 26);
    makeDoor(20, 6);
    makeDoor(20, 16);
    makeDoor(20, 26);
}

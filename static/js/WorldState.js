/** Builds a room from a ROOMS_DATA entry: floors, walls, furniture, doors. */
function buildRoomFromData(data) {
    const rect = { x: data.x, y: data.y, w: data.w, h: data.h };
    world.addRoom({ name: data.name, x: data.x, y: data.y, w: data.w, h: data.h });

    const floorType = FLOOR_MAP[data.floor] !== undefined ? FLOOR_MAP[data.floor] : FLOOR_CONCRETE;
    fillRoomFloors(rect, floorType);
    buildRoomWalls(rect);

    data.furniture.forEach(function(item) {
        world.addObject({
            id: item.id,
            type: item.type,
            x: data.x + item.dx,
            y: data.y + item.dy,
            owner: item.owner || undefined
        });
    });
}

/** Initialises the world grid, builds all rooms from ROOMS_DATA, and cuts doorways. */
function initMap() {
    world.resetMap(GRID_SIZE);
    world.resetRooms();
    world.resetWalls();

    ROOMS_DATA.forEach(buildRoomFromData);

    ROOMS_DATA.forEach(function(room) {
        room.doors.forEach(function(door) {
            world.removeWall(door.x, door.y);
            world.map[door.x][door.y] = 0;
        });
    });
}

/** Returns the spawn center for a room by name, or null if not defined. */
function getRoomSpawnCenter(roomName) {
    const data = ROOMS_DATA.find(function(r) { return r.name === roomName; });
    return data && data.spawnCenter ? data.spawnCenter : null;
}

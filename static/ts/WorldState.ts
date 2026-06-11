function buildRoomFromData(data: RoomData): void {
    const rect: Rect = { x: data.x, y: data.y, w: data.w, h: data.h };
    world.addRoom({ name: data.name, x: data.x, y: data.y, w: data.w, h: data.h });

    const floorType: number = FLOOR_MAP[data.floor] !== undefined ? FLOOR_MAP[data.floor] : FLOOR_CONCRETE;
    fillRoomFloors(rect, floorType);
    buildRoomWalls(rect);

    data.furniture.forEach(function(item: FurnitureData): void {
        world.addObject({
            id: item.id,
            type: item.type,
            x: data.x + item.dx,
            y: data.y + item.dy,
            owner: item.owner || undefined
        });
    });
}

function initMap(): void {
    world.resetMap(GRID_SIZE);
    world.resetRooms();
    world.resetWalls();

    ROOMS_DATA.forEach(buildRoomFromData);

    ROOMS_DATA.forEach(function(room: RoomData): void {
        room.doors.forEach(function(door: { x: number; y: number }): void {
            world.removeWall(door.x, door.y);
            world.map[door.x][door.y] = 0;
        });
    });
}

function getRoomSpawnCenter(roomName: string): { x: number; y: number } | null {
    const data: RoomData | undefined = ROOMS_DATA.find(function(r: RoomData): boolean { return r.name === roomName; });
    return data && data.spawnCenter ? data.spawnCenter : null;
}

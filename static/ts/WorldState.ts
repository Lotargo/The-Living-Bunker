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

    addRoomClutter(data);
}

function addRoomClutter(data: RoomData): void {
    const clutterByFloor: Record<string, string[]> = {
        'wood': ['bottle.png', 'papers.png', 'plant.png'],
        'tile': ['bottle.png', 'crate.png'],
        'concrete': ['crate.png', 'papers.png', 'radio.png']
    };
    const candidates: string[] = clutterByFloor[data.floor] || ['papers.png'];
    const count: number = Math.max(2, Math.floor((data.w * data.h) / 32));

    for (let i: number = 0; i < count; i++) {
        const x: number = data.x + 1 + ((i * 3) % Math.max(1, data.w - 2));
        const y: number = data.y + 1 + ((i * 5) % Math.max(1, data.h - 2));
        const occupied: boolean = data.furniture.some(function(item: FurnitureData): boolean {
            return data.x + item.dx === x && data.y + item.dy === y;
        });
        if (occupied) continue;
        world.addObject({
            id: data.name + '_Clutter_' + i,
            type: candidates[i % candidates.length],
            x: x,
            y: y,
            blocksMovement: false
        });
    }
}

function initMap(): void {
    world.resetMap(GRID_SIZE);
    world.resetRooms();
    world.resetWalls();

    ROOMS_DATA.forEach(buildRoomFromData);
    syncObjectObstacles();

    ROOMS_DATA.forEach(function(room: RoomData): void {
        room.doors.forEach(function(door: { x: number; y: number }): void {
            world.removeWall(door.x, door.y);
            world.map[door.x][door.y] = 0;
        });
    });
}

function syncObjectObstacles(): void {
    world.objects.forEach(function(o: WorldObject): void {
        if (o.blocksMovement === false) return;
        const x: number = Math.round(o.x);
        const y: number = Math.round(o.y);
        if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
            world.map[x][y] = 1;
            if (typeof pf !== 'undefined' && pf) pf.setObstacle(x, y);
        }
    });
}

function getRoomSpawnCenter(roomName: string): { x: number; y: number } | null {
    const data: RoomData | undefined = ROOMS_DATA.find(function(r: RoomData): boolean { return r.name === roomName; });
    return data && data.spawnCenter ? data.spawnCenter : null;
}

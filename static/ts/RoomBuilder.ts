const RoomBuilder = {
    build: function(type: string, targetRoomName: string): boolean {
        const target: Room | undefined = world.rooms.find(function(r: Room): boolean { return r.name === targetRoomName; });
        if (!target) {
            logConsole('system', "Builder Error: Room '" + targetRoomName + "' not found.");
            return false;
        }

        const width: number = ROOM.DEFAULT_WIDTH;
        const height: number = ROOM.DEFAULT_HEIGHT;
        const padding: number = ROOM.CORRIDOR_PADDING;

        const candidates: Rect[] = [
            { x: target.x, y: target.y - height - padding, w: width, h: height },
            { x: target.x, y: target.y + target.h + padding, w: width, h: height },
            { x: target.x + target.w + padding, y: target.y, w: width, h: height },
            { x: target.x - width - padding, y: target.y, w: width, h: height }
        ];

        let bestSpot: Rect | null = null;
        for (const spot of candidates) {
            if (RoomBuilder.isValid(spot)) {
                bestSpot = spot;
                break;
            }
        }

        if (bestSpot) {
            RoomBuilder.construct(bestSpot, type);
            RoomBuilder.connect(target, bestSpot);
            logConsole('system', "Construction Complete: " + type + " built near " + targetRoomName + ".");
            return true;
        } else {
            logConsole('system', "Builder Error: No space near " + targetRoomName + ".");
            return false;
        }
    },

    isValid: function(rect: Rect): boolean {
        if (rect.x < 1 || rect.y < 1 || rect.x + rect.w >= GRID_SIZE || rect.y + rect.h >= GRID_SIZE) return false;

        for (const r of world.rooms) {
            if (rect.x < r.x + r.w && rect.x + rect.w > r.x &&
                rect.y < r.y + r.h && rect.y + rect.h > r.y) {
                return false;
            }
        }

        if (world.floorTypes[rect.x][rect.y] !== 0) return false;

        return true;
    },

    construct: function(rect: Rect, type: string): void {
        const name: string = type + "_" + Math.floor(Math.random() * 100);
        let floor: number = FLOOR_CONCRETE;
        if (['Library', 'LivingRoom', 'Bedroom'].includes(type)) floor = FLOOR_WOOD;
        if (['Kitchen', 'Medbay'].includes(type)) floor = FLOOR_TILE;

        world.addRoom({ name: name, x: rect.x, y: rect.y, w: rect.w, h: rect.h });
        fillRoomFloors(rect, floor);
        buildRoomWalls(rect);

        const template = FurnitureTemplates[type] || FurnitureTemplates['Empty'];
        template.forEach(function(item: { id: string; type: string; dx: number; dy: number }): void {
            world.addObject({
                id: item.id + "_" + Math.floor(Math.random() * 999),
                type: item.type,
                x: rect.x + item.dx,
                y: rect.y + item.dy
            });
        });
    },

    connect: function(roomA: Room, roomB: Rect): void {
        const cx1: number = Math.floor(roomA.x + roomA.w / 2);
        const cy1: number = Math.floor(roomA.y + roomA.h / 2);
        const cx2: number = Math.floor(roomB.x + roomB.w / 2);
        const cy2: number = Math.floor(roomB.y + roomB.h / 2);

        const dig = function(x: number, y: number): void {
            world.removeWall(x, y);
            world.map[x][y] = 0;
            if (world.floorTypes[x][y] === 0) world.floorTypes[x][y] = 1;
            if (typeof pf !== 'undefined' && pf) pf.clearObstacle(x, y);
        };

        let x: number = cx1, y: number = cy1;
        while (x !== cx2) {
            dig(x, y);
            x += Math.sign(cx2 - x);
        }
        while (y !== cy2) {
            dig(x, y);
            y += Math.sign(cy2 - y);
        }
    }
};

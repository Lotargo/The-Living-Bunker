const RoomBuilder = {
    /** Finds a valid spot near targetRoomName and builds a new room of the given type. */
    build: function(type, targetRoomName) {
        const target = world.rooms.find(function(r) { return r.name === targetRoomName; });
        if (!target) {
            logConsole('system', "Builder Error: Room '" + targetRoomName + "' not found.");
            return false;
        }

        const width = ROOM.DEFAULT_WIDTH;
        const height = ROOM.DEFAULT_HEIGHT;
        const padding = ROOM.CORRIDOR_PADDING;

        const candidates = [
            { x: target.x, y: target.y - height - padding, w: width, h: height },
            { x: target.x, y: target.y + target.h + padding, w: width, h: height },
            { x: target.x + target.w + padding, y: target.y, w: width, h: height },
            { x: target.x - width - padding, y: target.y, w: width, h: height }
        ];

        let bestSpot = null;
        for (let spot of candidates) {
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

    /** Returns true if the rect does not overlap existing rooms and is within bounds. */
    isValid: function(rect) {
        if (rect.x < 1 || rect.y < 1 || rect.x + rect.w >= GRID_SIZE || rect.y + rect.h >= GRID_SIZE) return false;

        for (let r of world.rooms) {
            if (rect.x < r.x + r.w && rect.x + rect.w > r.x &&
                rect.y < r.y + r.h && rect.y + rect.h > r.y) {
                return false;
            }
        }

        if (world.floorTypes[rect.x][rect.y] !== 0) return false;

        return true;
    },

    /** Places floors, walls, and furniture for a new room rect. */
    construct: function(rect, type) {
        const name = type + "_" + Math.floor(Math.random()*100);
        let floor = FLOOR_CONCRETE;
        if (['Library', 'LivingRoom', 'Bedroom'].includes(type)) floor = FLOOR_WOOD;
        if (['Kitchen', 'Medbay'].includes(type)) floor = FLOOR_TILE;

        world.rooms.push({ name: name, x: rect.x, y: rect.y, w: rect.w, h: rect.h });
        fillRoomFloors(rect, floor);
        buildRoomWalls(rect);

        const template = FurnitureTemplates[type] || FurnitureTemplates['Empty'];
        template.forEach(function(item) {
            world.objects.push({
                id: item.id + "_" + Math.floor(Math.random()*999),
                type: item.type,
                x: rect.x + item.dx,
                y: rect.y + item.dy
            });
        });
    },

    /** Digs a corridor between the centers of two rooms. */
    connect: function(roomA, roomB) {
        const cx1 = Math.floor(roomA.x + roomA.w/2);
        const cy1 = Math.floor(roomA.y + roomA.h/2);
        const cx2 = Math.floor(roomB.x + roomB.w/2);
        const cy2 = Math.floor(roomB.y + roomB.h/2);

        const dig = function(x, y) {
            world.walls = world.walls.filter(function(w) { return !(w.x === x && w.y === y); });
            world.map[x][y] = 0;
            if (world.floorTypes[x][y] === 0) world.floorTypes[x][y] = 1;
            if (typeof pf !== 'undefined' && pf) pf.clearObstacle(x, y);
        };

        let x = cx1, y = cy1;
        while(x !== cx2) {
            dig(x, y);
            x += Math.sign(cx2 - x);
        }
        while(y !== cy2) {
            dig(x, y);
            y += Math.sign(cy2 - y);
        }
    }
};

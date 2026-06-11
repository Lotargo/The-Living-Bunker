function create2DGrid(size: number, initial: number): number[][] {
    return Array.from({ length: size }, function(): number[] {
        return Array.from({ length: size }, function(): number { return initial; });
    });
}

function buildRoomWalls(rect: Rect): void {
    for (let i: number = rect.x; i < rect.x + rect.w; i++) {
        world.addWall({ x: i, y: rect.y, type: 'wall_right.png' });
        world.map[i][rect.y] = 1;
        if (typeof pf !== 'undefined' && pf) pf.setObstacle(i, rect.y);
        world.addWall({ x: i, y: rect.y + rect.h, type: 'wall_right.png' });
        world.map[i][rect.y + rect.h] = 1;
        if (typeof pf !== 'undefined' && pf) pf.setObstacle(i, rect.y + rect.h);
    }
    for (let j: number = rect.y; j < rect.y + rect.h; j++) {
        world.addWall({ x: rect.x, y: j, type: 'wall_left.png' });
        world.map[rect.x][j] = 1;
        if (typeof pf !== 'undefined' && pf) pf.setObstacle(rect.x, j);
        world.addWall({ x: rect.x + rect.w, y: j, type: 'wall_left.png' });
        world.map[rect.x + rect.w][j] = 1;
        if (typeof pf !== 'undefined' && pf) pf.setObstacle(rect.x + rect.w, j);
    }
}

function fillRoomFloors(rect: Rect, floorType: number): void {
    for (let i: number = rect.x; i < rect.x + rect.w; i++) {
        for (let j: number = rect.y; j < rect.y + rect.h; j++) {
            world.floorTypes[i][j] = floorType;
        }
    }
}

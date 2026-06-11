/** Creates a size x size 2D array filled with initial value. */
function create2DGrid(size, initial) {
    return Array.from({ length: size }, function() {
        return Array.from({ length: size }, function() { return initial; });
    });
}

/** Builds wall tiles around the perimeter of a room rect and marks them as obstacles. */
function buildRoomWalls(rect) {
    for(let i=rect.x; i<rect.x+rect.w; i++) {
         world.addWall({ x: i, y: rect.y, type: 'wall_right.png' });
         world.map[i][rect.y] = 1;
         if (typeof pf !== 'undefined' && pf) pf.setObstacle(i, rect.y);
         world.addWall({ x: i, y: rect.y+rect.h, type: 'wall_right.png' });
         world.map[i][rect.y+rect.h] = 1;
         if (typeof pf !== 'undefined' && pf) pf.setObstacle(i, rect.y+rect.h);
    }
    for(let j=rect.y; j<rect.y+rect.h; j++) {
         world.addWall({ x: rect.x, y: j, type: 'wall_left.png' });
         world.map[rect.x][j] = 1;
         if (typeof pf !== 'undefined' && pf) pf.setObstacle(rect.x, j);
         world.addWall({ x: rect.x+rect.w, y: j, type: 'wall_left.png' });
         world.map[rect.x+rect.w][j] = 1;
         if (typeof pf !== 'undefined' && pf) pf.setObstacle(rect.x+rect.w, j);
    }
}

/** Fills a room's floor area with the given floorType. */
function fillRoomFloors(rect, floorType) {
    for(let i=rect.x; i<rect.x+rect.w; i++) {
        for(let j=rect.y; j<rect.y+rect.h; j++) {
            world.floorTypes[i][j] = floorType;
        }
    }
}

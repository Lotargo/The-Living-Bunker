class Pathfinding {
    constructor(gridSize) {
        this.size = gridSize;
        // 0 = Walkable, 1 = Wall
        this.grid = create2DGrid(gridSize, 0);
    }

    setObstacle(x, y) {
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
            this.grid[x][y] = 1;
        }
    }

    clearObstacle(x, y) {
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
            this.grid[x][y] = 0;
        }
    }

    isWalkable(x, y) {
        return x >= 0 && x < this.size && y >= 0 && y < this.size && this.grid[x][y] === 0;
    }

    // A* Algorithm
    findPath(startX, startY, endX, endY) {
        if (!this.isWalkable(endX, endY)) return null;

        let openSet = [{ x: startX, y: startY, g: 0, f: 0, parent: null }];
        let closedSet = [];

        while (openSet.length > 0) {
            // Get lowest f
            let currentIdx = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[currentIdx].f) currentIdx = i;
            }
            let current = openSet[currentIdx];

            // Reached goal?
            if (current.x === endX && current.y === endY) {
                let path = [];
                let temp = current;
                while (temp) {
                    path.push({ x: temp.x, y: temp.y });
                    temp = temp.parent;
                }
                return path.reverse();
            }

            openSet.splice(currentIdx, 1);
            closedSet.push(current);

            let neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (let n of neighbors) {
                if (!this.isWalkable(n.x, n.y)) continue;
                if (closedSet.find(c => c.x === n.x && c.y === n.y)) continue;

                let gScore = current.g + 1;
                let neighborInOpen = openSet.find(o => o.x === n.x && o.y === n.y);

                if (!neighborInOpen || gScore < neighborInOpen.g) {
                    let h = Math.abs(n.x - endX) + Math.abs(n.y - endY);
                    let newNode = {
                        x: n.x, y: n.y,
                        g: gScore,
                        f: gScore + h,
                        parent: current
                    };

                    if (!neighborInOpen) openSet.push(newNode);
                    else {
                        neighborInOpen.g = gScore;
                        neighborInOpen.f = gScore + h;
                        neighborInOpen.parent = current;
                    }
                }
            }
        }
        return null; // No path
    }
}

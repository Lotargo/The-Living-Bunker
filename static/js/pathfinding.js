class BinaryHeap {
    constructor(scoreFn) {
        this.content = [];
        this.scoreFn = scoreFn;
    }

    push(element) {
        this.content.push(element);
        this._bubbleUp(this.content.length - 1);
    }

    pop() {
        const result = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this._sinkDown(0);
        }
        return result;
    }

    size() {
        return this.content.length;
    }

    _bubbleUp(n) {
        const element = this.content[n];
        const score = this.scoreFn(element);
        while (n > 0) {
            const parentN = Math.floor((n + 1) / 2) - 1;
            const parent = this.content[parentN];
            if (score >= this.scoreFn(parent)) break;
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }

    _sinkDown(n) {
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFn(element);

        while (true) {
            let child2N = (n + 1) * 2;
            let child1N = child2N - 1;
            let swap = null;
            let child1Score = null;

            if (child1N < length) {
                const child1 = this.content[child1N];
                child1Score = this.scoreFn(child1);
                if (child1Score < elemScore) swap = child1N;
            }

            if (child2N < length) {
                const child2 = this.content[child2N];
                const child2Score = this.scoreFn(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            if (swap === null) break;

            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
}

class Pathfinding {
    constructor(gridSize) {
        this.size = gridSize;
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

    findPath(startX, startY, endX, endY) {
        if (!this.isWalkable(endX, endY)) return null;

        const start = { x: startX, y: startY, g: 0, f: 0, parent: null };
        const openHeap = new BinaryHeap(function(node) { return node.f; });
        openHeap.push(start);

        const closedSet = new Set();

        while (openHeap.size() > 0) {
            const current = openHeap.pop();

            if (current.x === endX && current.y === endY) {
                const path = [];
                let temp = current;
                while (temp) {
                    path.push({ x: temp.x, y: temp.y });
                    temp = temp.parent;
                }
                return path.reverse();
            }

            closedSet.add(current.x + ',' + current.y);

            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (let n of neighbors) {
                if (!this.isWalkable(n.x, n.y)) continue;
                const key = n.x + ',' + n.y;
                if (closedSet.has(key)) continue;

                const gScore = current.g + 1;
                const h = Math.abs(n.x - endX) + Math.abs(n.y - endY);
                const fScore = gScore + h;

                const neighborInOpen = openHeap.content.find(function(o) { return o.x === n.x && o.y === n.y; });

                if (!neighborInOpen) {
                    openHeap.push({ x: n.x, y: n.y, g: gScore, f: fScore, parent: current });
                } else if (gScore < neighborInOpen.g) {
                    neighborInOpen.g = gScore;
                    neighborInOpen.f = fScore;
                    neighborInOpen.parent = current;
                }
            }
        }
        return null;
    }
}

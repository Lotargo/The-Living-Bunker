const assert = require('node:assert');
const { describe, it } = require('node:test');

function create2DGrid(size, initial) {
    return Array.from({ length: size }, function() {
        return Array.from({ length: size }, function() { return initial; });
    });
}

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
        if (!this.isWalkable(startX, startY) || !this.isWalkable(endX, endY)) return null;

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


describe('BinaryHeap', () => {
    it('should pop elements in priority order (min-heap)', () => {
        const heap = new BinaryHeap(n => n);
        heap.push(5);
        heap.push(3);
        heap.push(8);
        heap.push(1);
        heap.push(4);
        assert.strictEqual(heap.pop(), 1);
        assert.strictEqual(heap.pop(), 3);
        assert.strictEqual(heap.pop(), 4);
        assert.strictEqual(heap.pop(), 5);
        assert.strictEqual(heap.pop(), 8);
    });

    it('should handle single element', () => {
        const heap = new BinaryHeap(n => n);
        heap.push(42);
        assert.strictEqual(heap.pop(), 42);
        assert.strictEqual(heap.size(), 0);
    });

    it('should handle empty heap pop', () => {
        const heap = new BinaryHeap(n => n);
        assert.strictEqual(heap.pop(), undefined);
    });

    it('should handle duplicate values', () => {
        const heap = new BinaryHeap(n => n);
        heap.push(3);
        heap.push(1);
        heap.push(1);
        heap.push(2);
        assert.strictEqual(heap.pop(), 1);
        assert.strictEqual(heap.pop(), 1);
        assert.strictEqual(heap.pop(), 2);
        assert.strictEqual(heap.pop(), 3);
    });

    it('should work with object scores', () => {
        const heap = new BinaryHeap(o => o.f);
        heap.push({ f: 10, id: 'a' });
        heap.push({ f: 5, id: 'b' });
        heap.push({ f: 15, id: 'c' });
        assert.strictEqual(heap.pop().id, 'b');
        assert.strictEqual(heap.pop().id, 'a');
        assert.strictEqual(heap.pop().id, 'c');
    });
});

describe('Pathfinding', () => {
    it('should find a straight horizontal path on empty grid', () => {
        const pf = new Pathfinding(10);
        const path = pf.findPath(0, 0, 5, 0);
        assert.ok(path);
        assert.strictEqual(path.length, 6);
        assert.deepStrictEqual(path[0], { x: 0, y: 0 });
        assert.deepStrictEqual(path[5], { x: 5, y: 0 });
    });

    it('should find a straight vertical path on empty grid', () => {
        const pf = new Pathfinding(10);
        const path = pf.findPath(3, 1, 3, 7);
        assert.ok(path);
        assert.strictEqual(path.length, 7);
        assert.deepStrictEqual(path[0], { x: 3, y: 1 });
        assert.deepStrictEqual(path[6], { x: 3, y: 7 });
    });

    it('should find a diagonal L-shaped path on empty grid', () => {
        const pf = new Pathfinding(10);
        const path = pf.findPath(0, 0, 3, 4);
        assert.ok(path);
        assert.strictEqual(path.length, 8);
        assert.deepStrictEqual(path[0], { x: 0, y: 0 });
        assert.deepStrictEqual(path[7], { x: 3, y: 4 });
    });

    it('should navigate around a single obstacle', () => {
        const pf = new Pathfinding(5);
        pf.setObstacle(2, 0);
        const path = pf.findPath(0, 0, 4, 0);
        assert.ok(path);
        assert.deepStrictEqual(path[0], { x: 0, y: 0 });
        assert.deepStrictEqual(path[path.length - 1], { x: 4, y: 0 });
        const blocked = path.some(p => p.x === 2 && p.y === 0);
        assert.strictEqual(blocked, false);
    });

    it('should navigate around a wall', () => {
        const pf = new Pathfinding(7);
        for (let x = 0; x < 6; x++) pf.setObstacle(x, 2);
        const path = pf.findPath(0, 0, 6, 4);
        assert.ok(path);
        assert.deepStrictEqual(path[0], { x: 0, y: 0 });
        assert.deepStrictEqual(path[path.length - 1], { x: 6, y: 4 });
        const onWallTile = path.some(p => pf.grid[p.x][p.y] === 1);
        assert.strictEqual(onWallTile, false);
    });

    it('should return null when no path exists (blocked end)', () => {
        const pf = new Pathfinding(5);
        pf.setObstacle(4, 4);
        const path = pf.findPath(0, 0, 4, 4);
        assert.strictEqual(path, null);
    });

    it('should return null when start or end is out of bounds', () => {
        const pf = new Pathfinding(5);
        assert.strictEqual(pf.findPath(-1, 0, 3, 3), null);
        assert.strictEqual(pf.findPath(0, 0, 10, 10), null);
    });

    it('should return path with single point when start equals end', () => {
        const pf = new Pathfinding(5);
        const path = pf.findPath(3, 3, 3, 3);
        assert.ok(path);
        assert.strictEqual(path.length, 1);
        assert.deepStrictEqual(path[0], { x: 3, y: 3 });
    });

    it('should return null when start is on an obstacle', () => {
        const pf = new Pathfinding(5);
        pf.setObstacle(0, 0);
        const path = pf.findPath(0, 0, 3, 3);
        assert.strictEqual(path, null);
    });

    it('should find path in a U-shaped corridor', () => {
        const pf = new Pathfinding(7);
        for (let y = 0; y < 5; y++) {
            pf.setObstacle(3, y);
        }
        pf.clearObstacle(3, 2);
        const path = pf.findPath(0, 0, 6, 4);
        assert.ok(path);
        assert.deepStrictEqual(path[0], { x: 0, y: 0 });
        assert.deepStrictEqual(path[path.length - 1], { x: 6, y: 4 });
    });

    it('should prefer shorter paths (not detour unnecessarily)', () => {
        const pf = new Pathfinding(10);
        const pathDirect = pf.findPath(0, 0, 5, 0);
        const pathDiagonal = pf.findPath(0, 0, 3, 3);
        assert.ok(pathDirect);
        assert.ok(pathDiagonal);
        assert.strictEqual(pathDirect.length, 6);
    });

    it('should handle large empty grid efficiently', () => {
        const pf = new Pathfinding(100);
        const path = pf.findPath(0, 0, 99, 99);
        assert.ok(path);
        assert.strictEqual(path.length, 199);
        assert.deepStrictEqual(path[0], { x: 0, y: 0 });
        assert.deepStrictEqual(path[path.length - 1], { x: 99, y: 99 });
    });

    it('should correctly update obstacles with setObstacle/clearObstacle', () => {
        const pf = new Pathfinding(5);
        assert.strictEqual(pf.isWalkable(2, 2), true);
        pf.setObstacle(2, 2);
        assert.strictEqual(pf.isWalkable(2, 2), false);
        pf.clearObstacle(2, 2);
        assert.strictEqual(pf.isWalkable(2, 2), true);
    });

    it('should handle out-of-bounds setObstacle/clearObstacle gracefully', () => {
        const pf = new Pathfinding(5);
        pf.setObstacle(100, 100);
        assert.strictEqual(pf.isWalkable(100, 100), false);
        pf.clearObstacle(100, 100);
    });
});

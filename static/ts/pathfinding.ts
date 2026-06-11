class BinaryHeap {
    content: AStarNode[];
    scoreFn: (node: AStarNode) => number;

    constructor(scoreFn: (node: AStarNode) => number) {
        this.content = [];
        this.scoreFn = scoreFn;
    }

    push(element: AStarNode): void {
        this.content.push(element);
        this._bubbleUp(this.content.length - 1);
    }

    pop(): AStarNode {
        const result: AStarNode = this.content[0];
        const end: AStarNode = this.content.pop()!;
        if (this.content.length > 0) {
            this.content[0] = end;
            this._sinkDown(0);
        }
        return result;
    }

    size(): number {
        return this.content.length;
    }

    private _bubbleUp(n: number): void {
        const element: AStarNode = this.content[n];
        const score: number = this.scoreFn(element);
        while (n > 0) {
            const parentN: number = Math.floor((n + 1) / 2) - 1;
            const parent: AStarNode = this.content[parentN];
            if (score >= this.scoreFn(parent)) break;
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }

    private _sinkDown(n: number): void {
        const length: number = this.content.length;
        const element: AStarNode = this.content[n];
        const elemScore: number = this.scoreFn(element);

        while (true) {
            let child2N: number = (n + 1) * 2;
            let child1N: number = child2N - 1;
            let swap: number | null = null;
            let child1Score: number = Infinity;

            if (child1N < length) {
                const child1: AStarNode = this.content[child1N];
                child1Score = this.scoreFn(child1);
                if (child1Score < elemScore) swap = child1N;
            }

            if (child2N < length) {
                const child2: AStarNode = this.content[child2N];
                const child2Score: number = this.scoreFn(child2);
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
    size: number;
    grid: number[][];

    constructor(gridSize: number) {
        this.size = gridSize;
        this.grid = create2DGrid(gridSize, 0);
    }

    setObstacle(x: number, y: number): void {
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
            this.grid[x][y] = 1;
        }
    }

    clearObstacle(x: number, y: number): void {
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
            this.grid[x][y] = 0;
        }
    }

    isWalkable(x: number, y: number): boolean {
        return x >= 0 && x < this.size && y >= 0 && y < this.size && this.grid[x][y] === 0;
    }

    findPath(startX: number, startY: number, endX: number, endY: number): PathNode[] | null {
        if (!this.isWalkable(startX, startY) || !this.isWalkable(endX, endY)) return null;

        const start: AStarNode = { x: startX, y: startY, g: 0, f: 0, parent: null };
        const openHeap: BinaryHeap = new BinaryHeap(function(node: AStarNode): number { return node.f; });
        openHeap.push(start);

        const closedSet: Set<string> = new Set();

        while (openHeap.size() > 0) {
            const current: AStarNode = openHeap.pop();

            if (current.x === endX && current.y === endY) {
                const path: PathNode[] = [];
                let temp: AStarNode | null = current;
                while (temp) {
                    path.push({ x: temp.x, y: temp.y });
                    temp = temp.parent;
                }
                return path.reverse();
            }

            closedSet.add(current.x + ',' + current.y);

            const neighbors: PathNode[] = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (const n of neighbors) {
                if (!this.isWalkable(n.x, n.y)) continue;
                const key: string = n.x + ',' + n.y;
                if (closedSet.has(key)) continue;

                const gScore: number = current.g + 1;
                const h: number = Math.abs(n.x - endX) + Math.abs(n.y - endY);
                const fScore: number = gScore + h;

                const neighborInOpen: AStarNode | undefined = openHeap.content.find(
                    function(o: AStarNode): boolean { return o.x === n.x && o.y === n.y; }
                );

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

class StateManager {
    residents: Resident[];
    anomalies: Anomaly[];
    objects: WorldObject[];
    walls: Wall[];
    map: number[][];
    floorTypes: number[][];
    atmosphere: string;
    rooms: Room[];

    private _staticDirty: boolean;

    constructor() {
        this.residents = [];
        this.anomalies = [];
        this.objects = [];
        this.walls = [];
        this.map = [];
        this.floorTypes = [];
        this.atmosphere = "Normal";
        this.rooms = [];
        this._staticDirty = true;
    }

    get staticDirty(): boolean { return this._staticDirty; }
    markStaticDirty(): void { this._staticDirty = true; }
    clearStaticDirty(): void { this._staticDirty = false; }

    addObject(obj: WorldObject): void {
        this.objects.push(obj);
        this._staticDirty = true;
    }

    removeObject(id: string): void {
        const idx: number = this.objects.findIndex(function(o: WorldObject): boolean { return o.id === id; });
        if (idx !== -1) {
            this.objects.splice(idx, 1);
            this._staticDirty = true;
        }
    }

    addWall(wall: Wall): void {
        this.walls.push(wall);
        this._staticDirty = true;
    }

    removeWall(x: number, y: number): void {
        this.walls = this.walls.filter(function(w: Wall): boolean { return !(w.x === x && w.y === y); });
        this._staticDirty = true;
    }

    resetWalls(): void {
        this.walls = [];
        this._staticDirty = true;
    }

    addRoom(room: Room): void {
        this.rooms.push(room);
        this._staticDirty = true;
    }

    resetRooms(): void {
        this.rooms = [];
        this._staticDirty = true;
    }

    addResident(resident: Resident): void {
        this.residents.push(resident);
    }

    addAnomaly(anomaly: Anomaly): void {
        this.anomalies.push(anomaly);
    }

    removeAnomalies(predicate: (a: Anomaly) => boolean): void {
        this.anomalies = this.anomalies.filter(predicate);
    }

    setAtmosphere(atm: string): void {
        this.atmosphere = atm;
        EventBus.emit('world.atmosphere', 'system', { atmosphere: atm });
    }

    resetMap(size: number): void {
        this.map = create2DGrid(size, 0);
        this.floorTypes = create2DGrid(size, 0);
    }
}

const world: StateManager = new StateManager();

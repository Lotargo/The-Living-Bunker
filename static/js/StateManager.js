class StateManager {
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

    get staticDirty() { return this._staticDirty; }
    markStaticDirty() { this._staticDirty = true; }
    clearStaticDirty() { this._staticDirty = false; }

    addObject(obj) {
        this.objects.push(obj);
        this._staticDirty = true;
    }

    removeObject(id) {
        const idx = this.objects.findIndex(function(o) { return o.id === id; });
        if (idx !== -1) {
            this.objects.splice(idx, 1);
            this._staticDirty = true;
        }
    }

    addWall(wall) {
        this.walls.push(wall);
        this._staticDirty = true;
    }

    removeWall(x, y) {
        this.walls = this.walls.filter(function(w) { return !(w.x === x && w.y === y); });
        this._staticDirty = true;
    }

    resetWalls() {
        this.walls = [];
        this._staticDirty = true;
    }

    addRoom(room) {
        this.rooms.push(room);
        this._staticDirty = true;
    }

    resetRooms() {
        this.rooms = [];
        this._staticDirty = true;
    }

    addResident(resident) {
        this.residents.push(resident);
    }

    addAnomaly(anomaly) {
        this.anomalies.push(anomaly);
    }

    removeAnomalies(predicate) {
        this.anomalies = this.anomalies.filter(predicate);
    }

    setAtmosphere(atm) {
        this.atmosphere = atm;
    }

    resetMap(size) {
        this.map = create2DGrid(size, 0);
        this.floorTypes = create2DGrid(size, 0);
    }
}

const world = new StateManager();

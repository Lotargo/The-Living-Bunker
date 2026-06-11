interface GeneratedRoom {
    name: string;
    type: string;
    x: number;
    y: number;
    w: number;
    h: number;
    floor: string;
    spawnCenter: { x: number; y: number } | null;
    furniture: FurnitureData[];
    doors: DoorData[];
    windows?: WindowData[];
    props?: PropData[];
}

interface RoomLayout {
    rooms: GeneratedRoom[];
    seed: number;
}

interface RoomConfig {
    type: string;
    x: number;
    y: number;
    owner?: string;
    name?: string;
}

class ProceduralGenerator {
    private layouts: Map<string, { x: number; y: number; w: number; h: number }> = new Map();

    generateBunkerLayout(seed?: number): Promise<RoomLayout> {
        const actualSeed = seed || Math.floor(Math.random() * 1000000);
        const rooms: GeneratedRoom[] = [];

        this.layouts.clear();

        const gridSize = 64;
        const margin = 2;
        const corridorW = 3;

        const leftX = margin;
        const rightX = Math.floor(gridSize / 2) + 2;
        const corridorX = Math.floor(gridSize / 2) - 1;

        const topY = margin;
        const midY = 18;
        const botY = 36;
        const bottomY = 52;

        const allRooms: RoomConfig[] = [
            { type: 'kitchen', x: leftX, y: topY, name: 'Kitchen' },
            { type: 'storage', x: leftX, y: midY, name: 'Storage' },
            { type: 'bathroom', x: leftX, y: botY, name: 'Bathroom' },
            { type: 'livingroom', x: leftX, y: bottomY, name: 'LivingRoom' },

            { type: 'bedroom', x: rightX, y: topY, owner: 'Red', name: 'BedroomRed' },
            { type: 'bedroom', x: rightX, y: midY, owner: 'Blue', name: 'BedroomBlue' },
            { type: 'lab', x: rightX, y: botY, name: 'Lab' },
            { type: 'medbay', x: rightX, y: bottomY, name: 'Medbay' },
        ];

        const promises: Promise<void>[] = [];

        allRooms.forEach(roomConfig => {
            const p = this.fetchRoom(roomConfig.type, roomConfig.x, roomConfig.y, actualSeed)
                .then(room => {
                    if (roomConfig.name) room.name = roomConfig.name;
                    if (roomConfig.owner) {
                        room.furniture.forEach(f => {
                            if (f.type === 'bed.png') {
                                f.owner = roomConfig.owner;
                            }
                        });
                    }
                    rooms.push(room);
                    this.layouts.set(room.name, {
                        x: room.x,
                        y: room.y,
                        w: room.w,
                        h: room.h
                    });
                });
            promises.push(p);
        });

        return Promise.all(promises).then(() => {
            this.addCorridors(rooms, corridorX, margin, gridSize - margin * 2);
            return { rooms, seed: actualSeed };
        });
    }

    private fetchRoom(type: string, x: number, y: number, seed: number): Promise<GeneratedRoom> {
        return fetch('/api/generate-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, x, y, seed })
        })
        .then(res => {
            if (!res.ok) throw new Error(`Failed to generate ${type}`);
            return res.json();
        });
    }

    private addCorridors(rooms: GeneratedRoom[], corridorX: number, startY: number, totalHeight: number): void {
        const corridorW = 3;

        const mainCorridor: GeneratedRoom = {
            name: 'MainCorridor',
            type: 'corridor',
            x: corridorX,
            y: startY,
            w: corridorW,
            h: totalHeight,
            floor: 'floor_concrete',
            spawnCenter: null,
            furniture: [],
            doors: [],
            windows: [],
            props: []
        };
        rooms.push(mainCorridor);

        const leftRooms = rooms.filter(r => r.x < corridorX && r.type !== 'corridor');
        const rightRooms = rooms.filter(r => r.x > corridorX && r.type !== 'corridor');

        leftRooms.forEach(room => {
            const doorY = room.y + Math.floor(room.h / 2);
            room.doors.push({ x: room.x + room.w, y: doorY, type: 'door_open_frame_wood' });
            mainCorridor.doors.push({ x: corridorX, y: doorY, type: 'door_open_frame_wood' });
        });

        rightRooms.forEach(room => {
            const doorY = room.y + Math.floor(room.h / 2);
            room.doors.push({ x: room.x, y: doorY, type: 'door_open_frame_wood' });
            mainCorridor.doors.push({ x: corridorX + corridorW - 1, y: doorY, type: 'door_open_frame_wood' });
        });
    }

    buildLayout(layout: RoomLayout, callback: () => void): void {
        layout.rooms.forEach(room => {
            buildRoomFromData(room);
        });

        syncObjectObstacles();

        layout.rooms.forEach(room => {
            room.doors.forEach(door => {
                world.removeWall(door.x, door.y);
                world.map[door.x][door.y] = 0;
            });
        });

        callback();
    }
}

const proceduralGen = new ProceduralGenerator();

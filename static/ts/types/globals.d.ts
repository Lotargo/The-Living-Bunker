interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Wall {
    x: number;
    y: number;
    type: string;
}

interface WorldObject {
    id: string;
    type: string;
    x: number;
    y: number;
    owner?: string;
}

interface Room {
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Needs {
    hunger: number;
    energy: number;
    fun: number;
    hygiene: number;
}

interface PathNode {
    x: number;
    y: number;
}

interface AStarNode extends PathNode {
    g: number;
    f: number;
    parent: AStarNode | null;
}

interface Decision {
    action: string;
    target?: string;
    thought?: string;
    real_intent?: string;
    reveal?: boolean;
}

interface RenderItem {
    type: string;
    ref: any;
    x: number;
    y: number;
    sortZ: number;
}

interface GodCommand {
    action: string;
    type?: string;
    location?: string;
    target?: string;
    content?: string;
    roomType?: string;
    near?: string;
}

interface RoomData {
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    floor: string;
    spawnCenter: { x: number; y: number } | null;
    furniture: FurnitureData[];
    doors: { x: number; y: number }[];
}

interface FurnitureData {
    id: string;
    type: string;
    dx: number;
    dy: number;
    owner?: string;
}

interface ScreenPos {
    x: number;
    y: number;
}

interface NearbyObject {
    id: string;
    type: string;
    dist?: number;
    behavior?: string;
}

interface VisibleAnomaly {
    type: string;
    stage: string;
    dist: number;
}

interface Context {
    name: string;
    state: string;
    needs: Needs;
    health: number;
    nearby: { id: string; type: string; behavior?: string }[];
    anomalies: VisibleAnomaly[];
    atmosphere: string;
    memory: {
        whisper_count: number;
        recent_memories: string[];
    };
}

interface AnomalyContext {
    type: string;
    anomalyType: string;
    stage: string;
    lifespan: number;
    nearbyResidents: string[];
    lunaDist: number;
}

interface ArchitectRequest {
    prompt: string;
}

interface ArchitectResponse {
    response?: string;
    commands?: GodCommand[];
}

interface RuntimeEvent {
    version: 'v1';
    id: string;
    type: string;
    ts: number;
    source: string;
    [key: string]: any;
}

type RuntimeEventHandler = (event: RuntimeEvent) => void;

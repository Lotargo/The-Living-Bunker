# Runtime Contracts

These contracts describe the messages that move between the browser simulation, Flask adapter, Python LLM orchestration, and future event transport.

The project is intentionally lightweight, so these are practical JSON contracts rather than a heavy schema system. Keep them stable enough for tests, demo mode, and a future WebSocket path.

## Conventions

- Contract names are written as TypeScript-style names because the browser is the most visible client.
- Unknown fields should be ignored by receivers.
- Required fields are listed without `?`; optional fields use `?`.
- Coordinates are grid coordinates, not screen pixels.
- Current contract version: `v1`.

## DecisionRequest

Sent by residents to `POST /api/decide`.

```ts
type DecisionRequest = ResidentDecisionRequest | AnomalyDecisionRequest;
```

### ResidentDecisionRequest

```ts
interface ResidentDecisionRequest {
  type?: "resident";
  name: "Red" | "Blue" | "Green" | "Luna";
  state: string;
  needs: Needs;
  health: number;
  nearby: NearbyObject[];
  anomalies: VisibleAnomaly[];
  atmosphere: string;
  memory: ResidentMemory;
}
```

### AnomalyDecisionRequest

```ts
interface AnomalyDecisionRequest {
  type: "anomaly";
  anomalyType: "Ghost" | "Glitch" | "Doppelganger" | "Poltergeist" | string;
  stage: "GESTATING" | "ACTIVE" | string;
  lifespan: number;
  nearbyResidents: string[];
  lunaDist: number;
}
```

## DecisionResponse

Returned by `POST /api/decide`.

```ts
interface DecisionResponse {
  thought?: string;
  real_intent?: string;
  action: string;
  target?: string;
  reveal?: boolean;
}
```

Expected action values currently include:

```txt
MOVE, IDLE, USE, SIT, PLAY, LISTEN, INSPECT, ATTACK, FLEE,
STARE, SLEEP, HISS, PURR,
GESTATE, MANIFEST, HAUNT, SPOOK, GLITCH, MIMIC, SCAR
```

## ArchitectRequest

Sent by the console to `POST /api/architect`.

```ts
interface ArchitectRequest {
  prompt: string;
}
```

## ArchitectResponse

Returned by `POST /api/architect`.

```ts
interface ArchitectResponse {
  response?: string;
  commands: GodCommand[];
}
```

## GodCommand

Commands produced by the Architect and consumed by the browser simulation.

```ts
type GodCommand =
  | SpawnCommand
  | AtmosphereCommand
  | WhisperCommand
  | BuildCommand
  | EventCommand;

interface SpawnCommand {
  action: "SPAWN";
  type: "Ghost" | "Glitch" | "Doppelganger" | "Poltergeist" | string;
  location?: string;
}

interface AtmosphereCommand {
  action: "ATMOSPHERE";
  type: string;
}

interface WhisperCommand {
  action: "WHISPER";
  target: "Red" | "Blue" | "Green" | "Luna" | "All" | string;
  content: string;
}

interface BuildCommand {
  action: "BUILD";
  roomType: "Kitchen" | "Bedroom" | "LivingRoom" | "Library" | "Medbay" | "Empty" | string;
  near?: string;
}

interface EventCommand {
  action: "EVENT";
  type: "MASS_HYSTERIA" | string;
  location?: string;
}
```

## Shared Shapes

```ts
interface Needs {
  hunger: number;
  energy: number;
  fun: number;
  hygiene: number;
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

interface ResidentMemory {
  whisper_count: number;
  recent_memories: string[];
}
```

## RuntimeEvent

This is the target event shape for the next sprint tasks. It can be emitted locally first, then sent over WebSocket later.

```ts
type RuntimeEvent =
  | LogEvent
  | AgentThoughtEvent
  | AgentActionEvent
  | ArchitectEvent
  | WorldCommandEvent
  | WorldAtmosphereEvent;

interface RuntimeEventBase {
  version: "v1";
  id: string;
  type: string;
  ts: number;
  source: "client" | "server" | "architect" | "agent" | "system";
}

interface LogEvent extends RuntimeEventBase {
  type: "log.entry";
  who: string;
  message: string;
}

interface AgentThoughtEvent extends RuntimeEventBase {
  type: "agent.thought";
  actor: string;
  thought: string;
  intent?: string;
}

interface AgentActionEvent extends RuntimeEventBase {
  type: "agent.action";
  actor: string;
  action: string;
  target?: string;
}

interface ArchitectEvent extends RuntimeEventBase {
  type: "architect.response";
  response: string;
  commands: GodCommand[];
}

interface WorldCommandEvent extends RuntimeEventBase {
  type: "world.command";
  command: GodCommand;
}

interface WorldAtmosphereEvent extends RuntimeEventBase {
  type: "world.atmosphere";
  atmosphere: string;
}
```

## Current HTTP Endpoints

```txt
POST /api/decide
  body: DecisionRequest
  response: DecisionResponse

POST /api/architect
  body: ArchitectRequest
  response: ArchitectResponse

GET /api/settings
  response: RuntimeSettings

POST /api/settings
  body: RuntimeSettings
  response: RuntimeSettings
```

## RuntimeSettings

```ts
interface RuntimeSettings {
  providerMode: "default" | "demo" | "openai_compatible" | "opencode_zen" | "ollama";
  demoMode?: boolean;
  openaiBaseUrl?: string;
  openaiApiKey?: string;
  openaiApiKeyConfigured?: boolean;
  openaiModel?: string;
  opencodeZenApiKey?: string;
  opencodeZenApiKeyConfigured?: boolean;
  opencodeZenModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}
```

## Next Implementation Step

Add a frontend `BrainClient` that uses these contract names and hides the raw `fetch` calls from `Resident`, `Anomaly`, and `ConsoleController`.

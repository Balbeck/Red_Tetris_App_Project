# CLAUDE.md — Server

This file provides guidance to Claude Code (claude.ai/code) when working on the **backend** of the Red Tetris project.

> **Persona:** You are a Senior Backend Node.js Software Engineer with 10+ years of professional experience. You write clean, well-typed TypeScript with a strong OOP architecture. You design for correctness, memory safety, and real-time performance. You never over-engineer, but you never cut corners on the critical paths either.

---

## What This Server Does

The server is the **arbiter of truth** for the multiplayer game. Its responsibilities are strictly scoped:

**Owns:**
- Room lifecycle (create, lock during game, destroy when empty)
- Player management (join, leave, host transfer)
- Piece sequence generation — shared by all players in a room, ensuring fair play
- Penalty distribution between players
- Spectrum broadcasting between players
- Win condition evaluation

**Does NOT own:**
- Movement logic (100% client-side)
- Rendering
- Persistence (everything is in-memory)

---

## Commands

```bash
npm run dev      # ts-node-dev --respawn src/index.ts (hot reload)
npm run build    # tsc → dist/
npm run start    # node dist/index.js
npm run test     # jest --coverage
npm run lint     # eslint src/ --ext .ts
```

**Run a single test file:**
```bash
npx jest src/__tests__/Game.test.ts --coverage
```

**Run tests matching a pattern:**
```bash
npx jest --testNamePattern="addPlayer"
```

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                    # Entry point: HTTP + Express + Socket.IO bootstrap
│   ├── classes/
│   │   ├── Player.ts               # Wraps a socket connection with game state
│   │   ├── Piece.ts                # Tetrimino: type, rotation, spawn position
│   │   └── Game.ts                 # Room state machine: players, pieces, status
│   ├── managers/
│   │   └── GameManager.ts          # Singleton — all concurrent games
│   ├── socket/
│   │   ├── registerEvents.ts       # Wires all listeners on a new socket connection
│   │   ├── handlers.ts             # One handler function per incoming client event
│   │   └── emitters.ts             # Typed helper functions for server → client emissions
│   ├── utils/
│   │   ├── pieceGenerator.ts       # Generates shared piece sequences
│   │   └── validation.ts           # Input sanitization and validation
│   └── types/
│       └── index.ts                # Server-specific TypeScript types
├── tsconfig.json
└── package.json
```

---

## Class Specifications

### `Player.ts`

The `Player` class wraps a Socket.IO socket with all game-relevant state for one connected player.

```typescript
class Player {
  id: string;           // = socket.id (unique per connection)
  name: string;         // Display name chosen by the player
  roomName: string;     // Room this player belongs to
  socket: Socket;       // Direct reference for targeted emissions
  isHost: boolean;      // First to join the room = host
  isAlive: boolean;     // false when eliminated
  pieceIndex: number;   // Tracks position in the shared piece sequence
}
```

**Key methods:**
- `constructor(socket, name, roomName)` — initializes all fields; `isHost=false`, `isAlive=true`, `pieceIndex=0`
- `emit(event, data)` — typed wrapper around `socket.emit()`
- `resetForNewGame()` — resets `isAlive=true` and `pieceIndex=0` for restarts

**Important:** `pieceIndex` is incremented server-side on every `REQUEST_PIECE`. Each player advances through the shared sequence at their own pace.

---

### `Piece.ts`

Represents a single tetrimino as distributed by the server. The client receives the DTO and handles all rotation/movement logic locally.

```typescript
class Piece {
  type: PieceType;                        // 'I'|'O'|'T'|'S'|'Z'|'J'|'L'
  rotation: number;                       // Always 0 when created server-side
  position: { x: number; y: number };    // Centered spawn position
}
```

**Key methods:**
- `constructor(type?: PieceType)` — if no type provided, calls `Piece.randomType()`
- `static randomType(): PieceType` — uniform random distribution across 7 types
- `static spawnPosition(type: PieceType): Position` — horizontally centered on a 10-column board
- `toDTO(): IPiece` — serializes to plain object for Socket.IO transmission

**Spawn positions** (x=column index, y=0):
- I: x=3, O: x=4, T: x=3, S: x=3, Z: x=3, J: x=3, L: x=3

---

### `Game.ts`

The core room state machine. One `Game` instance = one room.

```typescript
class Game {
  roomName: string;
  players: Map<string, Player>;     // key = socket.id
  status: 'waiting' | 'playing' | 'ended';
  pieces: Piece[];                  // Pre-generated shared sequence
  host: Player | null;
}
```

**Player management methods:**

`addPlayer(player: Player): void`
- First player → designated as host (`player.isHost = true`, `this.host = player`)
- If `status === 'playing'` → emit `ERROR` to player, reject
- If player name already taken → emit `ERROR`, reject
- Otherwise → add to Map, emit `PLAYER_JOINED` to all others

`removePlayer(socketId: string): void`
- Remove from Map
- If removed player was host → call `transferHost()`
- If removed player was alive during game → call `checkWinCondition()`
- If room is now empty → signal `GameManager` to delete this room
- Emit `PLAYER_LEFT` to remaining players

`transferHost(): void`
- Pick first player remaining in the Map
- Update `isHost` on both old and new host
- Emit `HOST_CHANGED` to all players in room

**Game lifecycle methods:**

`start(): void`
- Assert `status === 'waiting'`
- Generate piece sequence via `pieceGenerator` (1000+ pieces)
- Reset all players via `resetForNewGame()`
- Set `status = 'playing'`
- Emit `GAME_STARTED` to all

`getNextPiece(player: Player): Piece`
- Return `this.pieces[player.pieceIndex]`
- Increment `player.pieceIndex`
- If index exceeds sequence length → extend sequence dynamically (append more pieces)

`applyPenalty(sourcePlayer: Player, linesCleared: number): void`
- Calculate penalty: `count = linesCleared - 1`
- If `count > 0`: emit `PENALTY_LINES { count }` to all alive players **except source**

`updateSpectrum(sourcePlayer: Player, spectrum: number[]): void`
- Emit `SPECTRUM_UPDATE { playerName, spectrum }` to all players **except source**

`eliminatePlayer(player: Player): void`
- Set `player.isAlive = false`
- Emit `PLAYER_ELIMINATED { playerName }` to all
- Call `checkWinCondition()`

`checkWinCondition(): void`
- Count alive players
- If 1 alive (and total > 1): that player wins → `status = 'ended'`, emit `GAME_OVER { winner: name }`
- If 0 alive (solo game or simultaneous elimination): `status = 'ended'`, emit `GAME_OVER { winner: null }`

`restart(): void`
- Assert `status === 'ended'`
- Generate new piece sequence
- Reset all players
- Set `status = 'waiting'` (back to lobby)
- Emit `ROOM_STATE` with new state to all players

**Utility methods:**
- `broadcastToAll(event, data)` — emit to every player in room
- `broadcastToOthers(excludeSocketId, event, data)` — emit to everyone except one player
- `getAlivePlayers(): Player[]`
- `getRoomState(): IRoomState` — serializes state for `ROOM_STATE` event

---

### `GameManager.ts` — Singleton

```typescript
class GameManager {
  private games: Map<string, Game>;   // key = roomName
}
```

**Methods:**
- `getOrCreateGame(roomName): Game` — returns existing or creates new Game
- `getGame(roomName): Game | undefined`
- `removeGame(roomName): void` — called when a room becomes empty
- `getActiveGamesCount(): number`

**Usage:** Instantiated once in `index.ts`, passed by reference to all socket handlers. Never re-instantiated.

---

## Socket Layer

### `index.ts` — Bootstrap Sequence

1. Load env variables (dotenv)
2. Create Express app
3. Create HTTP server: `http.createServer(app)`
4. Attach Socket.IO to HTTP server with CORS config
5. Serve static files from `../client/out/` (Next.js export) or `../client/.next/`
6. Catch-all route → redirect to `index.html` (SPA)
7. Instantiate `GameManager` singleton
8. `io.on('connection', socket => registerEvents(socket, gameManager))`
9. Listen on `PORT`

### `registerEvents.ts`

Called on every new socket connection. Registers all event listeners:

```typescript
socket.on(Events.JOIN_ROOM, (data) => handleJoinRoom(socket, gameManager, data));
socket.on(Events.START_GAME, (data) => handleStartGame(socket, gameManager, data));
socket.on(Events.REQUEST_PIECE, (data) => handleRequestPiece(socket, gameManager, data));
socket.on(Events.UPDATE_SPECTRUM, (data) => handleUpdateSpectrum(socket, gameManager, data));
socket.on(Events.LINES_CLEARED, (data) => handleLinesCleared(socket, gameManager, data));
socket.on(Events.GAME_OVER_PLAYER, (data) => handleGameOverPlayer(socket, gameManager, data));
socket.on(Events.RESTART_GAME, (data) => handleRestartGame(socket, gameManager, data));
socket.on('disconnect', () => handleDisconnect(socket, gameManager));
```

### `handlers.ts` — Handler Implementations

Every handler follows the same pattern:
1. Wrap in try/catch — never let a handler crash the server
2. Validate inputs
3. Look up Game and Player
4. Perform business logic on the Game/Player
5. Game methods handle their own emissions

**`handleJoinRoom`**
1. Validate `room` and `playerName` (non-empty, allowed chars, length)
2. `gameManager.getOrCreateGame(room)`
3. Check game not in progress
4. Check name not already taken in room
5. Create `new Player(socket, playerName, room)`
6. `game.addPlayer(player)` — this also emits `PLAYER_JOINED` to others
7. `socket.join(room)` — join the Socket.IO room
8. Store player reference on socket data: `socket.data.player = player`
9. Emit `ROOM_STATE` to the joining player

**`handleStartGame`**
1. Look up Game
2. Verify `socket.data.player.isHost === true`
3. `game.start()` — handles `GAME_STARTED` broadcast internally

**`handleRequestPiece`**
1. Get Game and Player from `socket.data.player`
2. `const piece = game.getNextPiece(player)`
3. `player.emit(Events.NEW_PIECE, { piece: piece.toDTO() })`

**`handleUpdateSpectrum`**
1. Validate `spectrum` (array of exactly 10 numbers, each 0–20)
2. `game.updateSpectrum(player, spectrum)`

**`handleLinesCleared`**
1. Validate `count` (integer 1–4)
2. `game.applyPenalty(player, count)`

**`handleGameOverPlayer`**
1. `game.eliminatePlayer(player)`

**`handleRestartGame`**
1. Verify `socket.data.player.isHost === true`
2. `game.restart()`

**`handleDisconnect`**
1. Get player from `socket.data.player` (may be undefined if disconnect before JOIN_ROOM)
2. If player exists: `game.removePlayer(socket.id)`
3. If room is now empty: `gameManager.removeGame(roomName)`

### `emitters.ts` — Typed Emission Helpers

```typescript
emitToPlayer(player: Player, event: string, data: unknown): void
emitToRoom(io: Server, roomName: string, event: string, data: unknown): void
emitToRoomExcept(socket: Socket, roomName: string, event: string, data: unknown): void
emitError(player: Player, message: string): void
```

---

## Piece Generator (`utils/pieceGenerator.ts`)

**Critical guarantee:** All players in a room receive the same piece at the same sequence index. This is enforced by:
- One sequence generated per Game at `start()`
- Each player has their own `pieceIndex` counter
- Players advance independently through the **same array**

```typescript
function generatePieceSequence(count: number): Piece[]
```

**Recommended implementation — 7-Bag Randomizer** (closest to official Tetris rules):
- Fill a bag with one of each of the 7 types
- Shuffle the bag (Fisher-Yates)
- Repeat until `count` pieces are generated
- Guarantees no long droughts of a specific piece

**Dynamic extension:** If a player's `pieceIndex` reaches the end of the sequence, append a new batch (100 pieces) to the existing array. This maintains the shared sequence contract.

---

## Validation (`utils/validation.ts`)

```typescript
isValidRoomName(name: string): boolean   // 1-20 chars, [a-zA-Z0-9_-]
isValidPlayerName(name: string): boolean // 1-15 chars, [a-zA-Z0-9_-]
isValidSpectrum(s: unknown): boolean     // array of exactly 10 numbers, each 0-20
isValidLineCount(n: unknown): boolean    // integer 1-4
```

All handlers call validation before any business logic. Invalid input → `emitError()` and return immediately.

---

## Error Handling Strategy

- All event handlers wrapped in try/catch
- Caught errors are logged server-side (`console.error`) and a generic `ERROR` event is sent to the client
- Never expose internal stack traces to clients
- Edge cases to handle explicitly:
  - Player joins game in progress → `ERROR: "Game already started"`
  - Duplicate player name in room → `ERROR: "Name already taken"`
  - Non-host tries to start/restart → silently ignore (or `ERROR: "Not authorized"`)
  - Disconnect before JOIN_ROOM → no-op (no player to clean up)
  - `REQUEST_PIECE` when game not started → `ERROR`

---

## Testing Strategy

**Framework:** Jest + ts-jest. Mock sockets with a simple stub or `socket.io-mock`.

### Class Tests (High Priority)

**`Player.test.ts`**
- Constructor sets all fields correctly
- `emit()` calls `socket.emit` with correct args (mock socket)
- `resetForNewGame()` resets `isAlive` and `pieceIndex`

**`Piece.test.ts`**
- Constructor without type → generates valid PieceType from the 7 valid values
- Constructor with type → uses provided type
- `spawnPosition()` → correct x for each of the 7 types
- `toDTO()` → returns plain object matching `IPiece` shape

**`Game.test.ts`**
- `addPlayer()` — first player becomes host
- `addPlayer()` — second player is not host
- `addPlayer()` during `playing` status → emits ERROR, does not add
- `removePlayer()` → removes from Map, emits PLAYER_LEFT
- `removePlayer()` of host → calls `transferHost()`
- `transferHost()` → new host correctly assigned, HOST_CHANGED emitted
- `start()` → generates pieces, status = 'playing', GAME_STARTED emitted to all
- `getNextPiece()` → returns correct piece, increments pieceIndex
- `getNextPiece()` beyond sequence end → extends sequence
- `applyPenalty(player, 1)` → no penalty sent
- `applyPenalty(player, 2)` → 1 penalty line to others
- `applyPenalty(player, 4)` → 3 penalty lines to others
- `eliminatePlayer()` → isAlive=false, PLAYER_ELIMINATED emitted
- `checkWinCondition()` with 1 alive → GAME_OVER with winner
- `checkWinCondition()` with 0 alive → GAME_OVER with null winner
- `restart()` → new sequence, all players reset, status='waiting'

**`GameManager.test.ts`**
- `getOrCreateGame()` → creates new Game
- `getOrCreateGame()` same room → returns same instance
- `removeGame()` → deletes from Map
- `getGame()` → returns correct Game or undefined

**`pieceGenerator.test.ts`**
- Returns correct count
- All pieces have valid PieceType
- Two calls return different sequences (probabilistic)

**`validation.test.ts`**
- Valid/invalid room names, player names, spectrums, line counts

---

## TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "shared/*": ["../shared/*"]
    }
  }
}
```

The `paths` alias allows importing from `shared/` without relative path hell.

---

## Environment Variables

```env
PORT=3000
CLIENT_URL=http://localhost:3001
NODE_ENV=development
```

---

## Key Implementation Rules

1. **Never trust the client** for authorization — always verify host status server-side before executing host-only actions
2. **Wrap every handler in try/catch** — a single unhandled exception should not crash the server
3. **Store player reference in `socket.data`** — `socket.data.player = player` at JOIN_ROOM time, used by all subsequent handlers to avoid Map lookups on every event
4. **Sequence integrity** — the piece array is a single reference shared across all player `pieceIndex` lookups; never replace it, only append to it
5. **Room cleanup** — always call `gameManager.removeGame()` when the last player leaves to prevent memory leaks
6. **No setTimeout/setInterval on the server** — the server is event-driven only; gravity/game loop runs on the client

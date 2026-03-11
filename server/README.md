# ⚙️ Red Tetris — Backend Server

> **42 School Project** | Real-time Multiplayer Tetris — Node.js API
> Node.js + Express + Socket.IO + TypeScript | OOP Architecture | Zero Persistence

---

## 📋 Quick Start

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### Installation

```bash
cd server
cp .env.example .env
npm install
```

---

## 🚀 Commands

### Development Server

```bash
npm run dev
```

**What it does:**
- Starts the server with `ts-node-dev` on port `3000`
- Hot-reloads on every TypeScript file change
- Uses `tsconfig-paths` to resolve `shared/*` path aliases at runtime
- `--transpile-only` flag skips type-checking for faster restarts

**When to use:** During development — the server restarts automatically on save.

**Output on start:**
```
  ██████╗ ███████╗██████╗     ████████╗███████╗████████╗...
  🚀 Server running on http://localhost:3000
  🎮 Frontend expected at http://localhost:3001
```

---

### Production Build

```bash
npm run build
```

**What it does:**
- Compiles TypeScript (`tsc`) → `.js` files in `dist/`
- Runs `tsc-alias` to resolve path aliases (`shared/*`) in the compiled output
- Generates source maps and type declarations

**When to use:** Before deploying to production or before running `npm start`.

**Implication:** Output goes to `dist/`. Must be run before serving production. Clean `dist/` between builds if needed.

---

### Start Production Server

```bash
npm run start
```

**What it does:**
- Runs the pre-compiled `dist/index.js` with plain Node.js
- No TypeScript compilation — fastest possible startup
- Serves static client files from `../client/out/` if available

**When to use:** After `npm run build`, for production deployment.

**Implication:** Requires a completed build. Changes to source require a rebuild.

---

### Run Tests

```bash
npm run test
```

**What it does:**
- Runs Jest test suite with `ts-jest` (TypeScript support)
- Generates coverage report in `coverage/`
- Resolves `shared/*` imports via `moduleNameMapper` in `jest.config.js`

**Coverage thresholds (42 subject requirement):**
| Metric | Minimum |
|--------|---------|
| Statements | 70% |
| Functions | 70% |
| Lines | 70% |
| Branches | 50% |

**Run a single test file:**
```bash
npx jest src/__tests__/Game.test.ts --coverage
```

**Run tests matching a pattern:**
```bash
npx jest --testNamePattern="addPlayer"
```

---

### Linting

```bash
npm run lint
```

**What it does:**
- Runs ESLint with TypeScript parser on all `src/**/*.ts` files
- Enforces strict TypeScript rules
- Does NOT auto-fix (use `--fix` flag for auto-fix)

---

## 📁 Project Structure

```
server/
├── src/
│   ├── index.ts                    # Entry point — HTTP + Socket.IO bootstrap
│   │
│   ├── classes/                    # OOP classes (mandatory per 42 subject)
│   │   ├── Player.ts               # Connected player with socket + game state
│   │   ├── Piece.ts                # Tetrimino — type, rotation, spawn position
│   │   └── Game.ts                 # Room state machine — the core class
│   │
│   ├── managers/
│   │   └── GameManager.ts          # Singleton — all concurrent rooms
│   │
│   ├── socket/
│   │   ├── registerEvents.ts       # Wires all listeners on new connection
│   │   ├── handlers.ts             # One function per incoming event
│   │   └── emitters.ts             # Typed helpers for server → client
│   │
│   ├── utils/
│   │   ├── pieceGenerator.ts       # 7-bag randomizer — fair piece sequences
│   │   └── validation.ts           # Input sanitization + type guards
│   │
│   └── types/
│       └── index.ts                # SocketWithData, HandlerFn, etc.
│
├── .env.example                    # Environment variable template
├── .gitignore
├── jest.config.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🏗️ Architecture Overview

### Request Flow

```
Client (Socket.IO)
        │
        │  emit('JOIN_ROOM', { room, playerName })
        ▼
┌──────────────────────────────────────────────────────┐
│  registerEvents.ts  (one socket = one connection)     │
│                                                      │
│  socket.on('JOIN_ROOM', handler)                     │
│  socket.on('REQUEST_PIECE', handler)                 │
│  socket.on('LINES_CLEARED', handler)                 │
│  ...                                                 │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  handlers.ts                                         │
│                                                      │
│  1. Validate inputs                                  │
│  2. Get Player from socket.data.player               │
│  3. Get Game from GameManager                        │
│  4. Call Game method (business logic)                │
│  5. Game method handles its own broadcasts           │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  Game.ts (state machine)                             │
│                                                      │
│  status: 'waiting' → 'playing' → 'ended'             │
│  players: Map<socketId, Player>                      │
│  pieces: Piece[] (shared sequence)                   │
│                                                      │
│  game.addPlayer()   → PLAYER_JOINED broadcast        │
│  game.start()       → GAME_STARTED broadcast         │
│  game.getNextPiece()→ NEW_PIECE to player            │
│  game.applyPenalty()→ PENALTY_LINES to opponents     │
│  game.eliminatePlayer() → PLAYER_ELIMINATED          │
│  game.checkWinCondition() → GAME_OVER               │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
        Player.emit(event, data)
        (socket.emit on the player's socket)
```

### Piece Fairness Guarantee

```
game.start()
     │
     ▼
generatePieceSequence(1000)
     │
     │  7-bag randomizer:
     │  [T,L,I,S,Z,O,J] → shuffle → add to array
     │  [Z,I,O,T,L,J,S] → shuffle → add to array
     │  ... repeat until 1000 pieces
     │
     ▼
this.pieces = Piece[1000]   ← same array, shared by ALL players

Player A: pieceIndex = 0 → pieces[0] (I)
Player B: pieceIndex = 0 → pieces[0] (I) ← same piece!
Player A: pieceIndex = 1 → pieces[1] (T)
Player B: pieceIndex = 1 → pieces[1] (T) ← same piece!
```

### Game State Machine

```
                 ┌──────────────┐
    New Room ──► │   WAITING    │◄── restart()
                 └──────┬───────┘
                        │ start() [host only]
                        ▼
                 ┌──────────────┐
                 │   PLAYING    │
                 └──────┬───────┘
                        │ checkWinCondition() → ≤1 alive
                        │ or all disconnect
                        ▼
                 ┌──────────────┐
                 │    ENDED     │
                 └──────────────┘
```

---

## 🔌 Socket.IO Protocol

### Events Received from Client

| Event | Payload | Handler |
|-------|---------|---------|
| `JOIN_ROOM` | `{ room, playerName }` | `handleJoinRoom` |
| `START_GAME` | `{}` | `handleStartGame` |
| `REQUEST_PIECE` | `{}` | `handleRequestPiece` |
| `UPDATE_SPECTRUM` | `{ spectrum: number[] }` | `handleUpdateSpectrum` |
| `LINES_CLEARED` | `{ count: 1-4 }` | `handleLinesCleared` |
| `GAME_OVER_PLAYER` | `{}` | `handleGameOverPlayer` |
| `RESTART_GAME` | `{}` | `handleRestartGame` |
| `disconnect` | — | `handleDisconnect` |

### Events Sent to Client

| Event | Payload | Trigger |
|-------|---------|---------|
| `ROOM_STATE` | `{ players, status, isHost }` | On join or restart |
| `PLAYER_JOINED` | `{ playerName }` | New player in room |
| `PLAYER_LEFT` | `{ playerName }` | Player disconnected |
| `HOST_CHANGED` | `{ newHost }` | Host transfer |
| `GAME_STARTED` | `{}` | Host starts game |
| `NEW_PIECE` | `{ piece: IPiece }` | Response to REQUEST_PIECE |
| `SPECTRUM_UPDATE` | `{ playerName, spectrum }` | After UPDATE_SPECTRUM |
| `PENALTY_LINES` | `{ count }` | After LINES_CLEARED |
| `PLAYER_ELIMINATED` | `{ playerName }` | After GAME_OVER_PLAYER |
| `GAME_OVER` | `{ winner: string \| null }` | Win condition met |
| `ERROR` | `{ message: string }` | Invalid input / not authorized |

---

## 🔒 Security & Validation

All inputs are validated before processing:

```typescript
isValidRoomName(name)    // 1-20 chars, [a-zA-Z0-9_-]
isValidPlayerName(name)  // 1-15 chars, [a-zA-Z0-9_-]
isValidSpectrum(s)       // number[10], each 0-20
isValidLineCount(n)      // integer 1-4
```

**Authorization rules:**
- Only the **host** can emit `START_GAME` or `RESTART_GAME` — verified server-side
- Players cannot join a room **mid-game** (status must be `'waiting'`)
- **Player names are case-insensitive** — `"Alice"` and `"alice"` conflict
- Every handler is wrapped in `try/catch` — server never crashes on bad input

---

## 🧪 Testing Strategy

Tests live in `src/__tests__/` and use Jest + ts-jest.

**Priority order:**

### 1. Classes (High Priority)
```bash
npx jest Player.test.ts
npx jest Piece.test.ts
npx jest Game.test.ts
```

Key cases for `Game.test.ts`:
- `addPlayer` — first player becomes host
- `addPlayer` during 'playing' — throws error
- `removePlayer` of host — `transferHost()` called
- `start()` — sequence generated, status = 'playing'
- `getNextPiece()` — correct index incremented
- `applyPenalty(player, 1)` — no penalty sent
- `applyPenalty(player, 4)` — 3 penalties sent
- `checkWinCondition()` with 1 alive — GAME_OVER emitted
- `restart()` — status back to 'waiting'

### 2. GameManager (High Priority)
```bash
npx jest GameManager.test.ts
```

### 3. Piece Generator (High Priority)
```bash
npx jest pieceGenerator.test.ts
```
- All 7 piece types present in a sequence of 7
- Sequence length matches requested count

### 4. Validation (Medium Priority)
```bash
npx jest validation.test.ts
```

---

## ⚙️ Environment Variables

`.env` (created from `.env.example`):

```env
PORT=3000
CLIENT_URL=http://localhost:3001
NODE_ENV=development
```

---

## 🔧 Development Workflow

### 1. Start in dev mode
```bash
npm run dev
```
→ Server auto-restarts on save

### 2. Test the server
```bash
# Using the health endpoint
curl http://localhost:3000/health

# Expected:
# { "status": "ok", "env": "development", "rooms": 0, "uptime": 42 }
```

### 3. Connect the frontend
```bash
# In another terminal
cd ../client && npm run dev
# → http://localhost:3001
```

### 4. Full production test
```bash
# 1. Build Next.js to static export
cd ../client
echo 'output: "export"' >> next.config.mjs  # add static export
npm run build

# 2. Build + start server (serves both API + frontend)
cd ../server
npm run build
npm run start
# → http://localhost:3000 serves everything
```

---

## 🚨 42 Subject Rules Enforced

| Rule | Implementation |
|------|---------------|
| **OOP with classes** | `Player`, `Piece`, `Game` — mandatory |
| **Zero persistence** | All state in-memory (`Map<>`) |
| **Same pieces for all** | Shared `Piece[]` array + per-player `pieceIndex` |
| **No mid-game joins** | `addPlayer()` throws if `status === 'playing'` |
| **Host-only actions** | `player.isHost` check in handlers |
| **Serve static files** | Express serves `../client/out/` in production |
| **Test coverage** | 70% stmt/fn/lines, 50% branches |

---

## 🔗 Related

- **Frontend**: `/client/README.md`
- **Shared Protocol**: `/shared/events.ts` + `/shared/types.ts`
- **Architecture Guide**: `/server/CLAUDE.md`

---

**Built with ❤️ for 42 School**

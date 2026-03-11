# CLAUDE.md — Client

This file provides guidance to Claude Code (claude.ai/code) when working on the **frontend** of the Red Tetris project.

> **Persona:** You are a Senior Frontend Software Engineer with 10+ years of career experience, specialized in Next.js, React, modern SPA design, and component-driven architecture. You write clean, functional TypeScript with zero class components. You have an eye for polished UI — glassmorphism, smooth animations, responsive layouts. You design for correctness first, aesthetics second, but never compromise on either.

---

## What This Client Does

A Single Page Application that renders a real-time multiplayer Tetris game. The client:
- Handles **all game logic** (movement, rotation, collision, line clearing, gravity) via pure functions
- Communicates with the server **only for** piece distribution, spectrum sharing, penalty reception, and room events
- Uses Redux to manage global state, with a socketMiddleware bridging Redux actions ↔ Socket.IO events

---

## Commands

```bash
npm run dev      # next dev (development server with hot reload)
npm run build    # next build (production build)
npm run start    # next start (serve production build)
npm run test     # jest --coverage
npm run lint     # eslint src/ --ext .ts,.tsx
```

**Run a single test file:**
```bash
npx jest src/__tests__/board.test.ts --coverage
```

**Run tests matching a pattern:**
```bash
npx jest --testNamePattern="clearLines"
```

---

## Project Structure

```
client/
├── src/
│   ├── app/                                    # Next.js App Router — Pages only
│   │   ├── layout.tsx                          # Root layout: Redux Provider, Socket init, Tailwind
│   │   ├── page.tsx                            # Home page → renders Home_Component
│   │   └── [room]/
│   │       └── [player]/
│   │           └── page.tsx                    # Game page → Lobby or Game screen
│   │
│   ├── components/                             # All business logic lives here
│   │   ├── HomeComponents/
│   │   │   ├── Home_Component.tsx              # Room/player form, navigation, error handling
│   │   │   └── Layout_Home.tsx                 # Centered glass card layout
│   │   ├── LobbyComponents/
│   │   │   ├── Lobby_Component.tsx             # Player list, host start button
│   │   │   └── Layout_Lobby.tsx
│   │   ├── GameBoardComponents/
│   │   │   ├── GameBoard_Component.tsx         # Merges board + active piece, renders 10×20 grid
│   │   │   └── Layout_GameBoard.tsx            # CSS Grid 10 cols
│   │   ├── CellComponents/
│   │   │   ├── Cell_Component.tsx              # Single cell: color by type (0-8)
│   │   │   └── Layout_Cell.tsx                 # Square aspect ratio, border, glass effect
│   │   ├── NextPieceComponents/
│   │   │   ├── NextPiece_Component.tsx         # 4×4 mini-grid preview
│   │   │   └── Layout_NextPiece.tsx
│   │   ├── SpectrumComponents/
│   │   │   ├── Spectrum_Component.tsx          # All opponents' spectrums
│   │   │   └── Layout_Spectrum.tsx
│   │   ├── GameInfoComponents/
│   │   │   ├── GameInfo_Component.tsx          # Room name, player count, status
│   │   │   └── Layout_GameInfo.tsx
│   │   ├── GameOverlayComponents/
│   │   │   ├── GameOverlay_Component.tsx       # Game Over / Victory / Defeated overlay
│   │   │   └── Layout_GameOverlay.tsx
│   │   └── SharedComponents/
│   │       ├── Button_Component.tsx
│   │       ├── Input_Component.tsx
│   │       └── Layout_SharedComponents.tsx
│   │
│   ├── game/                                   # Pure functions — zero side effects, zero `this`
│   │   ├── board.ts                            # createBoard, mergePiece, isValidPosition, addPenaltyLines, calculateSpectrum
│   │   ├── pieces.ts                           # TETRIMINOS definitions, getPieceShape, PIECE_COLORS, getSpawnPosition
│   │   ├── movement.ts                         # moveLeft, moveRight, moveDown, rotatePiece, hardDrop, getGhostPosition
│   │   ├── lines.ts                            # getCompletedLines, clearLines, calculatePenalty
│   │   └── gravity.ts                          # getGravityInterval, shouldLockPiece
│   │
│   ├── hooks/
│   │   ├── useSocket.ts                        # Singleton socket.io-client lifecycle
│   │   ├── useGameLoop.ts                      # setInterval gravity loop, dispatches moveDown
│   │   └── useKeyboard.ts                      # keydown listener, maps keys → Redux actions
│   │
│   ├── store/
│   │   ├── index.ts                            # Redux store configuration
│   │   ├── slices/
│   │   │   ├── gameSlice.ts                    # board, activePiece, nextPiece, status, penaltyQueue
│   │   │   ├── roomSlice.ts                    # roomName, players, spectrums, isHost, gameStatus, winner
│   │   │   └── uiSlice.ts                      # currentScreen, notifications, isConnected
│   │   └── middleware/
│   │       └── socketMiddleware.ts             # Redux actions ↔ Socket.IO events bridge
│   │
│   ├── socket/
│   │   ├── socket.ts                           # Singleton socket.io-client instance
│   │   └── events.ts                           # Re-exports from shared/events.ts
│   │
│   └── types/
│       └── index.ts                            # Client types + re-exports from shared/types.ts
│
├── public/                                     # Static assets
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Absolute Rules (42 Subject — Violations = Project Failure)

- **`this` is forbidden** in all client code — no exceptions except `Error` subclasses
- **No Canvas, SVG, `<TABLE>` elements** anywhere in JSX or CSS
- **No jQuery** or any DOM manipulation library
- **No class components** — functional components + hooks only
- **No CSS `position: absolute` layouts** — Grid and Flexbox exclusively (Tailwind)
- **SPA constraint** — one `index.html`, one `bundle.js`, no full-page reloads
- **Pure functions** — all game logic in `game/` must have zero side effects

---

## Architecture: Component-First Pattern

**3-layer separation — never mix layers:**

| Layer | Rule |
|-------|------|
| **Pages** (`app/`) | Extract URL params, assemble components, zero logic, zero state |
| **Layouts** (`Layout_*.tsx`) | Positioning and spacing only — no logic, no socket, no state |
| **Components** (`*_Component.tsx`) | Business logic, local state, socket events, Redux dispatch |

**Component folder structure:**
Every component lives in its own folder with exactly two files:
- `ComponentName_Component.tsx` — logic + render
- `Layout_ComponentName.tsx` — positioning/sizing only

---

## Pages

### `app/layout.tsx` — Root Layout
- Wraps entire app in `<Provider store={store}>` (Redux)
- Initializes socket connection (calls `useSocket` hook)
- Imports global Tailwind styles
- Sets background gradient: `bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900`
- No business logic

### `app/page.tsx` — Home
- Renders `<Layout_Home><Home_Component /></Layout_Home>`
- Nothing else

### `app/[room]/[player]/page.tsx` — Game Page
- Extracts `room` and `player` from route params
- Redirects to `/` if either param is missing or invalid
- At mount: triggers JOIN_ROOM via socket (via `useSocket` or dispatching an action)
- Renders conditionally based on `gameStatus` from Redux:
  - `'waiting'` → `<Lobby_Component />`
  - `'playing'` → full game layout (GameBoard + Spectrum + NextPiece + GameInfo)
  - `'ended'` → game layout + `<GameOverlay_Component />` on top

---

## Game Logic — Pure Functions (`game/`)

All functions are **pure**: deterministic, no side effects, no `this`. They take inputs and return new values — never mutate.

### `board.ts`

```typescript
createBoard(): BoardType
// Returns a fresh 10×20 board filled with 0s

mergePiece(board: BoardType, piece: IPiece): BoardType
// Returns NEW board with piece cells written in (immutable)

isValidPosition(board: BoardType, piece: IPiece): boolean
// True if piece is within bounds and doesn't overlap existing cells

addPenaltyLines(board: BoardType, count: number): BoardType
// Shifts all rows UP by count, adds count indestructible rows (value=8) at bottom

calculateSpectrum(board: BoardType): number[]
// Returns array[10] — height of topmost filled cell per column (0 = empty column)
```

### `pieces.ts`

```typescript
const TETRIMINOS: Record<PieceType, number[][][]>
// 7 pieces × 4 rotations × NxN matrix — the complete shape definitions

getPieceShape(type: PieceType, rotation: number): number[][]
// Returns the 2D matrix for a given piece type and rotation state

const PIECE_COLORS: Record<number, string>
// Maps cell value (1-8) to Tailwind class string

getSpawnPosition(type: PieceType): { x: number; y: number }
// Returns centered spawn position at top of board
```

### `movement.ts`

```typescript
moveLeft(board: BoardType, piece: IPiece): IPiece
moveRight(board: BoardType, piece: IPiece): IPiece
moveDown(board: BoardType, piece: IPiece): IPiece
// Returns new piece at new position, or SAME piece if move invalid

rotatePiece(board: BoardType, piece: IPiece): IPiece
// Cycles rotation 0→1→2→3→0, applies basic wall-kick if at boundary

hardDrop(board: BoardType, piece: IPiece): IPiece
// Returns piece at lowest valid y position

getGhostPosition(board: BoardType, piece: IPiece): IPiece
// Returns ghost piece at landing position (for visual preview)
```

### `lines.ts`

```typescript
getCompletedLines(board: BoardType): number[]
// Returns indices of fully filled rows

clearLines(board: BoardType): { board: BoardType; linesCleared: number }
// Removes complete rows, shifts remaining rows down, returns new board + count

calculatePenalty(linesCleared: number): number
// Returns linesCleared - 1 (0 for 1 line, 1 for 2, 2 for 3, 3 for Tetris)
```

### `gravity.ts`

```typescript
getGravityInterval(level: number): number
// Returns drop interval in ms (default 800ms, decreases with level)

shouldLockPiece(board: BoardType, piece: IPiece): boolean
// True if piece cannot move down (used to trigger lock after grace frame)
```

---

## Hooks

### `useSocket.ts`
- Creates and returns the singleton `socket.io-client` instance
- Connects to server on mount, disconnects on unmount
- Handles reconnection automatically
- Exposes typed `emit` and `on` methods

### `useGameLoop.ts`
- Runs a `setInterval` at `getGravityInterval(level)` ms
- On each tick: `dispatch(moveDown())`
- Only active when `gameStatus === 'playing'` and player `isAlive`
- Clears interval on unmount or status change

### `useKeyboard.ts`
- Adds `keydown` event listener on `window`
- Maps keys to Redux dispatch:
  - `ArrowLeft` → `dispatch(moveLeft())`
  - `ArrowRight` → `dispatch(moveRight())`
  - `ArrowUp` → `dispatch(rotate())`
  - `ArrowDown` → `dispatch(softDrop())`
  - `Space` → `dispatch(hardDrop())`
- `event.preventDefault()` to block browser scroll on arrow keys
- Only active when `gameStatus === 'playing'`
- Throttle rapid key repeats to prevent input flood

---

## Redux Store

### `gameSlice` — Local Board State

**State:**
```typescript
{
  board: BoardType;                            // Frozen board (without active piece)
  activePiece: IPiece | null;
  nextPiece: IPiece | null;
  status: 'idle' | 'playing' | 'lost' | 'won';
  penaltyQueue: number;                        // Pending penalty lines to apply
}
```

**Actions — game flow:**
- `setPiece(piece)` — set incoming piece as active
- `setNextPiece(piece)` — store next piece preview
- `lockPiece` — freeze active piece on board, clear lines, update spectrum, request next piece
- `addPenaltyLines(count)` — apply `count` indestructible rows from bottom
- `setGameStatus(status)` — transition game state
- `resetGame` — clear board, pieces, status for new game

**Actions — movement (call pure functions internally):**
- `moveLeft` / `moveRight` / `rotate` / `softDrop` / `hardDrop`
- Each action calls the corresponding pure function and updates `activePiece`

### `roomSlice` — Room & Multiplayer State

**State:**
```typescript
{
  roomName: string;
  playerName: string;
  players: IPlayerInfo[];
  isHost: boolean;
  spectrums: Record<string, number[]>;         // playerName → spectrum array
  gameStatus: 'waiting' | 'playing' | 'ended';
  winner: string | null;
}
```

**Actions:**
- `setRoomState(state)` — full room init on JOIN
- `playerJoined(player)` / `playerLeft(playerName)`
- `updateSpectrum({ playerName, spectrum })`
- `playerEliminated(playerName)` — marks player dead in list
- `gameStarted` / `gameEnded(winner)` / `hostChanged(newHost)`

### `uiSlice` — UI State

```typescript
{
  currentScreen: 'home' | 'lobby' | 'game' | 'gameOver';
  notifications: { id: string; message: string; type: 'error' | 'info' }[];
  isConnected: boolean;
}
```

### `socketMiddleware.ts` — The Bridge

This middleware listens to Redux actions and translates them into socket emissions, **and** listens to socket events and dispatches Redux actions.

**Redux actions → Socket emissions:**
| Action | Socket event emitted |
|--------|---------------------|
| `lockPiece` (after processing) | `REQUEST_PIECE`, `UPDATE_SPECTRUM`, optionally `LINES_CLEARED` |
| `setGameStatus('lost')` | `GAME_OVER_PLAYER` |

**Socket events → Redux dispatches:**
| Socket event received | Redux action dispatched |
|----------------------|------------------------|
| `ROOM_STATE` | `setRoomState` |
| `PLAYER_JOINED` | `playerJoined` |
| `PLAYER_LEFT` | `playerLeft` |
| `HOST_CHANGED` | `hostChanged` |
| `GAME_STARTED` | `gameStarted` + `setGameStatus('playing')` |
| `NEW_PIECE` | `setPiece` or `setNextPiece` (depends on whether active piece exists) |
| `SPECTRUM_UPDATE` | `updateSpectrum` |
| `PENALTY_LINES` | `addPenaltyLines` |
| `PLAYER_ELIMINATED` | `playerEliminated` |
| `GAME_OVER` | `gameEnded` |
| `ERROR` | add notification to `uiSlice` |

---

## Game Loop — Execution Flow

### Piece Lifecycle
1. Game starts → client emits 2× `REQUEST_PIECE`
2. 1st `NEW_PIECE` → stored as `activePiece` (immediately playable)
3. 2nd `NEW_PIECE` → stored as `nextPiece` (shown in preview panel)
4. On piece lock:
   - `mergePiece(board, activePiece)` → new frozen board
   - `clearLines(board)` → remove complete rows
   - If lines cleared → emit `LINES_CLEARED { count }` + `UPDATE_SPECTRUM`
   - `nextPiece` → becomes new `activePiece`
   - Emit `REQUEST_PIECE` → server responds with `NEW_PIECE` → stored as new `nextPiece`
5. If new `activePiece` cannot spawn → emit `GAME_OVER_PLAYER` → `setGameStatus('lost')`

### Gravity & Lock Delay
- `useGameLoop` fires every `getGravityInterval()` ms → `dispatch(moveDown())`
- When `shouldLockPiece()` returns true: allow one more input frame, then call `lockPiece`

---

## UI Design System

### Tetrimino Colors (Tailwind classes)
| Cell value | Piece | Class |
|-----------|-------|-------|
| 0 | Empty | `bg-white/5` |
| 1 | I | `bg-cyan-400 shadow-cyan-400/50` |
| 2 | O | `bg-yellow-400 shadow-yellow-400/50` |
| 3 | T | `bg-purple-500 shadow-purple-500/50` |
| 4 | S | `bg-green-400 shadow-green-400/50` |
| 5 | Z | `bg-red-500 shadow-red-500/50` |
| 6 | J | `bg-blue-500 shadow-blue-500/50` |
| 7 | L | `bg-orange-400 shadow-orange-400/50` |
| 8 | Penalty | `bg-gray-600` |

### Glass Effect Presets
```
Panel primary:    backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl
Panel secondary:  backdrop-blur-md bg-white/5 border border-white/10 rounded-xl
Game Over overlay: backdrop-blur-2xl bg-black/60
Buttons:          bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all
```

### App Background
```
bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900
```

### Game Board Layout
```
GameBoard: CSS Grid — grid-template-columns: repeat(10, 1fr), 20 rows
Cell: aspect-ratio: 1/1, border border-white/10, rounded-sm
```

### Responsive Breakpoints
- **Desktop:** board center, next piece + spectrums on sides, info top
- **Tablet:** spectrums below board
- **Mobile:** vertical stacking (optional touch controls as bonus)

---

## Component Behavior Reference

### `GameBoard_Component`
- Reads `board` and `activePiece` from Redux
- Calls `mergePiece(board, activePiece)` for display (does NOT mutate store)
- Optionally computes `getGhostPosition(board, activePiece)` and renders ghost cells
- Maps merged board cells → `Cell_Component` with appropriate type prop
- 200 cells total (10×20)

### `Lobby_Component`
- Subscribes to `roomSlice` for player list and `isHost`
- Shows "Start Game" button **only if** `isHost === true`
- On click: `socket.emit(Events.START_GAME, { room: roomName })`
- Displays real-time player list with host badge (crown icon)

### `GameOverlay_Component`
- Displayed when `gameStatus === 'ended'` OR `activePiece === null` after elimination
- Three variants:
  - **GAME OVER** — this player lost, others still playing
  - **VICTORY** — this player won
  - **DEFEATED** — another player won (show winner name)
- "New Game" button visible **only if** `isHost === true`
- On click: `socket.emit(Events.RESTART_GAME, { room: roomName })`

### `Spectrum_Component`
- Reads `spectrums` from `roomSlice` (excludes current player's own spectrum)
- For each opponent: renders a 10-column mini-grid using column heights
- Marks eliminated players with greyed-out display + strikethrough on name

### `Home_Component`
- Two inputs: room name and player name (validated client-side on submit)
- Navigation: `router.push('/${roomName}/${playerName}')`
- Displays `ERROR` socket events as inline form errors (e.g. "Game already started")

---

## Testing Strategy

**Framework:** Jest + ts-jest + @testing-library/react

### Pure Functions — Highest Priority

`board.test.ts`:
- `createBoard()` → dimensions 10×20, all zeros
- `mergePiece()` → piece cells written at correct positions
- `isValidPosition()` → wall collisions, floor collision, overlap detection
- `addPenaltyLines()` → row shift, value=8 at bottom, count rows added
- `calculateSpectrum()` → correct heights per column

`movement.test.ts`:
- `moveLeft/Right()` → valid move and wall-blocked move
- `rotatePiece()` → all 4 rotation states for each piece type, wall kick
- `hardDrop()` → lands at lowest valid position
- `getGhostPosition()` → matches hardDrop result

`lines.test.ts`:
- `getCompletedLines()` → empty board, one full row, multiple rows
- `clearLines()` → rows removed, rows above descend, count returned
- `calculatePenalty()` → 1→0, 2→1, 3→2, 4→3

`pieces.test.ts`:
- Each of the 7 TETRIMINOS has exactly 4 rotation states
- `getSpawnPosition()` → x centered, y=0

### Redux Slices — Medium Priority

`gameSlice.test.ts`:
- `moveLeft/Right/rotate` actions call pure functions and update `activePiece`
- `lockPiece` merges piece, runs clearLines, updates board
- `addPenaltyLines` adds correct rows

`roomSlice.test.ts`:
- `playerJoined` adds player to list
- `playerEliminated` marks player as dead
- `hostChanged` updates `isHost` flag

### Components — Medium Priority

`GameBoard_Component.test.tsx`:
- Renders exactly 200 cells
- Ghost piece cells rendered at correct positions

`Lobby_Component.test.tsx`:
- Start button rendered when `isHost=true`, hidden when `false`
- Player list shows all players with correct host badge

`Cell_Component.test.tsx`:
- Correct Tailwind class applied for each cell type 0–8

`GameOverlay_Component.test.tsx`:
- Shows "VICTORY" when current player is winner
- Shows "DEFEATED" with winner name when someone else won
- Restart button visible only for host

---

## TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "jsx": "preserve",
    "moduleResolution": "bundler",
    "paths": {
      "shared/*": ["../shared/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

The `paths` alias allows clean imports: `import { Events } from 'shared/events'` and `import { GameBoard } from '@/components/GameBoardComponents/GameBoard_Component'`.

---

## Key Implementation Rules

1. **Never mutate state** in game logic — every pure function returns a new object/array
2. **`this` is banned** — if you find yourself writing `this.`, stop and refactor to a pure function or closure
3. **Redux is the single source of truth** — component local state only for transient UI (input values, hover states)
4. **socketMiddleware owns all socket event registration** — components never call `socket.on()` directly
5. **`mergePiece` is display-only** — the merged board is computed in the component for rendering, never stored in Redux until `lockPiece`
6. **Test pure functions first** — they are the safest, fastest, and most valuable tests in this codebase

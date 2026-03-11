# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Red Tetris** is a 42 school project: a real-time multiplayer Tetris game built entirely in TypeScript, full-stack, using Socket.IO for bidirectional communication. The game runs as a Single Page Application in the browser and communicates with a Node.js server.

**Specification documents** (source of truth for all design decisions) are located in:
```
Specs_Architecture_Realisation/
  01.1_Resume_Technique_GENERAL.md    ← Full technical overview
  01.2_PLAN_Technique_FRONTEND.md     ← Detailed frontend plan
  01.3_PLAN_Technique_BACKEND.md      ← Detailed backend plan
  42_Red_Tetris.en.subject.pdf        ← Official 42 subject
```

---

## Monorepo Structure

```
red_tetris/
├── client/          # Next.js SPA — see client/CLAUDE.md
├── server/          # Node.js + Express + Socket.IO — see server/CLAUDE.md
├── shared/          # Shared types, events, constants (imported by both sides)
│   ├── events.ts    # All Socket.IO event name constants
│   ├── types.ts     # IPiece, IPlayerInfo, IRoomState, PieceType, BoardType
│   └── constants.ts # BOARD_WIDTH, BOARD_HEIGHT, GRAVITY_INTERVAL_MS, etc.
└── tests/
    ├── client/
    └── server/
```

Each sub-project (`client/`, `server/`) has its own `CLAUDE.md` with detailed implementation guidance for that layer.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, Redux Toolkit, Socket.IO client |
| Backend | Node.js, Express, TypeScript, Socket.IO server |
| Shared | TypeScript types and constants |
| Testing | Jest, ts-jest, @testing-library/react |

---

## Shared Layer — `shared/`

This folder is the **single source of truth** for the network protocol. Both client and server import from here. Never duplicate event names or shared types.

### `shared/events.ts` — Socket.IO Event Names

**Client → Server:**
| Constant | Value | Description |
|----------|-------|-------------|
| `JOIN_ROOM` | `'JOIN_ROOM'` | Join a room with `{ room, playerName }` |
| `START_GAME` | `'START_GAME'` | Host starts the game with `{ room }` |
| `REQUEST_PIECE` | `'REQUEST_PIECE'` | Request the next piece with `{ room }` |
| `UPDATE_SPECTRUM` | `'UPDATE_SPECTRUM'` | Send own spectrum `{ room, spectrum: number[] }` |
| `LINES_CLEARED` | `'LINES_CLEARED'` | Report cleared lines `{ room, count }` |
| `GAME_OVER_PLAYER` | `'GAME_OVER_PLAYER'` | Report own elimination `{ room }` |
| `RESTART_GAME` | `'RESTART_GAME'` | Host restarts the game `{ room }` |

**Server → Client:**
| Constant | Value | Description |
|----------|-------|-------------|
| `ROOM_STATE` | `'ROOM_STATE'` | Full room state on join |
| `PLAYER_JOINED` | `'PLAYER_JOINED'` | A player joined the room |
| `PLAYER_LEFT` | `'PLAYER_LEFT'` | A player left the room |
| `HOST_CHANGED` | `'HOST_CHANGED'` | New host assigned |
| `GAME_STARTED` | `'GAME_STARTED'` | Game begins |
| `NEW_PIECE` | `'NEW_PIECE'` | Next piece sent to a player |
| `SPECTRUM_UPDATE` | `'SPECTRUM_UPDATE'` | An opponent's spectrum updated |
| `PENALTY_LINES` | `'PENALTY_LINES'` | Penalty lines received `{ count }` |
| `PLAYER_ELIMINATED` | `'PLAYER_ELIMINATED'` | A player was eliminated |
| `GAME_OVER` | `'GAME_OVER'` | Game ended `{ winner: string \| null }` |
| `ERROR` | `'ERROR'` | Server error `{ message: string }` |

### `shared/types.ts` — Shared Interfaces

```typescript
type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
type BoardType = number[][];  // 0=empty, 1-7=piece type, 8=penalty

interface IPiece {
  type: PieceType;
  rotation: number;
  position: { x: number; y: number };
}

interface IPlayerInfo {
  name: string;
  isAlive: boolean;
  isHost: boolean;
}

interface IRoomState {
  players: IPlayerInfo[];
  status: 'waiting' | 'playing' | 'ended';
  isHost: boolean;
}
```

### `shared/constants.ts`

```typescript
BOARD_WIDTH = 10
BOARD_HEIGHT = 20
INITIAL_PIECE_SEQUENCE_SIZE = 1000
PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
GRAVITY_INTERVAL_MS = 800
```

---

## Game Rules — Key Mechanics

### Board
- 10 columns × 20 rows grid
- Internal representation: 2D array — `0` = empty, `1–7` = tetrimino type, `8` = indestructible penalty line

### The 7 Tetriminos
| Piece | Color |
|-------|-------|
| I | Cyan |
| O | Yellow |
| T | Purple |
| S | Green |
| Z | Red |
| J | Blue |
| L | Orange |

Each piece has 4 rotation states.

### Controls
| Key | Action |
|-----|--------|
| Arrow Left | Move left |
| Arrow Right | Move right |
| Arrow Up | Rotate |
| Arrow Down | Soft drop |
| Space | Hard drop |

### Line Clear & Penalties
| Lines cleared | Penalty sent to opponents |
|--------------|--------------------------|
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |
| 4 (Tetris) | 3 |

Penalty lines are added at the **bottom** of the opponent's board and are **indestructible** (cannot be cleared).

### Win Condition
- A player is eliminated when a new piece cannot spawn (board full)
- Last player standing wins
- No scoring system in the mandatory part

### Spectrum
- Each player sends their spectrum (array of 10 heights, one per column) after each piece lock
- Opponents see a compressed view of each player's board updated in real time

---

## Architectural Constraints (42 Subject Rules)

### Client — Forbidden
- `this` keyword anywhere in client code (only allowed in `Error` subclasses)
- Canvas, SVG, `<TABLE>` HTML elements
- jQuery or any DOM manipulation library
- Class components in React

### Client — Mandatory
- Functional React components with hooks only
- CSS layout: Grid and Flexbox exclusively (via Tailwind)
- SPA: single `index.html`, single `bundle.js`, no full-page HTML exchanges
- Game logic implemented as **pure functions** (no side effects)

### Server — Mandatory
- Object-Oriented Programming with classes
- Minimum required classes: `Player`, `Piece`, `Game`
- Serve static client files via HTTP (index.html + bundle.js)
- Zero persistence — all state in memory

### Both Sides — Critical Rules
- All players in a room **must receive the same pieces in the same order** (sequence generated server-side, indexed per player)
- No new player can join a **game in progress**
- Only the host can start or restart a game
- Host role transfers automatically when the current host disconnects

---

## Testing Requirements

| Metric | Minimum |
|--------|---------|
| Statements | 70% |
| Functions | 70% |
| Lines | 70% |
| Branches | 50% |

**Priority order for test coverage:**
1. Pure game logic functions (`game/` — deterministic, no mocking needed)
2. Server classes (`Player`, `Piece`, `Game`, `GameManager`)
3. React components (render, conditional display, props)
4. Redux slices and socketMiddleware
5. Socket handlers (with mocked sockets)

---

## Environment Variables

`.env` file at project root (never commit):
```
PORT=3000
CLIENT_URL=http://localhost:3001
NODE_ENV=development
```

---

## URL Routing

Access pattern: `http://<server>:<port>/<room>/<player_name>`

- `room`: room identifier (alphanumeric, hyphens, underscores, 1–20 chars)
- `player_name`: display name (alphanumeric, hyphens, underscores, 1–15 chars)

The URL **is** the source of truth for room name and player name on the client.

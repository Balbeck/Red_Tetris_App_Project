# 🎮 Red Tetris — Frontend

> **42 School Project** | Multiplayer Real-time Tetris SPA
> Next.js 14 + React 18 + Redux Toolkit + Socket.IO + Tailwind CSS

---

## 📋 Quick Start

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or **pnpm**, **yarn**)
- Backend server running on `http://localhost:3000` (optional for local testing)

### Installation

```bash
cd client
npm install
```

---

## 🚀 Commands

### Development Server

```bash
npm run dev
```

**What it does:**
- Starts Next.js development server on `http://localhost:3001`
- Enables Hot Module Replacement (HMR) for instant code updates
- Watches all file changes and recompiles automatically
- Shows build errors in the browser overlay

**When to use:** During active development. Any change in `src/` is reflected immediately.

**Implication:** Development is fast and iterative. The server stays running and rebuilds on save.

---

### Production Build

```bash
npm run build
```

**What it does:**
- Compiles Next.js app to optimized production bundles
- Minifies and chunks JavaScript for optimal loading
- Type-checks all TypeScript files
- Generates static pages where possible
- Outputs to `.next/` directory

**When to use:** Before deploying to production or before running `npm start`.

**Implication:** This is a one-time process that prepares the app. Must be run before serving production. Takes ~30-60s.

**Output:** Shows bundle sizes and route breakdown:
```
Route (app)                              Size     First Load JS
├ ○ /                                    3.02 kB        99.3 kB
└ ƒ /[room]/[player]                     4.8 kB        116 kB
```

---

### Start Production Server

```bash
npm run start
```

**What it does:**
- Serves the pre-built app on `http://localhost:3001`
- Requires `npm run build` to have been run first
- Runs the optimized production build in Node
- Does NOT rebuild on file changes

**When to use:** After `npm run build`, for production-like local testing or actual deployment.

**Implication:** This is fast and lightweight. No development tools are active. Changes require a rebuild.

---

### Run Tests

```bash
npm run test
```

**What it does:**
- Runs Jest test suite
- Watches for file changes in test files
- Generates coverage reports in `coverage/` directory
- Type-checks test files

**When to use:** During development to validate game logic, components, and store.

**Coverage thresholds (from 42 subject):**
- Statements: 70%
- Functions: 70%
- Lines: 70%
- Branches: 50%

**Implication:** Tests run in watch mode — add `--coverage` flag for full report.

---

### Linting

```bash
npm run lint
```

**What it does:**
- Runs ESLint on all TypeScript/TSX files in `src/`
- Checks for code style violations, unused imports, type errors
- Uses Next.js ESLint config with strict TypeScript rules
- Does NOT auto-fix issues (use `--fix` flag for auto-fix)

**When to use:** Before committing code to catch issues early.

**Implication:** Enforces code quality and consistency across the codebase.

---

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout (Redux Provider)
│   │   ├── page.tsx             # Home page (/ route)
│   │   ├── [room]/[player]/
│   │   │   └── page.tsx         # Game page (dynamic routes)
│   │   ├── Providers.tsx        # Redux + Redux Provider wrapper
│   │   └── globals.css          # Global Tailwind styles
│   │
│   ├── game/                    # Pure game logic (no side effects)
│   │   ├── pieces.ts            # 7 tetriminos + rotations + colors
│   │   ├── board.ts             # createBoard, merge, validity, spectrum
│   │   ├── movement.ts          # moveLeft/Right/Down, rotate, hardDrop
│   │   ├── lines.ts             # clearLines, penalty calculation
│   │   └── gravity.ts           # gravity intervals
│   │
│   ├── store/                   # Redux state management
│   │   ├── index.ts             # Store configuration
│   │   ├── slices/
│   │   │   ├── gameSlice.ts     # Board state + movement actions
│   │   │   ├── roomSlice.ts     # Room state + players + spectres
│   │   │   └── uiSlice.ts       # UI state + notifications
│   │   └── middleware/
│   │       └── socketMiddleware.ts # Redux ↔ Socket.IO bridge
│   │
│   ├── socket/                  # Socket.IO client
│   │   ├── socket.ts            # Singleton socket instance
│   │   └── events.ts            # Event name constants
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useSocket.ts         # Socket connection lifecycle
│   │   ├── useGameLoop.ts       # Gravity loop + lock delay
│   │   └── useKeyboard.ts       # Keyboard input handling
│   │
│   ├── components/              # React components (Component-First)
│   │   ├── SharedComponents/    # Button, Input, Notification
│   │   ├── HomeComponents/      # Home form + layout
│   │   ├── LobbyComponents/     # Player list + start button
│   │   ├── GameBoardComponents/ # 10×20 tetris board
│   │   ├── CellComponents/      # Single cell rendering
│   │   ├── NextPieceComponents/ # Next piece preview
│   │   ├── SpectrumComponents/  # Opponent spectrums
│   │   ├── GameInfoComponents/  # Game info panel
│   │   └── GameOverlayComponents/ # Game Over/Victory overlay
│   │
│   └── types/                   # TypeScript types
│       └── index.ts             # Client types + shared re-exports
│
├── public/                      # Static assets (favicon, etc.)
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.js
└── README.md
```

---

## 🏗️ Architecture Overview

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                        │
│  (Home, Lobby, GameBoard, NextPiece, Spectrum, GameOver)  │
└────────────────┬────────────────────────────────────────────┘
                 │ useDispatch() / useSelector()
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      Redux Store                            │
│  ┌──────────────┬──────────────┬──────────────┐             │
│  │  gameSlice   │  roomSlice   │   uiSlice    │             │
│  │              │              │              │             │
│  │ • board      │ • players    │ • isConnected│             │
│  │ • pieces     │ • spectres   │ • notifs     │             │
│  │ • status     │ • gameStatus │              │             │
│  └──────┬───────┴──────┬───────┴──────────────┘             │
│         │              │                                     │
│         └──────┬───────┴──────────────────────────────────┐  │
│                │                                          │  │
│         ┌──────▼───────────────────────────────────────┐  │  │
│         │      socketMiddleware                        │  │  │
│         │  (Redux ↔ Socket.IO bridge)                 │  │  │
│         └──────┬───────────────────────────────────────┘  │  │
└────────────────┼──────────────────────────────────────────┘  │
                 │                                              │
                 ▼                                              │
        ┌─────────────────┐                                   │
        │  Socket.IO      │◄──────────────────────────────────┘
        │  (Real-time)    │
        └────────┬────────┘
                 │ WebSocket / Polling
                 ▼
        ┌─────────────────┐
        │  Backend Server │
        │ (Node.js /      │
        │  Express)       │
        └─────────────────┘
```

### Game Logic Layer (Pure Functions)

```
Input Events (keyboard, socket)
         │
         ▼
┌────────────────────────────────────────┐
│  Game Logic (game/*.ts)                │
│  • No state mutation                   │
│  • No side effects                     │
│  • Deterministic output                │
│                                        │
│  moveLeft(board, piece) → newPiece    │
│  clearLines(board) → {board, count}   │
│  mergePiece(board, piece) → newBoard  │
└────────────────────────────────────────┘
         │
         ▼
Redux Actions (dispatch)
         │
         ▼
Redux Reducers (gameSlice)
         │
         ▼
Redux State Update
         │
         ▼
Component Re-render (React)
```

---

## 🎮 Key Features

### Single Page Application (SPA)
- **One HTML file** — no full-page reloads
- URL-based routing: `/<room>/<player>`
- Instant transitions between screens

### Real-time Multiplayer
- Socket.IO for bidirectional communication
- Live spectrum updates (opponent board heights)
- Penalty distribution on line clears
- Player elimination detection

### Beautiful UI/UX
- **Glassmorphism design** — frosted glass panels with blur effects
- **Responsive layout** — adapts to desktop/tablet/mobile
- **Smooth animations** — fade-in, scale, slide, glow effects
- **Dark theme** — gradient background, high contrast text

### Game Mechanics
- **10×20 board** — standard Tetris size
- **7 tetriminos** — I, O, T, S, Z, J, L with 4 rotation states each
- **Line clearing** — indestructible penalty lines
- **Ghost piece** — shows landing position
- **Soft/hard drop** — flexible movement options
- **Wall kick** — rotation adjustment on collision

### Type Safety
- **Full TypeScript** — strict mode enabled
- **Shared types** — client/server use same interfaces
- **Redux types** — RootState, AppDispatch properly typed

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Server-side rendering, routing, optimization |
| **UI Library** | React 18 | Component-based UI, hooks |
| **Styling** | Tailwind CSS | Utility-first CSS, responsive design |
| **State** | Redux Toolkit | Global state management, predictable updates |
| **Real-time** | Socket.IO Client | WebSocket communication with backend |
| **Language** | TypeScript | Type safety, better DX |
| **Testing** | Jest + Testing Library | Unit tests, component tests |
| **Linting** | ESLint | Code quality, consistency |

---

## 📦 Dependencies

### Core
- `next` — React framework
- `react-dom` — React DOM rendering
- `@reduxjs/toolkit` — Redux state management
- `react-redux` — React bindings for Redux
- `socket.io-client` — Real-time client

### Styling
- `tailwindcss` — Utility CSS
- `postcss` — CSS preprocessing
- `autoprefixer` — Browser prefixes

### Development
- `typescript` — Type checking
- `jest` — Test framework
- `eslint` — Code linting

---

## 🎯 Game Phases

### Phase 1: Home
```
User enters room name + player name
        │
        ├─► Validation (client-side)
        │
        └─► Navigate to /<room>/<player>
```

### Phase 2: Lobby (Waiting)
```
Players join the room (real-time list updates)
        │
        └─► Host clicks "Start Game"
                │
                └─► Server generates piece sequence
                    │
                    └─► All players transition to Playing
```

### Phase 3: Game (Playing)
```
Gravity loop drops pieces every ~800ms
        │
        ├─► Player input (keyboard) → moves/rotates
        │
        ├─► Piece locks → lines cleared → spectres updated
        │
        ├─► Penalties sent to opponents
        │
        └─► Player eliminated → Game Over broadcast
```

### Phase 4: End (Ended)
```
Last player standing = VICTORY
        │
        └─► Host can restart a new round
```

---

## 🔧 Development Workflow

### 1. Start Development Server
```bash
npm run dev
```
Open http://localhost:3001

### 2. Create/Edit a Component
Example: modifying `GameBoard_Component.tsx`
- Component updates instantly (HMR)
- Redux state preserved across edits
- Browser shows any errors in overlay

### 3. Test Game Logic
```bash
npm run test -- src/game/board.test.ts
```
Watch mode for instant feedback

### 4. Check Code Quality
```bash
npm run lint
```
Fix any violations before commit

### 5. Build for Production
```bash
npm run build
npm run start
```
Test production build locally

---

## ⚙️ Environment Variables

Create `.env.local` (for development only):

```env
# Optional — defaults to http://localhost:3000
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

No other secrets should be stored in the client — all credentials stay on backend.

---

## 🚨 Important Rules (42 Subject)

| Rule | Status | Details |
|------|--------|---------|
| **No `this` keyword** | ✅ Enforced | All pure functions and functional components |
| **No Canvas/SVG** | ✅ Enforced | Grid + Flexbox layout only |
| **No jQuery** | ✅ Enforced | React handles DOM |
| **No class components** | ✅ Enforced | Hooks + functional components |
| **SPA only** | ✅ Enforced | One HTML, no page reloads |
| **Test coverage** | 📋 Required | 70% statements/functions/lines, 50% branches |

---

## 🔗 Related

- **Backend**: `/server/README.md` or `/server/CLAUDE.md`
- **Shared Types**: `/shared/types.ts`
- **Architecture Guide**: `/CLAUDE.md`

---

## 📝 Notes

- The frontend works standalone for UI testing, but requires the backend for full multiplayer functionality
- Socket connection gracefully handles server unavailability (shows "Connecting..." state)
- All game logic is deterministic and can be tested without the backend
- Redux state persists during development (HMR preserves store)

---

**Built with ❤️ for 42 School**

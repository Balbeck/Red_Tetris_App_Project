# Sprint 1 — Solo Mode MVP

> **Product Owner / Agile Coach Plan**
> Red Tetris — 42 School Project
> Sprint Duration: 1 session

---

## Sprint Goal

**Deliver a fully functional solo Tetris game** where a player can launch a game from the home page, play a complete round of Tetris alone, see a styled "Game Over" popup, and either replay or return to the home screen — all powered by real-time Socket.IO communication between client and server.

---

## User Stories

### US-1: Play Solo from Home Page
**As a** player
**I want to** click a "Play Solo" button on the home page
**So that** I can quickly start a Tetris game without creating a room

**Acceptance Criteria:**
- [ ] Home page displays a "Play Solo" button below the multiplayer form
- [ ] Only the player name input is required (room is auto-generated)
- [ ] Clicking "Play Solo" navigates directly to the game (no lobby)
- [ ] A unique room name is generated automatically (e.g., `solo_1710000000000`)

### US-2: Solo Game Plays Correctly
**As a** player in solo mode
**I want to** play Tetris with pieces falling, rotation, and line clearing
**So that** I have a complete game experience

**Acceptance Criteria:**
- [ ] Pieces fall at regular intervals (gravity)
- [ ] Arrow keys control movement (left, right, down, rotate)
- [ ] Space bar triggers hard drop
- [ ] Ghost piece shows landing position
- [ ] Completed lines are cleared
- [ ] Next piece is displayed in the preview panel
- [ ] Game ends when a new piece cannot spawn

### US-3: Game Over Screen
**As a** player whose game just ended
**I want to** see a styled "Game Over" popup with clear options
**So that** I can decide to replay or go home

**Acceptance Criteria:**
- [ ] "GAME OVER" text is displayed with a prominent, styled design
- [ ] "Play Again" button restarts a new solo game immediately
- [ ] "Exit" button navigates back to the home page
- [ ] Background is blurred behind the popup
- [ ] Popup animates in smoothly

### US-4: End-to-End Communication
**As a** developer
**I want** the frontend and backend to communicate correctly via Socket.IO
**So that** the game flow works reliably

**Acceptance Criteria:**
- [ ] Client connects to server via WebSocket on game page mount
- [ ] JOIN_ROOM event creates the room and player on the server
- [ ] START_GAME event triggers piece sequence generation
- [ ] REQUEST_PIECE / NEW_PIECE cycle delivers pieces to the client
- [ ] GAME_OVER_PLAYER / GAME_OVER cycle ends the game properly
- [ ] RESTART_GAME resets the game for a new round
- [ ] Disconnect cleans up server state

---

## Sprint Backlog

### Epic: Fix Communication Layer
| # | Task | Priority | Status |
|---|------|----------|--------|
| T-1 | Fix `useGameLoop` — gravity interval resets on every board change (use refs) | HIGH | TODO |
| T-2 | Fix `useKeyboard` — hard drop should lock immediately (remove setTimeout) | HIGH | TODO |
| T-3 | Fix `socketMiddleware` — dispatch `resetGame()` on GAME_STARTED | HIGH | TODO |
| T-4 | Fix `socketMiddleware` — dispatch `resetGame()` on ROOM_STATE when status=waiting | MEDIUM | TODO |

### Epic: Solo Mode Feature
| # | Task | Priority | Status |
|---|------|----------|--------|
| T-5 | Add `isSolo` flag to `roomSlice` with setter action | HIGH | TODO |
| T-6 | Add "Play Solo" button to `Home_Component` | HIGH | TODO |
| T-7 | Add solo auto-start logic to game page (skip lobby) | HIGH | TODO |
| T-8 | Update `GameOverlay_Component` for solo mode (Game Over + Play Again + Exit) | HIGH | TODO |

### Epic: End-to-End Tests
| # | Task | Priority | Status |
|---|------|----------|--------|
| T-9 | Create server E2E test: full solo game lifecycle with mock sockets | HIGH | TODO |
| T-10 | Create client unit tests: game logic pure functions | MEDIUM | TODO |

---

## Definition of Done

- [ ] Code compiles without errors (`npm run build` in both client/ and server/)
- [ ] Server starts and responds to health check
- [ ] Client starts and renders home page
- [ ] Solo flow works end-to-end: Home → Game → Game Over → Play Again / Exit
- [ ] E2E tests pass
- [ ] No console errors in browser or server during normal gameplay

---

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Solo uses existing room system | No new server logic needed — solo = 1-player room with auto-start |
| Auto-generated room name (`solo_${timestamp}`) | Unique, no collision, identifiable as solo |
| Client-side auto-start (not server) | Keeps server generic — client detects solo and emits START_GAME |
| Redux flag `isSolo` | Clean detection across components without URL parsing |
| Reset game on GAME_STARTED event | Ensures clean board for replays without explicit reset action |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Socket reconnection drops game state | HIGH | Socket auto-reconnect + server preserves player reference |
| React StrictMode double-mounts cause duplicate connections | MEDIUM | Use refs and flags to prevent duplicate JOIN_ROOM |
| Gravity timer resets on every render | HIGH | **FIXED** — use refs for board/piece in game loop |
| Hard drop + gravity race condition | MEDIUM | **FIXED** — immediate lock on hard drop |

---

## Sprint Review Checklist

1. Start server: `cd server && npm run dev`
2. Start client: `cd client && npm run dev`
3. Open `http://localhost:3001`
4. Enter player name → click "Play Solo"
5. Verify: game starts immediately (no lobby)
6. Play Tetris: move, rotate, drop pieces
7. Let the board fill up → verify "Game Over" popup
8. Click "Play Again" → verify new game starts
9. Let game end again → click "Exit" → verify return to home
10. Run E2E tests: `cd server && npm test`

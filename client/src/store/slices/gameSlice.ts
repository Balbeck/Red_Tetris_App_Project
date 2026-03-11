import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BoardType, IPiece } from 'shared/types';
import { createBoard } from '@/game/board';
import { mergePiece, addPenaltyLines, calculateSpectrum } from '@/game/board';
import { clearLines, calculatePenalty } from '@/game/lines';
import { moveLeft, moveRight, moveDown, rotatePiece, hardDrop, shouldLockPiece } from '@/game/movement';
import { isValidPosition } from '@/game/board';
import { getSpawnPosition } from '@/game/pieces';

export type GameStatus = 'idle' | 'playing' | 'lost' | 'won';

interface GameState {
  board: BoardType;
  activePiece: IPiece | null;
  nextPiece: IPiece | null;
  status: GameStatus;
  penaltyQueue: number;
  linesCleared: number;   // from last lock — read by socketMiddleware
  spectrum: number[];     // current board spectrum — read by socketMiddleware
}

const initialState: GameState = {
  board: createBoard(),
  activePiece: null,
  nextPiece: null,
  status: 'idle',
  penaltyQueue: 0,
  linesCleared: 0,
  spectrum: Array(10).fill(0),
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setPiece: (state, action: PayloadAction<IPiece>) => {
      state.activePiece = action.payload;
    },

    setNextPiece: (state, action: PayloadAction<IPiece>) => {
      state.nextPiece = action.payload;
    },

    setGameStatus: (state, action: PayloadAction<GameStatus>) => {
      state.status = action.payload;
    },

    addPenaltyLines: (state, action: PayloadAction<number>) => {
      state.penaltyQueue += action.payload;
    },

    resetGame: (state) => {
      state.board = createBoard();
      state.activePiece = null;
      state.nextPiece = null;
      state.status = 'idle';
      state.penaltyQueue = 0;
      state.linesCleared = 0;
      state.spectrum = Array(10).fill(0);
    },

    // Movement actions — call pure functions
    applyMoveLeft: (state) => {
      if (!state.activePiece || state.status !== 'playing') return;
      state.activePiece = moveLeft(state.board as BoardType, state.activePiece);
    },

    applyMoveRight: (state) => {
      if (!state.activePiece || state.status !== 'playing') return;
      state.activePiece = moveRight(state.board as BoardType, state.activePiece);
    },

    applyMoveDown: (state) => {
      if (!state.activePiece || state.status !== 'playing') return;
      state.activePiece = moveDown(state.board as BoardType, state.activePiece);
    },

    applyRotate: (state) => {
      if (!state.activePiece || state.status !== 'playing') return;
      state.activePiece = rotatePiece(state.board as BoardType, state.activePiece);
    },

    applyHardDrop: (state) => {
      if (!state.activePiece || state.status !== 'playing') return;
      state.activePiece = hardDrop(state.board as BoardType, state.activePiece);
    },

    // Lock current piece — the critical action
    lockPiece: (state) => {
      if (!state.activePiece) return;

      // 1. Merge piece into board
      let newBoard = mergePiece(state.board as BoardType, state.activePiece);

      // 2. Clear completed lines
      const { board: clearedBoard, linesCleared } = clearLines(newBoard);
      newBoard = clearedBoard;
      state.linesCleared = linesCleared;

      // 3. Apply pending penalty lines
      if (state.penaltyQueue > 0) {
        newBoard = addPenaltyLines(newBoard, state.penaltyQueue);
        state.penaltyQueue = 0;
      }

      state.board = newBoard;
      state.spectrum = calculateSpectrum(newBoard);

      // 4. Advance to next piece
      const nextActive = state.nextPiece;
      state.nextPiece = null;

      if (nextActive === null) {
        // Waiting for server to send a piece — just clear active
        state.activePiece = null;
        return;
      }

      // 5. Check if next piece can spawn
      const canSpawn = isValidPosition(newBoard, nextActive);
      if (!canSpawn) {
        state.activePiece = null;
        state.status = 'lost';
        return;
      }

      state.activePiece = nextActive;
    },
  },
});

export const {
  setPiece,
  setNextPiece,
  setGameStatus,
  addPenaltyLines: addPenaltyLinesAction,
  resetGame,
  applyMoveLeft,
  applyMoveRight,
  applyMoveDown,
  applyRotate,
  applyHardDrop,
  lockPiece,
} = gameSlice.actions;

// Re-export addPenaltyLines with a clear name
export { addPenaltyLines as addPenaltyLinesReducer } from '@/game/board';

export default gameSlice.reducer;

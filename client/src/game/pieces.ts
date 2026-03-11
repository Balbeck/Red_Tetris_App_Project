import { PieceType, IPiece } from 'shared/types';
import { BOARD_WIDTH } from 'shared/constants';

// 4×4 rotation matrices — each piece has 4 rotation states
// Using [row][col] indexing, 1 = filled, 0 = empty
export const TETRIMINOS: Record<PieceType, number[][][]> = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
  ],
  T: [
    [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
  S: [
    [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
    [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
  Z: [
    [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
  ],
  J: [
    [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
  ],
  L: [
    [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
    [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
    [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
  ],
};

// Maps piece type to board cell value (1-7)
export const PIECE_TYPE_TO_VALUE: Record<PieceType, number> = {
  I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7,
};

// Piece colors for rendering
export const PIECE_COLORS: Record<number, { bg: string; glow: string | null }> = {
  0: { bg: 'rgba(255,255,255,0.03)', glow: null },
  1: { bg: '#22d3ee', glow: 'rgba(34,211,238,0.7)' },   // I — cyan
  2: { bg: '#facc15', glow: 'rgba(250,204,21,0.7)' },   // O — yellow
  3: { bg: '#a855f7', glow: 'rgba(168,85,247,0.7)' },   // T — purple
  4: { bg: '#4ade80', glow: 'rgba(74,222,128,0.7)' },   // S — green
  5: { bg: '#ef4444', glow: 'rgba(239,68,68,0.7)' },    // Z — red
  6: { bg: '#3b82f6', glow: 'rgba(59,130,246,0.7)' },   // J — blue
  7: { bg: '#fb923c', glow: 'rgba(251,146,60,0.7)' },   // L — orange
  8: { bg: '#4b5563', glow: null },                      // penalty — gray
  9: { bg: 'rgba(255,255,255,0.12)', glow: null },       // ghost
};

export const getPieceShape = (type: PieceType, rotation: number): number[][] =>
  TETRIMINOS[type][rotation % 4];

export const getSpawnPosition = (type: PieceType): { x: number; y: number } => {
  const spawnX: Record<PieceType, number> = {
    I: 3, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3,
  };
  return { x: spawnX[type], y: 0 };
};

export const createPiece = (type: PieceType): IPiece => ({
  type,
  rotation: 0,
  position: getSpawnPosition(type),
});

export const ALL_PIECE_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

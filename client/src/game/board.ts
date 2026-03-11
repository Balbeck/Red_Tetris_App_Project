import { BoardType, IPiece } from 'shared/types';
import { BOARD_WIDTH, BOARD_HEIGHT } from 'shared/constants';
import { getPieceShape, PIECE_TYPE_TO_VALUE } from './pieces';

export const createBoard = (): BoardType =>
  Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));

export const isValidPosition = (board: BoardType, piece: IPiece): boolean => {
  const shape = getPieceShape(piece.type, piece.rotation);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (shape[row][col] === 0) continue;
      const boardX = piece.position.x + col;
      const boardY = piece.position.y + row;
      if (boardX < 0 || boardX >= BOARD_WIDTH) return false;
      if (boardY >= BOARD_HEIGHT) return false;
      if (boardY < 0) continue; // above board is OK during spawn
      if (board[boardY][boardX] !== 0) return false;
    }
  }
  return true;
};

export const mergePiece = (board: BoardType, piece: IPiece): BoardType => {
  const shape = getPieceShape(piece.type, piece.rotation);
  const value = PIECE_TYPE_TO_VALUE[piece.type];
  const newBoard = board.map(row => [...row]);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (shape[row][col] === 0) continue;
      const boardY = piece.position.y + row;
      const boardX = piece.position.x + col;
      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        newBoard[boardY][boardX] = value;
      }
    }
  }
  return newBoard;
};

export const addPenaltyLines = (board: BoardType, count: number): BoardType => {
  if (count <= 0) return board;
  // Shift all rows UP by count, discarding top rows
  const shifted = board.slice(count);
  // Add penalty rows (value 8) at the bottom
  const penaltyRow = Array(BOARD_WIDTH).fill(8);
  const penaltyRows = Array.from({ length: count }, () => [...penaltyRow]);
  return [...shifted, ...penaltyRows];
};

// Spectrum: array[10] — height of highest filled cell per column (0 = empty)
export const calculateSpectrum = (board: BoardType): number[] => {
  const spectrum = Array(BOARD_WIDTH).fill(0);
  for (let col = 0; col < BOARD_WIDTH; col++) {
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      if (board[row][col] !== 0) {
        spectrum[col] = BOARD_HEIGHT - row;
        break;
      }
    }
  }
  return spectrum;
};

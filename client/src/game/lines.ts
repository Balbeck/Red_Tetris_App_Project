import { BoardType } from 'shared/types';
import { BOARD_WIDTH, BOARD_HEIGHT } from 'shared/constants';

export const getCompletedLines = (board: BoardType): number[] =>
  board.reduce<number[]>((acc, row, idx) => {
    // A line is complete if every cell is non-zero (includes penalty lines value=8)
    if (row.every(cell => cell !== 0)) acc.push(idx);
    return acc;
  }, []);

export const clearLines = (board: BoardType): { board: BoardType; linesCleared: number } => {
  const completedIndices = new Set(getCompletedLines(board));
  if (completedIndices.size === 0) return { board, linesCleared: 0 };
  // Keep non-complete rows, add empty rows at top
  const kept = board.filter((_, idx) => !completedIndices.has(idx));
  const emptyRow = Array(BOARD_WIDTH).fill(0);
  const newRows = Array.from({ length: completedIndices.size }, () => [...emptyRow]);
  return { board: [...newRows, ...kept], linesCleared: completedIndices.size };
};

// Penalty calculation: linesCleared - 1 (minimum 0)
export const calculatePenalty = (linesCleared: number): number =>
  Math.max(0, linesCleared - 1);

import { BoardType, IPiece } from 'shared/types';
import { BOARD_HEIGHT } from 'shared/constants';
import { isValidPosition } from './board';
import { getPieceShape } from './pieces';

export const moveLeft = (board: BoardType, piece: IPiece): IPiece => {
  const moved = { ...piece, position: { ...piece.position, x: piece.position.x - 1 } };
  return isValidPosition(board, moved) ? moved : piece;
};

export const moveRight = (board: BoardType, piece: IPiece): IPiece => {
  const moved = { ...piece, position: { ...piece.position, x: piece.position.x + 1 } };
  return isValidPosition(board, moved) ? moved : piece;
};

export const moveDown = (board: BoardType, piece: IPiece): IPiece => {
  const moved = { ...piece, position: { ...piece.position, y: piece.position.y + 1 } };
  return isValidPosition(board, moved) ? moved : piece;
};

export const rotatePiece = (board: BoardType, piece: IPiece): IPiece => {
  const newRotation = (piece.rotation + 1) % 4;
  const rotated = { ...piece, rotation: newRotation };
  if (isValidPosition(board, rotated)) return rotated;
  // Wall kick: try offsets -1, +1, -2, +2
  for (const kick of [-1, 1, -2, 2]) {
    const kicked = { ...rotated, position: { ...rotated.position, x: rotated.position.x + kick } };
    if (isValidPosition(board, kicked)) return kicked;
  }
  return piece; // rotation failed — keep original
};

export const hardDrop = (board: BoardType, piece: IPiece): IPiece => {
  let current = piece;
  let next = moveDown(board, current);
  while (next.position.y !== current.position.y) {
    current = next;
    next = moveDown(board, current);
  }
  return current;
};

export const getGhostPosition = (board: BoardType, piece: IPiece): IPiece =>
  hardDrop(board, piece);

export const shouldLockPiece = (board: BoardType, piece: IPiece): boolean => {
  const moved = { ...piece, position: { ...piece.position, y: piece.position.y + 1 } };
  return !isValidPosition(board, moved);
};

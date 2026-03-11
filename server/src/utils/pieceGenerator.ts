import Piece from '../classes/Piece';
import { PieceType } from 'shared/types';
import { PIECE_TYPES } from 'shared/constants';

/**
 * Fisher-Yates shuffle — mutates the array in place.
 */
const shuffle = <T>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Generates a sequence of pieces using the 7-bag randomizer.
 *
 * Each "bag" contains exactly one of each of the 7 piece types, shuffled.
 * This guarantees a fair distribution — no piece droughts.
 *
 * All players in a room share the same sequence → equal game.
 */
export const generatePieceSequence = (count: number): Piece[] => {
  const sequence: Piece[] = [];

  while (sequence.length < count) {
    const bag = shuffle([...PIECE_TYPES] as PieceType[]);
    for (const type of bag) {
      sequence.push(new Piece(type));
      if (sequence.length >= count) break;
    }
  }

  return sequence;
};

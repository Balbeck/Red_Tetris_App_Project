import { generatePieceSequence } from '../utils/pieceGenerator';
import Piece from '../classes/Piece';
import { PIECE_TYPES } from 'shared/constants';
import { PieceType } from 'shared/types';

const VALID_TYPES = new Set<PieceType>([...PIECE_TYPES] as PieceType[]);

describe('generatePieceSequence()', () => {
  it('returns exactly the requested count', () => {
    expect(generatePieceSequence(7)).toHaveLength(7);
    expect(generatePieceSequence(100)).toHaveLength(100);
    expect(generatePieceSequence(1000)).toHaveLength(1000);
  });

  it('returns Piece instances', () => {
    const seq = generatePieceSequence(7);
    seq.forEach(p => expect(p).toBeInstanceOf(Piece));
  });

  it('all pieces have valid PieceType', () => {
    const seq = generatePieceSequence(100);
    seq.forEach(p => expect(VALID_TYPES.has(p.type)).toBe(true));
  });

  it('contains all 7 types in a sequence of 7', () => {
    // Run multiple times: the 7-bag guarantees all types in first bag
    for (let attempt = 0; attempt < 10; attempt++) {
      const seq = generatePieceSequence(7);
      const types = new Set(seq.map(p => p.type));
      expect(types.size).toBe(7);
    }
  });

  it('all pieces start at rotation 0', () => {
    const seq = generatePieceSequence(14);
    seq.forEach(p => expect(p.rotation).toBe(0));
  });

  it('two calls return different sequences (probabilistic)', () => {
    const seq1 = generatePieceSequence(100);
    const seq2 = generatePieceSequence(100);
    const allSame = seq1.every((p, i) => p.type === seq2[i].type);
    // Probability of all 100 pieces being the same is astronomically low
    expect(allSame).toBe(false);
  });

  it('handles count of 1', () => {
    const seq = generatePieceSequence(1);
    expect(seq).toHaveLength(1);
    expect(VALID_TYPES.has(seq[0].type)).toBe(true);
  });

  it('no type appears more than twice in any consecutive 14 pieces (7-bag fairness)', () => {
    const seq = generatePieceSequence(14);
    const counts: Record<string, number> = {};
    seq.forEach(p => { counts[p.type] = (counts[p.type] ?? 0) + 1; });
    Object.values(counts).forEach(c => expect(c).toBeLessThanOrEqual(2));
  });
});

import Piece from '../classes/Piece';
import { PIECE_TYPES } from 'shared/constants';
import { PieceType } from 'shared/types';

const VALID_TYPES: PieceType[] = [...PIECE_TYPES] as PieceType[];

describe('Piece', () => {
  describe('constructor', () => {
    it('uses provided type', () => {
      const piece = new Piece('I');
      expect(piece.type).toBe('I');
    });

    it('generates a valid random type when none provided', () => {
      const piece = new Piece();
      expect(VALID_TYPES).toContain(piece.type);
    });

    it('always initializes rotation to 0', () => {
      const piece = new Piece('T');
      expect(piece.rotation).toBe(0);
    });

    it('sets spawn position correctly for each type', () => {
      const expectedX: Record<PieceType, number> = {
        I: 3, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3,
      };
      for (const type of VALID_TYPES) {
        const piece = new Piece(type);
        expect(piece.position.x).toBe(expectedX[type]);
        expect(piece.position.y).toBe(0);
      }
    });

    it('position is a copy, not a shared reference', () => {
      const p1 = new Piece('I');
      const p2 = new Piece('I');
      p1.position.x = 999;
      expect(p2.position.x).toBe(3);
    });
  });

  describe('randomType()', () => {
    it('returns one of the 7 valid types', () => {
      for (let i = 0; i < 50; i++) {
        expect(VALID_TYPES).toContain(Piece.randomType());
      }
    });
  });

  describe('spawnPosition()', () => {
    it('returns correct position for I', () => {
      expect(Piece.spawnPosition('I')).toEqual({ x: 3, y: 0 });
    });

    it('returns correct position for O', () => {
      expect(Piece.spawnPosition('O')).toEqual({ x: 4, y: 0 });
    });

    it('returns a copy, not a shared reference', () => {
      const pos1 = Piece.spawnPosition('T');
      const pos2 = Piece.spawnPosition('T');
      pos1.x = 999;
      expect(pos2.x).toBe(3);
    });
  });

  describe('toDTO()', () => {
    it('returns a plain object matching IPiece shape', () => {
      const piece = new Piece('S');
      const dto = piece.toDTO();

      expect(dto).toEqual({
        type: 'S',
        rotation: 0,
        position: { x: 3, y: 0 },
      });
    });

    it('position in DTO is a copy', () => {
      const piece = new Piece('L');
      const dto = piece.toDTO();
      dto.position.x = 999;
      expect(piece.position.x).toBe(3);
    });
  });
});

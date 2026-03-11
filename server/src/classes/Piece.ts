import { PieceType, IPiece } from 'shared/types';
import { PIECE_TYPES } from 'shared/constants';

const SPAWN_POSITIONS: Record<PieceType, { x: number; y: number }> = {
  I: { x: 3, y: 0 },
  O: { x: 4, y: 0 },
  T: { x: 3, y: 0 },
  S: { x: 3, y: 0 },
  Z: { x: 3, y: 0 },
  J: { x: 3, y: 0 },
  L: { x: 3, y: 0 },
};

/**
 * Represents a tetrimino as distributed by the server.
 * The client receives the DTO and handles all rotation/movement locally.
 */
class Piece {
  readonly type: PieceType;
  readonly rotation: number;
  readonly position: { x: number; y: number };

  constructor(type?: PieceType) {
    this.type = type ?? Piece.randomType();
    this.rotation = 0;
    this.position = { ...SPAWN_POSITIONS[this.type] };
  }

  /**
   * Returns a uniformly random piece type from the 7 standard types.
   */
  static randomType(): PieceType {
    return PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)] as PieceType;
  }

  /**
   * Returns the centered spawn position for a given piece type.
   */
  static spawnPosition(type: PieceType): { x: number; y: number } {
    return { ...SPAWN_POSITIONS[type] };
  }

  /**
   * Serializes to a plain object for Socket.IO transmission.
   */
  toDTO(): IPiece {
    return {
      type: this.type,
      rotation: this.rotation,
      position: { ...this.position },
    };
  }
}

export default Piece;

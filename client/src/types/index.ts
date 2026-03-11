// Re-export shared types for convenience
export type { PieceType, BoardType, IPiece, IPlayerInfo, IRoomState } from 'shared/types';

// Client-specific types
export interface NotificationItem {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success';
}

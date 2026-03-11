export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type BoardType = number[][];

export interface IPiece {
  type: PieceType;
  rotation: number;
  position: { x: number; y: number };
}

export interface IPlayerInfo {
  name: string;
  isAlive: boolean;
  isHost: boolean;
}

export interface IRoomState {
  players: IPlayerInfo[];
  status: 'waiting' | 'playing' | 'ended';
  isHost: boolean;
}

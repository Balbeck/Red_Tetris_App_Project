import { Socket } from 'socket.io';
import Player from '../classes/Player';

// Socket with typed data
export interface SocketWithData extends Socket {
  data: {
    player?: Player;
  };
}

// Server-internal game state (not exposed to client)
export interface ServerGameState {
  roomName: string;
  playerCount: number;
  aliveCount: number;
  status: 'waiting' | 'playing' | 'ended';
}

export type HandlerFn = (socket: SocketWithData, data: unknown) => void;

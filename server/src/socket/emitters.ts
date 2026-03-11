import { Socket, Server } from 'socket.io';
import Player from '../classes/Player';
import { Events } from 'shared/events';

/**
 * Typed helper functions for server → client emissions.
 * Centralizes all outgoing socket communication.
 */

export const emitToPlayer = (player: Player, event: string, data: unknown): void => {
  player.socket.emit(event, data);
};

export const emitToRoom = (io: Server, roomName: string, event: string, data: unknown): void => {
  io.to(roomName).emit(event, data);
};

export const emitToRoomExcept = (
  socket: Socket,
  roomName: string,
  event: string,
  data: unknown
): void => {
  socket.to(roomName).emit(event, data);
};

export const emitError = (socket: Socket, message: string): void => {
  socket.emit(Events.ERROR, { message });
};

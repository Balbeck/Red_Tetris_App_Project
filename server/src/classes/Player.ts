import { Socket } from 'socket.io';

/**
 * Represents a connected player in a room.
 * Wraps the socket with all game-relevant state.
 */
class Player {
  readonly id: string;        // = socket.id (unique per connection)
  name: string;
  roomName: string;
  socket: Socket;
  isHost: boolean;
  isAlive: boolean;
  pieceIndex: number;         // position in the shared piece sequence

  constructor(socket: Socket, name: string, roomName: string) {
    this.id = socket.id;
    this.name = name;
    this.roomName = roomName;
    this.socket = socket;
    this.isHost = false;
    this.isAlive = true;
    this.pieceIndex = 0;
  }

  /**
   * Typed wrapper around socket.emit — centralizes individual emissions.
   */
  emit(event: string, data: unknown): void {
    this.socket.emit(event, data);
  }

  /**
   * Resets mutable game state for a new round (without reconnecting).
   */
  resetForNewGame(): void {
    this.isAlive = true;
    this.pieceIndex = 0;
  }
}

export default Player;

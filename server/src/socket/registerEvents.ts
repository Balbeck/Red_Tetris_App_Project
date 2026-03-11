import { SocketWithData } from '../types';
import GameManager from '../managers/GameManager';
import { Events } from 'shared/events';
import {
  handleJoinRoom,
  handleStartGame,
  handleRequestPiece,
  handleUpdateSpectrum,
  handleLinesCleared,
  handleGameOverPlayer,
  handleRestartGame,
  handleDisconnect,
} from './handlers';

/**
 * Registers all Socket.IO event listeners for a new connection.
 * Called once per socket in the `io.on('connection')` callback.
 */
const registerEvents = (socket: SocketWithData, gameManager: GameManager): void => {
  console.log(`[CONNECT] Socket ${socket.id}`);

  socket.on(Events.JOIN_ROOM, (data: unknown) =>
    handleJoinRoom(socket, gameManager, data)
  );

  socket.on(Events.START_GAME, (data: unknown) =>
    handleStartGame(socket, gameManager, data)
  );

  socket.on(Events.REQUEST_PIECE, (data: unknown) =>
    handleRequestPiece(socket, gameManager, data)
  );

  socket.on(Events.UPDATE_SPECTRUM, (data: unknown) =>
    handleUpdateSpectrum(socket, gameManager, data)
  );

  socket.on(Events.LINES_CLEARED, (data: unknown) =>
    handleLinesCleared(socket, gameManager, data)
  );

  socket.on(Events.GAME_OVER_PLAYER, (data: unknown) =>
    handleGameOverPlayer(socket, gameManager, data)
  );

  socket.on(Events.RESTART_GAME, (data: unknown) =>
    handleRestartGame(socket, gameManager, data)
  );

  socket.on('disconnect', () =>
    handleDisconnect(socket, gameManager)
  );
};

export default registerEvents;

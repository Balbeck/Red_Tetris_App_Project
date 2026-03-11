import { Socket } from 'socket.io';
import Player from '../classes/Player';
import GameManager from '../managers/GameManager';
import { SocketWithData } from '../types';
import { emitError } from './emitters';
import {
  isValidRoomName,
  isValidPlayerName,
  isValidSpectrum,
  isValidLineCount,
} from '../utils/validation';
import { Events } from 'shared/events';

// ─── JOIN_ROOM ────────────────────────────────────────────────────────────────

export const handleJoinRoom = (
  socket: SocketWithData,
  gameManager: GameManager,
  data: unknown
): void => {
  try {
    const payload = data as { room?: unknown; playerName?: unknown };
    const { room, playerName } = payload;

    if (!isValidRoomName(room)) {
      emitError(socket, 'Invalid room name (1-20 chars, letters/numbers/-/_)');
      return;
    }
    if (!isValidPlayerName(playerName)) {
      emitError(socket, 'Invalid player name (1-15 chars, letters/numbers/-/_)');
      return;
    }

    const game = gameManager.getOrCreateGame(room);
    const player = new Player(socket, playerName, room);

    // addPlayer throws if game in progress or name taken
    game.addPlayer(player);

    // Store reference for future events (REQUEST_PIECE, LINES_CLEARED, etc.)
    socket.data.player = player;
    socket.join(room);

    // Send full room state to the joining player
    player.emit(Events.ROOM_STATE, game.getRoomState(socket.id));

    console.log(`[JOIN] "${playerName}" → room "${room}" (${game.players.size} players)`);
  } catch (err) {
    emitError(socket, (err as Error).message);
  }
};

// ─── START_GAME ───────────────────────────────────────────────────────────────

export const handleStartGame = (
  socket: SocketWithData,
  gameManager: GameManager,
  data: unknown
): void => {
  try {
    const player = socket.data.player;
    if (!player) return;

    const game = gameManager.getGame(player.roomName);
    if (!game) return;

    if (!player.isHost) {
      emitError(socket, 'Only the host can start the game');
      return;
    }
    if (game.status !== 'waiting') {
      emitError(socket, 'Game is not in waiting state');
      return;
    }

    game.start();
    console.log(`[START] Room "${player.roomName}" started by "${player.name}"`);
  } catch (err) {
    emitError(socket, (err as Error).message);
  }
};

// ─── REQUEST_PIECE ────────────────────────────────────────────────────────────

export const handleRequestPiece = (
  socket: SocketWithData,
  gameManager: GameManager,
  _data: unknown
): void => {
  try {
    const player = socket.data.player;
    if (!player) return;

    const game = gameManager.getGame(player.roomName);
    if (!game || game.status !== 'playing') return;

    const piece = game.getNextPiece(player);
    player.emit(Events.NEW_PIECE, { piece: piece.toDTO() });
  } catch (err) {
    emitError(socket, (err as Error).message);
  }
};

// ─── UPDATE_SPECTRUM ──────────────────────────────────────────────────────────

export const handleUpdateSpectrum = (
  socket: SocketWithData,
  gameManager: GameManager,
  data: unknown
): void => {
  try {
    const player = socket.data.player;
    if (!player) return;

    const payload = data as { spectrum?: unknown };
    if (!isValidSpectrum(payload.spectrum)) return;

    const game = gameManager.getGame(player.roomName);
    if (!game || game.status !== 'playing') return;

    game.updateSpectrum(player, payload.spectrum);
  } catch (err) {
    console.error('[handleUpdateSpectrum]', err);
  }
};

// ─── LINES_CLEARED ────────────────────────────────────────────────────────────

export const handleLinesCleared = (
  socket: SocketWithData,
  gameManager: GameManager,
  data: unknown
): void => {
  try {
    const player = socket.data.player;
    if (!player) return;

    const payload = data as { count?: unknown };
    if (!isValidLineCount(payload.count)) return;

    const game = gameManager.getGame(player.roomName);
    if (!game || game.status !== 'playing') return;

    game.applyPenalty(player, payload.count);
  } catch (err) {
    console.error('[handleLinesCleared]', err);
  }
};

// ─── GAME_OVER_PLAYER ─────────────────────────────────────────────────────────

export const handleGameOverPlayer = (
  socket: SocketWithData,
  gameManager: GameManager,
  _data: unknown
): void => {
  try {
    const player = socket.data.player;
    if (!player || !player.isAlive) return;

    const game = gameManager.getGame(player.roomName);
    if (!game || game.status !== 'playing') return;

    game.eliminatePlayer(player);
    console.log(`[ELIMINATED] "${player.name}" in room "${player.roomName}"`);
  } catch (err) {
    console.error('[handleGameOverPlayer]', err);
  }
};

// ─── RESTART_GAME ─────────────────────────────────────────────────────────────

export const handleRestartGame = (
  socket: SocketWithData,
  gameManager: GameManager,
  _data: unknown
): void => {
  try {
    const player = socket.data.player;
    if (!player) return;

    const game = gameManager.getGame(player.roomName);
    if (!game) return;

    if (!player.isHost) {
      emitError(socket, 'Only the host can restart the game');
      return;
    }
    if (game.status !== 'ended') {
      emitError(socket, 'Game has not ended yet');
      return;
    }

    game.restart();
    console.log(`[RESTART] Room "${player.roomName}" restarted by "${player.name}"`);
  } catch (err) {
    emitError(socket, (err as Error).message);
  }
};

// ─── DISCONNECT ───────────────────────────────────────────────────────────────

export const handleDisconnect = (
  socket: SocketWithData,
  gameManager: GameManager
): void => {
  try {
    const player = socket.data.player;
    if (!player) return; // disconnected before joining any room

    const game = gameManager.getGame(player.roomName);
    if (!game) return;

    const isEmpty = game.removePlayer(socket.id);
    console.log(`[DISCONNECT] "${player.name}" left room "${player.roomName}"`);

    if (isEmpty) {
      gameManager.removeGame(player.roomName);
    }
  } catch (err) {
    console.error('[handleDisconnect]', err);
  }
};

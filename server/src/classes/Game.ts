import Piece from './Piece';
import Player from './Player';
import { IRoomState } from 'shared/types';
import { Events } from 'shared/events';
import { INITIAL_PIECE_SEQUENCE_SIZE } from 'shared/constants';
import { generatePieceSequence } from '../utils/pieceGenerator';

type GameStatus = 'waiting' | 'playing' | 'ended';

/**
 * Core room state machine.
 * One Game instance = one room.
 * Manages players, piece distribution, and game lifecycle.
 */
class Game {
  readonly roomName: string;
  readonly players: Map<string, Player>;  // key = socket.id
  status: GameStatus;
  pieces: Piece[];
  host: Player | null;

  constructor(roomName: string) {
    this.roomName = roomName;
    this.players = new Map();
    this.status = 'waiting';
    this.pieces = [];
    this.host = null;
  }

  // ─── Player Management ──────────────────────────────────────────────────────

  /**
   * Adds a player to the room.
   * @throws Error if game is in progress or player name is taken.
   */
  addPlayer(player: Player): void {
    if (this.status === 'playing') {
      throw new Error('Game already started');
    }
    if (this.isNameTaken(player.name)) {
      throw new Error('Name already taken');
    }

    // First player in the room → becomes host
    if (this.players.size === 0) {
      player.isHost = true;
      this.host = player;
    }

    this.players.set(player.id, player);

    // Notify existing players (not the new one — they'll receive ROOM_STATE)
    this.broadcastToOthers(player.id, Events.PLAYER_JOINED, {
      playerName: player.name,
    });
  }

  /**
   * Removes a player from the room.
   * @returns true if room is now empty and should be deleted.
   */
  removePlayer(socketId: string): boolean {
    const player = this.players.get(socketId);
    if (!player) return this.players.size === 0;

    this.players.delete(socketId);
    this.broadcastToAll(Events.PLAYER_LEFT, { playerName: player.name });

    // Transfer host if the departing player was the host
    if (player.isHost && this.players.size > 0) {
      this.transferHost();
    }

    // If game was in progress and player was still alive, check win condition
    if (this.status === 'playing' && player.isAlive) {
      this.checkWinCondition();
    }

    return this.players.size === 0;
  }

  /**
   * Assigns host to the first remaining player in the Map.
   */
  transferHost(): void {
    const newHost = this.players.values().next().value;
    if (!newHost) return;

    if (this.host) this.host.isHost = false;
    newHost.isHost = true;
    this.host = newHost;

    this.broadcastToAll(Events.HOST_CHANGED, { newHost: newHost.name });
  }

  // ─── Game Lifecycle ──────────────────────────────────────────────────────────

  /**
   * Starts the game:
   * - Generates shared piece sequence
   * - Resets all players
   * - Broadcasts GAME_STARTED
   */
  start(): void {
    this.pieces = generatePieceSequence(INITIAL_PIECE_SEQUENCE_SIZE);
    this.status = 'playing';
    this.players.forEach(p => p.resetForNewGame());
    this.broadcastToAll(Events.GAME_STARTED, {});
  }

  /**
   * Returns the next piece for a player from the shared sequence.
   * Extends the sequence dynamically if needed.
   */
  getNextPiece(player: Player): Piece {
    if (player.pieceIndex >= this.pieces.length) {
      this.pieces.push(...generatePieceSequence(100));
    }
    const piece = this.pieces[player.pieceIndex];
    player.pieceIndex += 1;
    return piece;
  }

  /**
   * Sends penalty lines to all alive opponents of the source player.
   * Formula: linesCleared - 1 (no penalty for 1 line).
   */
  applyPenalty(sourcePlayer: Player, linesCleared: number): void {
    const penaltyCount = Math.max(0, linesCleared - 1);
    if (penaltyCount === 0) return;

    this.players.forEach(player => {
      if (player.id !== sourcePlayer.id && player.isAlive) {
        player.emit(Events.PENALTY_LINES, { count: penaltyCount });
      }
    });
  }

  /**
   * Broadcasts a player's spectrum to all other players.
   */
  updateSpectrum(sourcePlayer: Player, spectrum: number[]): void {
    this.broadcastToOthers(sourcePlayer.id, Events.SPECTRUM_UPDATE, {
      playerName: sourcePlayer.name,
      spectrum,
    });
  }

  /**
   * Marks a player as eliminated and checks win condition.
   */
  eliminatePlayer(player: Player): void {
    player.isAlive = false;
    this.broadcastToAll(Events.PLAYER_ELIMINATED, { playerName: player.name });
    this.checkWinCondition();
  }

  /**
   * Checks if the game should end (≤1 alive player).
   */
  checkWinCondition(): void {
    if (this.status !== 'playing') return;

    const alive = this.getAlivePlayers();

    if (alive.length <= 1) {
      this.status = 'ended';
      const winner = alive.length === 1 ? alive[0].name : null;
      this.broadcastToAll(Events.GAME_OVER, { winner });
    }
  }

  /**
   * Resets the game back to the lobby (waiting) phase.
   * Generates a fresh piece sequence and resets all players.
   */
  restart(): void {
    this.pieces = generatePieceSequence(INITIAL_PIECE_SEQUENCE_SIZE);
    this.status = 'waiting';
    this.players.forEach(p => p.resetForNewGame());

    // Send each player their own ROOM_STATE (isHost differs per player)
    this.players.forEach(p => {
      p.emit(Events.ROOM_STATE, this.getRoomState(p.id));
    });
  }

  // ─── Broadcast Helpers ──────────────────────────────────────────────────────

  broadcastToAll(event: string, data: unknown): void {
    this.players.forEach(player => player.emit(event, data));
  }

  broadcastToOthers(excludeSocketId: string, event: string, data: unknown): void {
    this.players.forEach(player => {
      if (player.id !== excludeSocketId) player.emit(event, data);
    });
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  getAlivePlayers(): Player[] {
    return Array.from(this.players.values()).filter(p => p.isAlive);
  }

  getPlayerBySocketId(socketId: string): Player | undefined {
    return this.players.get(socketId);
  }

  /**
   * Serializes room state for ROOM_STATE event.
   * isHost is computed relative to the requesting player.
   */
  getRoomState(requestingSocketId: string): IRoomState {
    const requesting = this.players.get(requestingSocketId);
    return {
      players: Array.from(this.players.values()).map(p => ({
        name: p.name,
        isAlive: p.isAlive,
        isHost: p.isHost,
      })),
      status: this.status,
      isHost: requesting?.isHost ?? false,
    };
  }

  private isNameTaken(name: string): boolean {
    return Array.from(this.players.values()).some(
      p => p.name.toLowerCase() === name.toLowerCase()
    );
  }
}

export default Game;

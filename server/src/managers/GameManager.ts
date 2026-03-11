import Game from '../classes/Game';

/**
 * Singleton — manages all concurrent Game instances.
 * Single entry point for all room operations.
 * One instance created in index.ts and passed to all handlers.
 */
class GameManager {
  private readonly games: Map<string, Game>;

  constructor() {
    this.games = new Map();
  }

  /**
   * Returns existing game or creates a new one.
   * This is the entry point for every JOIN_ROOM event.
   */
  getOrCreateGame(roomName: string): Game {
    const existing = this.games.get(roomName);
    if (existing) return existing;

    const game = new Game(roomName);
    this.games.set(roomName, game);
    console.log(`[GameManager] Room created: "${roomName}" (total: ${this.games.size})`);
    return game;
  }

  getGame(roomName: string): Game | undefined {
    return this.games.get(roomName);
  }

  /**
   * Removes a room once it is empty.
   * Called by disconnect handler.
   */
  removeGame(roomName: string): void {
    this.games.delete(roomName);
    console.log(`[GameManager] Room deleted: "${roomName}" (total: ${this.games.size})`);
  }

  getActiveGamesCount(): number {
    return this.games.size;
  }

  /** Debug — list all active room names */
  getAllRoomNames(): string[] {
    return Array.from(this.games.keys());
  }
}

export default GameManager;

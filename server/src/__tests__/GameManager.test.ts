import GameManager from '../managers/GameManager';
import Game from '../classes/Game';

describe('GameManager', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
  });

  describe('getOrCreateGame()', () => {
    it('creates a new game when room does not exist', () => {
      const game = manager.getOrCreateGame('room1');

      expect(game).toBeInstanceOf(Game);
      expect(game.roomName).toBe('room1');
    });

    it('returns the same instance for the same room', () => {
      const game1 = manager.getOrCreateGame('room1');
      const game2 = manager.getOrCreateGame('room1');

      expect(game1).toBe(game2);
    });

    it('returns different instances for different rooms', () => {
      const game1 = manager.getOrCreateGame('room1');
      const game2 = manager.getOrCreateGame('room2');

      expect(game1).not.toBe(game2);
    });

    it('increments active game count on new room creation', () => {
      manager.getOrCreateGame('room1');
      manager.getOrCreateGame('room2');

      expect(manager.getActiveGamesCount()).toBe(2);
    });

    it('does not increment count on existing room access', () => {
      manager.getOrCreateGame('room1');
      manager.getOrCreateGame('room1');

      expect(manager.getActiveGamesCount()).toBe(1);
    });
  });

  describe('getGame()', () => {
    it('returns the game if it exists', () => {
      const created = manager.getOrCreateGame('room1');
      const found = manager.getGame('room1');

      expect(found).toBe(created);
    });

    it('returns undefined for nonexistent room', () => {
      expect(manager.getGame('nonexistent')).toBeUndefined();
    });
  });

  describe('removeGame()', () => {
    it('removes the room from the map', () => {
      manager.getOrCreateGame('room1');
      manager.removeGame('room1');

      expect(manager.getGame('room1')).toBeUndefined();
    });

    it('decrements active games count', () => {
      manager.getOrCreateGame('room1');
      manager.getOrCreateGame('room2');
      manager.removeGame('room1');

      expect(manager.getActiveGamesCount()).toBe(1);
    });

    it('does not throw when removing nonexistent room', () => {
      expect(() => manager.removeGame('ghost')).not.toThrow();
    });
  });

  describe('getActiveGamesCount()', () => {
    it('returns 0 on fresh instance', () => {
      expect(manager.getActiveGamesCount()).toBe(0);
    });

    it('returns correct count after adds and removes', () => {
      manager.getOrCreateGame('r1');
      manager.getOrCreateGame('r2');
      manager.getOrCreateGame('r3');
      manager.removeGame('r2');

      expect(manager.getActiveGamesCount()).toBe(2);
    });
  });

  describe('getAllRoomNames()', () => {
    it('returns all room names', () => {
      manager.getOrCreateGame('alpha');
      manager.getOrCreateGame('beta');

      const names = manager.getAllRoomNames();
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
      expect(names).toHaveLength(2);
    });

    it('returns empty array when no rooms', () => {
      expect(manager.getAllRoomNames()).toEqual([]);
    });
  });
});

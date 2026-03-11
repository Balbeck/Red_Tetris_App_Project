import Game from '../classes/Game';
import Player from '../classes/Player';
import { Events } from 'shared/events';

let socketIdCounter = 0;

const createMockPlayer = (name: string, room = 'test-room'): Player => {
  const id = `socket-${++socketIdCounter}`;
  const socket = { id, emit: jest.fn() };
  return new Player(socket as never, name, room);
};

describe('Game', () => {
  beforeEach(() => {
    socketIdCounter = 0;
  });

  describe('addPlayer()', () => {
    it('first player becomes host', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');

      game.addPlayer(p1);

      expect(p1.isHost).toBe(true);
      expect(game.host).toBe(p1);
    });

    it('second player is not host', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');

      game.addPlayer(p1);
      game.addPlayer(p2);

      expect(p2.isHost).toBe(false);
    });

    it('emits PLAYER_JOINED to existing players when a new one joins', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);

      const emitSpy = jest.spyOn(p1, 'emit');
      game.addPlayer(p2);

      expect(emitSpy).toHaveBeenCalledWith(Events.PLAYER_JOINED, { playerName: 'Bob' });
    });

    it('does not emit PLAYER_JOINED to the joining player', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const emitSpy = jest.spyOn(p1, 'emit');

      game.addPlayer(p1);

      const joinedCalls = emitSpy.mock.calls.filter(([e]) => e === Events.PLAYER_JOINED);
      expect(joinedCalls).toHaveLength(0);
    });

    it('throws when game is in playing state', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();

      const p2 = createMockPlayer('Bob');
      expect(() => game.addPlayer(p2)).toThrow('Game already started');
    });

    it('throws when player name is already taken (case-insensitive)', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('alice');
      game.addPlayer(p1);

      expect(() => game.addPlayer(p2)).toThrow('Name already taken');
    });

    it('adds player to the players map', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);

      expect(game.players.size).toBe(1);
      expect(game.players.get(p1.id)).toBe(p1);
    });
  });

  describe('removePlayer()', () => {
    it('removes player from map', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);

      game.removePlayer(p1.id);

      expect(game.players.has(p1.id)).toBe(false);
    });

    it('emits PLAYER_LEFT to remaining players', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      const emitSpy = jest.spyOn(p2, 'emit');
      game.removePlayer(p1.id);

      expect(emitSpy).toHaveBeenCalledWith(Events.PLAYER_LEFT, { playerName: 'Alice' });
    });

    it('returns true when room becomes empty', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);

      const isEmpty = game.removePlayer(p1.id);
      expect(isEmpty).toBe(true);
    });

    it('returns false when players remain', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      const isEmpty = game.removePlayer(p1.id);
      expect(isEmpty).toBe(false);
    });

    it('transfers host when host leaves', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      game.removePlayer(p1.id);

      expect(p2.isHost).toBe(true);
      expect(game.host).toBe(p2);
    });

    it('does nothing when socketId not found', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);

      expect(() => game.removePlayer('nonexistent')).not.toThrow();
      expect(game.players.size).toBe(1);
    });
  });

  describe('transferHost()', () => {
    it('assigns host to the next player via removePlayer', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      game.removePlayer(p1.id);

      expect(p2.isHost).toBe(true);
      expect(game.host).toBe(p2);
    });

    it('emits HOST_CHANGED to remaining players after host leaves', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      const p3 = createMockPlayer('Carol');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.addPlayer(p3);

      const spy2 = jest.spyOn(p2, 'emit');
      const spy3 = jest.spyOn(p3, 'emit');
      game.removePlayer(p1.id);

      // p2 is first remaining player → becomes host
      const hostChangedCalls2 = spy2.mock.calls.filter(([e]) => e === Events.HOST_CHANGED);
      const hostChangedCalls3 = spy3.mock.calls.filter(([e]) => e === Events.HOST_CHANGED);
      expect(hostChangedCalls2).toHaveLength(1);
      expect(hostChangedCalls3).toHaveLength(1);
      expect(hostChangedCalls2[0][1]).toEqual({ newHost: 'Bob' });
    });

    it('sets old host isHost to false after transfer', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      game.removePlayer(p1.id);

      expect(p1.isHost).toBe(false);
    });
  });

  describe('start()', () => {
    it('sets status to playing', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);

      game.start();

      expect(game.status).toBe('playing');
    });

    it('generates a piece sequence', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);

      game.start();

      expect(game.pieces.length).toBeGreaterThan(0);
    });

    it('emits GAME_STARTED to all players', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      const spy1 = jest.spyOn(p1, 'emit');
      const spy2 = jest.spyOn(p2, 'emit');
      game.start();

      expect(spy1).toHaveBeenCalledWith(Events.GAME_STARTED, {});
      expect(spy2).toHaveBeenCalledWith(Events.GAME_STARTED, {});
    });

    it('resets all players via resetForNewGame', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      p1.isAlive = false;
      p1.pieceIndex = 10;

      game.start();

      expect(p1.isAlive).toBe(true);
      expect(p1.pieceIndex).toBe(0);
    });
  });

  describe('getNextPiece()', () => {
    it('returns the piece at the player pieceIndex', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();

      const firstPiece = game.pieces[0];
      const returned = game.getNextPiece(p1);

      expect(returned).toBe(firstPiece);
    });

    it('increments pieceIndex after each call', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();

      game.getNextPiece(p1);
      expect(p1.pieceIndex).toBe(1);
      game.getNextPiece(p1);
      expect(p1.pieceIndex).toBe(2);
    });

    it('extends the sequence when pieceIndex reaches the end', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();

      const originalLength = game.pieces.length;
      p1.pieceIndex = originalLength;

      game.getNextPiece(p1);

      expect(game.pieces.length).toBeGreaterThan(originalLength);
    });

    it('two players at same index get same piece type', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();

      const piece1 = game.getNextPiece(p1);
      const piece2 = game.getNextPiece(p2);

      expect(piece1.type).toBe(piece2.type);
    });
  });

  describe('applyPenalty()', () => {
    it('sends no penalty for 1 line cleared', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();

      const spy = jest.spyOn(p2, 'emit');
      game.applyPenalty(p1, 1);

      const penaltyCalls = spy.mock.calls.filter(([e]) => e === Events.PENALTY_LINES);
      expect(penaltyCalls).toHaveLength(0);
    });

    it('sends 1 penalty line for 2 lines cleared', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();

      const spy = jest.spyOn(p2, 'emit');
      game.applyPenalty(p1, 2);

      expect(spy).toHaveBeenCalledWith(Events.PENALTY_LINES, { count: 1 });
    });

    it('sends 3 penalty lines for 4 lines cleared', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();

      const spy = jest.spyOn(p2, 'emit');
      game.applyPenalty(p1, 4);

      expect(spy).toHaveBeenCalledWith(Events.PENALTY_LINES, { count: 3 });
    });

    it('does not send penalty to the source player', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();

      const spy = jest.spyOn(p1, 'emit');
      game.applyPenalty(p1, 4);

      const penaltyCalls = spy.mock.calls.filter(([e]) => e === Events.PENALTY_LINES);
      expect(penaltyCalls).toHaveLength(0);
    });

    it('does not send penalty to dead players', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();
      p2.isAlive = false;

      const spy = jest.spyOn(p2, 'emit');
      game.applyPenalty(p1, 4);

      const penaltyCalls = spy.mock.calls.filter(([e]) => e === Events.PENALTY_LINES);
      expect(penaltyCalls).toHaveLength(0);
    });
  });

  describe('updateSpectrum()', () => {
    it('broadcasts SPECTRUM_UPDATE to other players', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      const spy = jest.spyOn(p2, 'emit');
      const spectrum = Array(10).fill(5);
      game.updateSpectrum(p1, spectrum);

      expect(spy).toHaveBeenCalledWith(Events.SPECTRUM_UPDATE, {
        playerName: 'Alice',
        spectrum,
      });
    });

    it('does not emit to source player', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      const spy = jest.spyOn(p1, 'emit');
      game.updateSpectrum(p1, Array(10).fill(0));

      const spectrumCalls = spy.mock.calls.filter(([e]) => e === Events.SPECTRUM_UPDATE);
      expect(spectrumCalls).toHaveLength(0);
    });
  });

  describe('eliminatePlayer()', () => {
    it('sets player isAlive to false', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();

      game.eliminatePlayer(p1);

      expect(p1.isAlive).toBe(false);
    });

    it('emits PLAYER_ELIMINATED to all', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();

      const spy = jest.spyOn(p2, 'emit');
      game.eliminatePlayer(p1);

      expect(spy).toHaveBeenCalledWith(Events.PLAYER_ELIMINATED, { playerName: 'Alice' });
    });
  });

  describe('checkWinCondition()', () => {
    it('emits GAME_OVER with winner when 1 alive remains (multiplayer)', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();
      p2.isAlive = false;

      const spy = jest.spyOn(p1, 'emit');
      game.checkWinCondition();

      expect(spy).toHaveBeenCalledWith(Events.GAME_OVER, { winner: 'Alice' });
      expect(game.status).toBe('ended');
    });

    it('emits GAME_OVER with null winner when 0 alive (solo game)', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();
      p1.isAlive = false;

      const spy = jest.spyOn(p1, 'emit');
      game.checkWinCondition();

      expect(spy).toHaveBeenCalledWith(Events.GAME_OVER, { winner: null });
      expect(game.status).toBe('ended');
    });

    it('does nothing when status is not playing', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      // status is 'waiting'

      const spy = jest.spyOn(p1, 'emit');
      game.checkWinCondition();

      const gameOverCalls = spy.mock.calls.filter(([e]) => e === Events.GAME_OVER);
      expect(gameOverCalls).toHaveLength(0);
    });

    it('does not trigger when 2+ players alive', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();

      const spy1 = jest.spyOn(p1, 'emit');
      game.checkWinCondition();

      const gameOverCalls = spy1.mock.calls.filter(([e]) => e === Events.GAME_OVER);
      expect(gameOverCalls).toHaveLength(0);
      expect(game.status).toBe('playing');
    });
  });

  describe('restart()', () => {
    it('resets status to waiting', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();
      game.status = 'ended';

      game.restart();

      expect(game.status).toBe('waiting');
    });

    it('generates a new piece sequence', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();
      const oldPieces = game.pieces;
      game.status = 'ended';

      game.restart();

      expect(game.pieces).not.toBe(oldPieces);
    });

    it('resets all players', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);
      game.start();
      p1.isAlive = false;
      p1.pieceIndex = 50;
      game.status = 'ended';

      game.restart();

      expect(p1.isAlive).toBe(true);
      expect(p1.pieceIndex).toBe(0);
    });

    it('emits ROOM_STATE to each player with correct isHost', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();
      game.status = 'ended';

      const spy1 = jest.spyOn(p1, 'emit');
      const spy2 = jest.spyOn(p2, 'emit');
      game.restart();

      const roomStateCalls1 = spy1.mock.calls.filter(([e]) => e === Events.ROOM_STATE);
      const roomStateCalls2 = spy2.mock.calls.filter(([e]) => e === Events.ROOM_STATE);
      expect(roomStateCalls1).toHaveLength(1);
      expect(roomStateCalls2).toHaveLength(1);
      expect((roomStateCalls1[0][1] as { isHost: boolean }).isHost).toBe(true);
      expect((roomStateCalls2[0][1] as { isHost: boolean }).isHost).toBe(false);
    });
  });

  describe('getRoomState()', () => {
    it('returns correct status and player list', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      game.addPlayer(p1);

      const state = game.getRoomState(p1.id);

      expect(state.status).toBe('waiting');
      expect(state.players).toHaveLength(1);
      expect(state.players[0].name).toBe('Alice');
      expect(state.isHost).toBe(true);
    });

    it('isHost is false for non-host player', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);

      const state = game.getRoomState(p2.id);
      expect(state.isHost).toBe(false);
    });
  });

  describe('getAlivePlayers()', () => {
    it('returns only alive players', () => {
      const game = new Game('room1');
      const p1 = createMockPlayer('Alice');
      const p2 = createMockPlayer('Bob');
      game.addPlayer(p1);
      game.addPlayer(p2);
      game.start();
      p1.isAlive = false;

      const alive = game.getAlivePlayers();

      expect(alive).toHaveLength(1);
      expect(alive[0].name).toBe('Bob');
    });
  });
});

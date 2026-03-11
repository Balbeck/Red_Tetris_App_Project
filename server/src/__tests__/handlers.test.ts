import {
  handleJoinRoom,
  handleStartGame,
  handleRequestPiece,
  handleUpdateSpectrum,
  handleLinesCleared,
  handleGameOverPlayer,
  handleRestartGame,
  handleDisconnect,
} from '../socket/handlers';
import GameManager from '../managers/GameManager';
import Player from '../classes/Player';
import { Events } from 'shared/events';
import { SocketWithData } from '../types';

// ─── Mock Socket Factory ──────────────────────────────────────────────────────

let socketIdCounter = 0;

const createMockSocket = (): SocketWithData => {
  const id = `socket-${++socketIdCounter}`;
  return {
    id,
    emit: jest.fn(),
    join: jest.fn(),
    data: {},
  } as unknown as SocketWithData;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Join a player to a room and return the socket (with data.player set). */
const joinPlayer = (
  manager: GameManager,
  playerName: string,
  room: string
): SocketWithData => {
  const socket = createMockSocket();
  handleJoinRoom(socket, manager, { room, playerName });
  return socket;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handleJoinRoom', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('creates a game and stores player on socket.data', () => {
    const socket = createMockSocket();
    handleJoinRoom(socket, manager, { room: 'room1', playerName: 'Alice' });

    expect(socket.data.player).toBeDefined();
    expect(socket.data.player?.name).toBe('Alice');
    expect(manager.getGame('room1')).toBeDefined();
  });

  it('emits ROOM_STATE to the joining player', () => {
    const socket = createMockSocket();
    handleJoinRoom(socket, manager, { room: 'room1', playerName: 'Alice' });

    const calls = (socket.emit as jest.Mock).mock.calls;
    const roomStateCalls = calls.filter(([e]: [string]) => e === Events.ROOM_STATE);
    expect(roomStateCalls).toHaveLength(1);
  });

  it('emits ERROR for invalid room name', () => {
    const socket = createMockSocket();
    handleJoinRoom(socket, manager, { room: '', playerName: 'Alice' });

    const calls = (socket.emit as jest.Mock).mock.calls;
    const errorCalls = calls.filter(([e]: [string]) => e === Events.ERROR);
    expect(errorCalls).toHaveLength(1);
  });

  it('emits ERROR for invalid player name', () => {
    const socket = createMockSocket();
    handleJoinRoom(socket, manager, { room: 'room1', playerName: '' });

    const calls = (socket.emit as jest.Mock).mock.calls;
    const errorCalls = calls.filter(([e]: [string]) => e === Events.ERROR);
    expect(errorCalls).toHaveLength(1);
  });

  it('emits ERROR when name is already taken', () => {
    joinPlayer(manager, 'Alice', 'room1');
    const socket2 = createMockSocket();
    handleJoinRoom(socket2, manager, { room: 'room1', playerName: 'Alice' });

    const calls = (socket2.emit as jest.Mock).mock.calls;
    const errorCalls = calls.filter(([e]: [string]) => e === Events.ERROR);
    expect(errorCalls).toHaveLength(1);
  });

  it('calls socket.join with the room name', () => {
    const socket = createMockSocket();
    handleJoinRoom(socket, manager, { room: 'room1', playerName: 'Alice' });

    expect(socket.join).toHaveBeenCalledWith('room1');
  });

  it('first player becomes host', () => {
    const socket = joinPlayer(manager, 'Alice', 'room1');
    expect(socket.data.player?.isHost).toBe(true);
  });

  it('second player is not host', () => {
    joinPlayer(manager, 'Alice', 'room1');
    const socket2 = joinPlayer(manager, 'Bob', 'room1');
    expect(socket2.data.player?.isHost).toBe(false);
  });
});

describe('handleStartGame', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('starts the game when called by host', () => {
    const hostSocket = joinPlayer(manager, 'Alice', 'room1');
    handleStartGame(hostSocket, manager, {});

    const game = manager.getGame('room1')!;
    expect(game.status).toBe('playing');
  });

  it('emits ERROR when called by non-host', () => {
    joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');
    handleStartGame(p2Socket, manager, {});

    const calls = (p2Socket.emit as jest.Mock).mock.calls;
    const errorCalls = calls.filter(([e]: [string]) => e === Events.ERROR);
    expect(errorCalls).toHaveLength(1);
  });

  it('does nothing when socket has no player', () => {
    const socket = createMockSocket();
    expect(() => handleStartGame(socket, manager, {})).not.toThrow();
  });

  it('emits ERROR when game is not in waiting state', () => {
    const hostSocket = joinPlayer(manager, 'Alice', 'room1');
    handleStartGame(hostSocket, manager, {}); // start once
    handleStartGame(hostSocket, manager, {}); // try again

    const calls = (hostSocket.emit as jest.Mock).mock.calls;
    const errorCalls = calls.filter(([e]: [string]) => e === Events.ERROR);
    expect(errorCalls).toHaveLength(1);
  });
});

describe('handleRequestPiece', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('emits NEW_PIECE to the requesting player', () => {
    const socket = joinPlayer(manager, 'Alice', 'room1');
    handleStartGame(socket, manager, {});

    handleRequestPiece(socket, manager, {});

    const calls = (socket.emit as jest.Mock).mock.calls;
    const newPieceCalls = calls.filter(([e]: [string]) => e === Events.NEW_PIECE);
    expect(newPieceCalls).toHaveLength(1);
    expect(newPieceCalls[0][1]).toHaveProperty('piece');
  });

  it('does nothing when game is not playing', () => {
    const socket = joinPlayer(manager, 'Alice', 'room1');
    // game is still 'waiting'

    handleRequestPiece(socket, manager, {});

    const calls = (socket.emit as jest.Mock).mock.calls;
    const newPieceCalls = calls.filter(([e]: [string]) => e === Events.NEW_PIECE);
    expect(newPieceCalls).toHaveLength(0);
  });

  it('does nothing when socket has no player', () => {
    const socket = createMockSocket();
    expect(() => handleRequestPiece(socket, manager, {})).not.toThrow();
  });
});

describe('handleUpdateSpectrum', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('broadcasts SPECTRUM_UPDATE to other players', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');
    handleStartGame(p1Socket, manager, {});

    const spectrum = Array(10).fill(5);
    handleUpdateSpectrum(p1Socket, manager, { spectrum });

    const p2Calls = (p2Socket.emit as jest.Mock).mock.calls;
    const spectrumCalls = p2Calls.filter(([e]: [string]) => e === Events.SPECTRUM_UPDATE);
    expect(spectrumCalls).toHaveLength(1);
  });

  it('does nothing for invalid spectrum', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');
    handleStartGame(p1Socket, manager, {});

    handleUpdateSpectrum(p1Socket, manager, { spectrum: [1, 2, 3] }); // wrong length

    const p2Calls = (p2Socket.emit as jest.Mock).mock.calls;
    const spectrumCalls = p2Calls.filter(([e]: [string]) => e === Events.SPECTRUM_UPDATE);
    expect(spectrumCalls).toHaveLength(0);
  });

  it('does nothing when socket has no player', () => {
    const socket = createMockSocket();
    expect(() => handleUpdateSpectrum(socket, manager, {})).not.toThrow();
  });
});

describe('handleLinesCleared', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('sends PENALTY_LINES to other players for 2+ lines', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');
    handleStartGame(p1Socket, manager, {});

    handleLinesCleared(p1Socket, manager, { count: 4 });

    const p2Calls = (p2Socket.emit as jest.Mock).mock.calls;
    const penaltyCalls = p2Calls.filter(([e]: [string]) => e === Events.PENALTY_LINES);
    expect(penaltyCalls).toHaveLength(1);
    expect(penaltyCalls[0][1]).toEqual({ count: 3 });
  });

  it('does nothing for invalid count', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');
    handleStartGame(p1Socket, manager, {});

    handleLinesCleared(p1Socket, manager, { count: 5 });

    const p2Calls = (p2Socket.emit as jest.Mock).mock.calls;
    const penaltyCalls = p2Calls.filter(([e]: [string]) => e === Events.PENALTY_LINES);
    expect(penaltyCalls).toHaveLength(0);
  });

  it('does nothing when socket has no player', () => {
    const socket = createMockSocket();
    expect(() => handleLinesCleared(socket, manager, { count: 2 })).not.toThrow();
  });
});

describe('handleGameOverPlayer', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('eliminates the player and emits PLAYER_ELIMINATED', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');
    handleStartGame(p1Socket, manager, {});

    handleGameOverPlayer(p1Socket, manager, {});

    expect(p1Socket.data.player?.isAlive).toBe(false);
    const p2Calls = (p2Socket.emit as jest.Mock).mock.calls;
    const elimCalls = p2Calls.filter(([e]: [string]) => e === Events.PLAYER_ELIMINATED);
    expect(elimCalls).toHaveLength(1);
  });

  it('triggers GAME_OVER when last player is eliminated (solo)', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    handleStartGame(p1Socket, manager, {});

    handleGameOverPlayer(p1Socket, manager, {});

    const calls = (p1Socket.emit as jest.Mock).mock.calls;
    const gameOverCalls = calls.filter(([e]: [string]) => e === Events.GAME_OVER);
    expect(gameOverCalls).toHaveLength(1);
    expect(gameOverCalls[0][1]).toEqual({ winner: null });
  });

  it('does nothing when player is already dead', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    handleStartGame(p1Socket, manager, {});
    p1Socket.data.player!.isAlive = false;

    expect(() => handleGameOverPlayer(p1Socket, manager, {})).not.toThrow();
    const game = manager.getGame('room1')!;
    expect(game.status).toBe('playing'); // still playing (no second elimination)
  });

  it('does nothing when socket has no player', () => {
    const socket = createMockSocket();
    expect(() => handleGameOverPlayer(socket, manager, {})).not.toThrow();
  });
});

describe('handleRestartGame', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  const setupEndedGame = (): SocketWithData => {
    const hostSocket = joinPlayer(manager, 'Alice', 'room1');
    handleStartGame(hostSocket, manager, {});
    handleGameOverPlayer(hostSocket, manager, {}); // ends the game
    return hostSocket;
  };

  it('restarts the game when called by host after game ended', () => {
    const hostSocket = setupEndedGame();
    handleRestartGame(hostSocket, manager, {});

    const game = manager.getGame('room1')!;
    expect(game.status).toBe('waiting');
  });

  it('emits ROOM_STATE after restart', () => {
    const hostSocket = setupEndedGame();
    handleRestartGame(hostSocket, manager, {});

    const calls = (hostSocket.emit as jest.Mock).mock.calls;
    const roomStateCalls = calls.filter(([e]: [string]) => e === Events.ROOM_STATE);
    // One on join, one on restart
    expect(roomStateCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('emits ERROR when called by non-host', () => {
    const hostSocket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');
    handleStartGame(hostSocket, manager, {});
    handleGameOverPlayer(hostSocket, manager, {});

    handleRestartGame(p2Socket, manager, {});

    const calls = (p2Socket.emit as jest.Mock).mock.calls;
    const errorCalls = calls.filter(([e]: [string]) => e === Events.ERROR);
    expect(errorCalls).toHaveLength(1);
  });

  it('emits ERROR when game has not ended', () => {
    const hostSocket = joinPlayer(manager, 'Alice', 'room1');
    handleStartGame(hostSocket, manager, {});

    handleRestartGame(hostSocket, manager, {});

    const calls = (hostSocket.emit as jest.Mock).mock.calls;
    const errorCalls = calls.filter(([e]: [string]) => e === Events.ERROR);
    expect(errorCalls).toHaveLength(1);
  });

  it('does nothing when socket has no player', () => {
    const socket = createMockSocket();
    expect(() => handleRestartGame(socket, manager, {})).not.toThrow();
  });
});

describe('handleDisconnect', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('removes player from the game', () => {
    const socket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');

    handleDisconnect(socket, manager);

    const game = manager.getGame('room1')!;
    expect(game.players.has(socket.id)).toBe(false);
  });

  it('removes the game when last player disconnects', () => {
    const socket = joinPlayer(manager, 'Alice', 'room1');
    handleDisconnect(socket, manager);

    expect(manager.getGame('room1')).toBeUndefined();
  });

  it('does not remove game when other players remain', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    joinPlayer(manager, 'Bob', 'room1');

    handleDisconnect(p1Socket, manager);

    expect(manager.getGame('room1')).toBeDefined();
  });

  it('does nothing when socket has no player (disconnect before join)', () => {
    const socket = createMockSocket();
    expect(() => handleDisconnect(socket, manager)).not.toThrow();
  });

  it('emits PLAYER_LEFT to remaining players', () => {
    const p1Socket = joinPlayer(manager, 'Alice', 'room1');
    const p2Socket = joinPlayer(manager, 'Bob', 'room1');

    handleDisconnect(p1Socket, manager);

    const p2Calls = (p2Socket.emit as jest.Mock).mock.calls;
    const leftCalls = p2Calls.filter(([e]: [string]) => e === Events.PLAYER_LEFT);
    expect(leftCalls).toHaveLength(1);
    expect(leftCalls[0][1]).toEqual({ playerName: 'Alice' });
  });
});

describe('Solo Game E2E: full lifecycle', () => {
  let manager: GameManager;

  beforeEach(() => {
    manager = new GameManager();
    socketIdCounter = 0;
  });

  it('completes a full solo game: join → start → request pieces → game over → restart', () => {
    // 1. Join
    const socket = createMockSocket();
    handleJoinRoom(socket, manager, { room: 'solo_123', playerName: 'Player1' });
    expect(socket.data.player).toBeDefined();

    // 2. Start (player is host)
    handleStartGame(socket, manager, {});
    const game = manager.getGame('solo_123')!;
    expect(game.status).toBe('playing');

    // 3. Request multiple pieces
    for (let i = 0; i < 5; i++) {
      handleRequestPiece(socket, manager, {});
    }
    expect(socket.data.player!.pieceIndex).toBe(5);

    // 4. Game over
    handleGameOverPlayer(socket, manager, {});
    expect(game.status).toBe('ended');

    const gameOverCalls = (socket.emit as jest.Mock).mock.calls.filter(
      ([e]: [string]) => e === Events.GAME_OVER
    );
    expect(gameOverCalls).toHaveLength(1);
    expect(gameOverCalls[0][1]).toEqual({ winner: null });

    // 5. Restart
    handleRestartGame(socket, manager, {});
    expect(game.status).toBe('waiting');
    expect(socket.data.player!.isAlive).toBe(true);
    expect(socket.data.player!.pieceIndex).toBe(0);
  });

  it('disconnect cleans up server state after solo game', () => {
    const socket = joinPlayer(manager, 'Player1', 'solo_456');
    handleStartGame(socket, manager, {});
    handleDisconnect(socket, manager);

    expect(manager.getGame('solo_456')).toBeUndefined();
    expect(manager.getActiveGamesCount()).toBe(0);
  });
});

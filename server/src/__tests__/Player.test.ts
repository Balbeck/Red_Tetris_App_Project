import Player from '../classes/Player';

const createMockSocket = (id = 'socket-1') => ({
  id,
  emit: jest.fn(),
});

describe('Player', () => {
  it('sets all fields correctly from constructor', () => {
    const socket = createMockSocket('abc');
    const player = new Player(socket as never, 'Alice', 'room1');

    expect(player.id).toBe('abc');
    expect(player.name).toBe('Alice');
    expect(player.roomName).toBe('room1');
    expect(player.socket).toBe(socket);
    expect(player.isHost).toBe(false);
    expect(player.isAlive).toBe(true);
    expect(player.pieceIndex).toBe(0);
  });

  it('emit() calls socket.emit with correct args', () => {
    const socket = createMockSocket();
    const player = new Player(socket as never, 'Bob', 'room1');

    player.emit('TEST_EVENT', { foo: 'bar' });

    expect(socket.emit).toHaveBeenCalledWith('TEST_EVENT', { foo: 'bar' });
  });

  it('resetForNewGame() resets isAlive and pieceIndex', () => {
    const socket = createMockSocket();
    const player = new Player(socket as never, 'Carol', 'room1');
    player.isAlive = false;
    player.pieceIndex = 42;

    player.resetForNewGame();

    expect(player.isAlive).toBe(true);
    expect(player.pieceIndex).toBe(0);
  });

  it('resetForNewGame() does not affect other fields', () => {
    const socket = createMockSocket();
    const player = new Player(socket as never, 'Dave', 'room2');
    player.isHost = true;

    player.resetForNewGame();

    expect(player.isHost).toBe(true);
    expect(player.name).toBe('Dave');
    expect(player.roomName).toBe('room2');
  });
});

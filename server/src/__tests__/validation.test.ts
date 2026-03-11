import {
  isValidRoomName,
  isValidPlayerName,
  isValidSpectrum,
  isValidLineCount,
} from '../utils/validation';
import { BOARD_WIDTH, BOARD_HEIGHT } from 'shared/constants';

describe('isValidRoomName()', () => {
  it('accepts valid room names', () => {
    expect(isValidRoomName('room1')).toBe(true);
    expect(isValidRoomName('my-room')).toBe(true);
    expect(isValidRoomName('My_Room_42')).toBe(true);
    expect(isValidRoomName('a')).toBe(true);
    expect(isValidRoomName('a'.repeat(20))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidRoomName('')).toBe(false);
  });

  it('rejects strings longer than 20 chars', () => {
    expect(isValidRoomName('a'.repeat(21))).toBe(false);
  });

  it('rejects special characters', () => {
    expect(isValidRoomName('room 1')).toBe(false);
    expect(isValidRoomName('room@1')).toBe(false);
    expect(isValidRoomName('room.1')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidRoomName(123)).toBe(false);
    expect(isValidRoomName(null)).toBe(false);
    expect(isValidRoomName(undefined)).toBe(false);
    expect(isValidRoomName({})).toBe(false);
  });
});

describe('isValidPlayerName()', () => {
  it('accepts valid player names', () => {
    expect(isValidPlayerName('Alice')).toBe(true);
    expect(isValidPlayerName('player-1')).toBe(true);
    expect(isValidPlayerName('user_name')).toBe(true);
    expect(isValidPlayerName('a')).toBe(true);
    expect(isValidPlayerName('a'.repeat(15))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidPlayerName('')).toBe(false);
  });

  it('rejects names longer than 15 chars', () => {
    expect(isValidPlayerName('a'.repeat(16))).toBe(false);
  });

  it('rejects special characters', () => {
    expect(isValidPlayerName('alice bob')).toBe(false);
    expect(isValidPlayerName('alice@42')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidPlayerName(42)).toBe(false);
    expect(isValidPlayerName(null)).toBe(false);
    expect(isValidPlayerName(undefined)).toBe(false);
  });
});

describe('isValidSpectrum()', () => {
  const validSpectrum = Array(BOARD_WIDTH).fill(0);

  it('accepts a valid spectrum (10 numbers, each 0)', () => {
    expect(isValidSpectrum(validSpectrum)).toBe(true);
  });

  it('accepts spectrum with max values', () => {
    expect(isValidSpectrum(Array(BOARD_WIDTH).fill(BOARD_HEIGHT))).toBe(true);
  });

  it('accepts mixed values within range', () => {
    const spectrum = [0, 5, 10, 15, 20, 3, 7, 12, 18, 1];
    expect(isValidSpectrum(spectrum)).toBe(true);
  });

  it('rejects array with wrong length', () => {
    expect(isValidSpectrum(Array(9).fill(0))).toBe(false);
    expect(isValidSpectrum(Array(11).fill(0))).toBe(false);
    expect(isValidSpectrum([])).toBe(false);
  });

  it('rejects values out of range', () => {
    const tooLow = [...validSpectrum];
    tooLow[0] = -1;
    expect(isValidSpectrum(tooLow)).toBe(false);

    const tooHigh = [...validSpectrum];
    tooHigh[0] = BOARD_HEIGHT + 1;
    expect(isValidSpectrum(tooHigh)).toBe(false);
  });

  it('rejects non-number elements', () => {
    const withString = [...validSpectrum];
    (withString as unknown[])[0] = '0';
    expect(isValidSpectrum(withString)).toBe(false);
  });

  it('rejects non-array values', () => {
    expect(isValidSpectrum('spectrum')).toBe(false);
    expect(isValidSpectrum(null)).toBe(false);
    expect(isValidSpectrum(42)).toBe(false);
    expect(isValidSpectrum({})).toBe(false);
  });
});

describe('isValidLineCount()', () => {
  it('accepts 1 through 4', () => {
    expect(isValidLineCount(1)).toBe(true);
    expect(isValidLineCount(2)).toBe(true);
    expect(isValidLineCount(3)).toBe(true);
    expect(isValidLineCount(4)).toBe(true);
  });

  it('rejects 0', () => {
    expect(isValidLineCount(0)).toBe(false);
  });

  it('rejects 5 and above', () => {
    expect(isValidLineCount(5)).toBe(false);
    expect(isValidLineCount(100)).toBe(false);
  });

  it('rejects float values', () => {
    expect(isValidLineCount(1.5)).toBe(false);
    expect(isValidLineCount(2.0001)).toBe(false);
  });

  it('rejects negative numbers', () => {
    expect(isValidLineCount(-1)).toBe(false);
  });

  it('rejects non-number values', () => {
    expect(isValidLineCount('2')).toBe(false);
    expect(isValidLineCount(null)).toBe(false);
    expect(isValidLineCount(undefined)).toBe(false);
    expect(isValidLineCount([2])).toBe(false);
  });
});

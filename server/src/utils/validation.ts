import { BOARD_HEIGHT, BOARD_WIDTH } from 'shared/constants';

const VALID_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Room name: 1–20 chars, alphanumeric + hyphens + underscores.
 */
export const isValidRoomName = (name: unknown): name is string =>
  typeof name === 'string' &&
  name.length >= 1 &&
  name.length <= 20 &&
  VALID_NAME_REGEX.test(name);

/**
 * Player name: 1–15 chars, alphanumeric + hyphens + underscores.
 */
export const isValidPlayerName = (name: unknown): name is string =>
  typeof name === 'string' &&
  name.length >= 1 &&
  name.length <= 15 &&
  VALID_NAME_REGEX.test(name);

/**
 * Spectrum: array of exactly BOARD_WIDTH numbers, each 0–BOARD_HEIGHT.
 */
export const isValidSpectrum = (s: unknown): s is number[] =>
  Array.isArray(s) &&
  s.length === BOARD_WIDTH &&
  s.every(v => typeof v === 'number' && v >= 0 && v <= BOARD_HEIGHT);

/**
 * Lines cleared count: integer between 1 and 4 inclusive.
 */
export const isValidLineCount = (n: unknown): n is number =>
  typeof n === 'number' &&
  Number.isInteger(n) &&
  n >= 1 &&
  n <= 4;

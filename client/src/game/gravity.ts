import { GRAVITY_INTERVAL_MS } from 'shared/constants';

// Returns drop interval in ms — decreases with level for bonus mode
export const getGravityInterval = (level: number = 0): number => {
  const minInterval = 100;
  return Math.max(minInterval, GRAVITY_INTERVAL_MS - level * 50);
};

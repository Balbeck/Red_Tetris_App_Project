'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import {
  applyMoveLeft,
  applyMoveRight,
  applyRotate,
  applyMoveDown,
  applyHardDrop,
  lockPiece,
} from '@/store/slices/gameSlice';
import { shouldLockPiece } from '@/game/movement';

const KEY_REPEAT_DELAY = 150; // ms before key repeat starts
const KEY_REPEAT_INTERVAL = 50; // ms between repeats

export const useKeyboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector((s: RootState) => s.game.status);
  const activePiece = useSelector((s: RootState) => s.game.activePiece);
  const board = useSelector((s: RootState) => s.game.board);
  const heldKeys = useRef<Set<string>>(new Set());
  const repeatTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (status !== 'playing') return;

    const handleAction = (key: string) => {
      switch (key) {
        case 'ArrowLeft':  dispatch(applyMoveLeft());  break;
        case 'ArrowRight': dispatch(applyMoveRight()); break;
        case 'ArrowUp':    dispatch(applyRotate());    break;
        case 'ArrowDown':  dispatch(applyMoveDown());  break;
        case ' ':
          dispatch(applyHardDrop());
          // Hard drop → lock immediately
          setTimeout(() => dispatch(lockPiece()), 0);
          break;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!activePiece) return;

      const key = e.key;
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(key)) return;

      e.preventDefault();

      if (heldKeys.current.has(key)) return; // already handling
      heldKeys.current.add(key);

      handleAction(key);

      // Key repeat for left/right/down
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(key)) {
        const timer = setTimeout(() => {
          const repeat = setInterval(() => {
            if (!heldKeys.current.has(key)) {
              clearInterval(repeat);
              return;
            }
            handleAction(key);
          }, KEY_REPEAT_INTERVAL);
          repeatTimers.current.set(key + '_repeat', repeat as unknown as ReturnType<typeof setTimeout>);
        }, KEY_REPEAT_DELAY);
        repeatTimers.current.set(key, timer);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      heldKeys.current.delete(key);

      const timer = repeatTimers.current.get(key);
      if (timer) { clearTimeout(timer); repeatTimers.current.delete(key); }
      const repeat = repeatTimers.current.get(key + '_repeat');
      if (repeat) { clearInterval(repeat); repeatTimers.current.delete(key + '_repeat'); }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      heldKeys.current.clear();
      repeatTimers.current.forEach(t => clearTimeout(t));
      repeatTimers.current.clear();
    };
  }, [status, activePiece, board, dispatch]);
};

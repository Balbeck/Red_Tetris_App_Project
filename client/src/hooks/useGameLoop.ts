'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { applyMoveDown, lockPiece } from '@/store/slices/gameSlice';
import { shouldLockPiece } from '@/game/movement';
import { getGravityInterval } from '@/game/gravity';

export const useGameLoop = () => {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector((s: RootState) => s.game.status);
  const activePiece = useSelector((s: RootState) => s.game.activePiece);
  const board = useSelector((s: RootState) => s.game.board);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== 'playing' || !activePiece) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      // Check if piece should lock before moving down
      if (shouldLockPiece(board as number[][], activePiece)) {
        // Grace period: allow one more input, then lock
        if (!lockDelayRef.current) {
          lockDelayRef.current = setTimeout(() => {
            dispatch(lockPiece());
            lockDelayRef.current = null;
          }, 300);
        }
        return;
      }
      // Clear any pending lock delay if piece can still move
      if (lockDelayRef.current) {
        clearTimeout(lockDelayRef.current);
        lockDelayRef.current = null;
      }
      dispatch(applyMoveDown());
    };

    intervalRef.current = setInterval(tick, getGravityInterval(0));

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (lockDelayRef.current) clearTimeout(lockDelayRef.current);
    };
  }, [status, activePiece, board, dispatch]);
};

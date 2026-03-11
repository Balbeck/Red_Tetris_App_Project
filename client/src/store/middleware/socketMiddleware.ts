import { Middleware } from '@reduxjs/toolkit';
import { getSocket } from '@/socket/socket';
import { Events } from '@/socket/events';
import { IRoomState } from 'shared/types';
import {
  setRoomState, playerJoined, playerLeft, hostChanged,
  gameStarted, gameEnded, updateSpectrum, playerEliminated,
} from '@/store/slices/roomSlice';
import {
  setPiece, setNextPiece, addPenaltyLinesAction, setGameStatus, lockPiece,
} from '@/store/slices/gameSlice';
import { setConnected, addNotification } from '@/store/slices/uiSlice';
import type { RootState } from '@/store';

let initialized = false;

export const socketMiddleware: Middleware = (storeAPI) => {
  // Guard: only initialize on client side, only once
  if (typeof window !== 'undefined' && !initialized) {
    initialized = true;
    const socket = getSocket();

    socket.on('connect', () => storeAPI.dispatch(setConnected(true)));
    socket.on('disconnect', () => storeAPI.dispatch(setConnected(false)));

    socket.on(Events.ROOM_STATE, (data: IRoomState) =>
      storeAPI.dispatch(setRoomState(data))
    );

    socket.on(Events.PLAYER_JOINED, (data: { playerName: string }) =>
      storeAPI.dispatch(playerJoined(data))
    );

    socket.on(Events.PLAYER_LEFT, (data: { playerName: string }) =>
      storeAPI.dispatch(playerLeft(data))
    );

    socket.on(Events.HOST_CHANGED, (data: { newHost: string }) =>
      storeAPI.dispatch(hostChanged(data))
    );

    socket.on(Events.GAME_STARTED, () => {
      storeAPI.dispatch(gameStarted());
      storeAPI.dispatch(setGameStatus('playing'));
      const state = storeAPI.getState() as RootState;
      const room = state.room.roomName;
      // Request first 2 pieces: first → activePiece, second → nextPiece
      socket.emit(Events.REQUEST_PIECE, { room });
      socket.emit(Events.REQUEST_PIECE, { room });
    });

    socket.on(Events.NEW_PIECE, (data: { piece: unknown }) => {
      const state = storeAPI.getState() as RootState;
      if (state.game.activePiece === null) {
        storeAPI.dispatch(setPiece(data.piece as ReturnType<typeof setPiece>['payload']));
      } else {
        storeAPI.dispatch(setNextPiece(data.piece as ReturnType<typeof setNextPiece>['payload']));
      }
    });

    socket.on(Events.SPECTRUM_UPDATE, (data: { playerName: string; spectrum: number[] }) =>
      storeAPI.dispatch(updateSpectrum(data))
    );

    socket.on(Events.PENALTY_LINES, (data: { count: number }) =>
      storeAPI.dispatch(addPenaltyLinesAction(data.count))
    );

    socket.on(Events.PLAYER_ELIMINATED, (data: { playerName: string }) =>
      storeAPI.dispatch(playerEliminated(data))
    );

    socket.on(Events.GAME_OVER, (data: { winner: string | null }) => {
      storeAPI.dispatch(gameEnded(data.winner));
      const state = storeAPI.getState() as RootState;
      const isWinner = data.winner === state.room.playerName;
      storeAPI.dispatch(setGameStatus(isWinner ? 'won' : 'lost'));
    });

    socket.on(Events.ERROR, (data: { message: string }) =>
      storeAPI.dispatch(addNotification({ message: data.message, type: 'error' }))
    );
  }

  return (next) => (action) => {
    const result = next(action);

    if (typeof window === 'undefined') return result;

    const socket = getSocket();
    const state = storeAPI.getState() as RootState;
    const { roomName } = state.room;

    // After lockPiece: emit socket events based on resulting state
    if (lockPiece.match(action as { type: string })) {
      const { linesCleared, spectrum, status } = state.game;

      if (status === 'lost') {
        socket.emit(Events.GAME_OVER_PLAYER, { room: roomName });
      } else {
        socket.emit(Events.REQUEST_PIECE, { room: roomName });
        socket.emit(Events.UPDATE_SPECTRUM, { room: roomName, spectrum });
        if (linesCleared > 0) {
          socket.emit(Events.LINES_CLEARED, { room: roomName, count: linesCleared });
        }
      }
    }

    return result;
  };
};

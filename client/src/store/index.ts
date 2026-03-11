import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import roomReducer from './slices/roomSlice';
import uiReducer from './slices/uiSlice';
import { socketMiddleware } from './middleware/socketMiddleware';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    room: roomReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable socket refs
        ignoredActions: ['game/lockPiece'],
      },
    }).concat(socketMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

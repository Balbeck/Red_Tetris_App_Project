import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IPlayerInfo, IRoomState } from 'shared/types';

type RoomGameStatus = 'waiting' | 'playing' | 'ended';

interface RoomState {
  roomName: string;
  playerName: string;
  players: IPlayerInfo[];
  isHost: boolean;
  spectrums: Record<string, number[]>;
  gameStatus: RoomGameStatus;
  winner: string | null;
}

const initialState: RoomState = {
  roomName: '',
  playerName: '',
  players: [],
  isHost: false,
  spectrums: {},
  gameStatus: 'waiting',
  winner: null,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setPlayerIdentity: (state, action: PayloadAction<{ roomName: string; playerName: string }>) => {
      state.roomName = action.payload.roomName;
      state.playerName = action.payload.playerName;
    },

    setRoomState: (state, action: PayloadAction<IRoomState>) => {
      state.players = action.payload.players;
      state.gameStatus = action.payload.status;
      state.isHost = action.payload.isHost;
    },

    playerJoined: (state, action: PayloadAction<{ playerName: string }>) => {
      const exists = state.players.some(p => p.name === action.payload.playerName);
      if (!exists) {
        state.players.push({ name: action.payload.playerName, isAlive: true, isHost: false });
      }
    },

    playerLeft: (state, action: PayloadAction<{ playerName: string }>) => {
      state.players = state.players.filter(p => p.name !== action.payload.playerName);
      delete state.spectrums[action.payload.playerName];
    },

    hostChanged: (state, action: PayloadAction<{ newHost: string }>) => {
      state.players = state.players.map(p => ({
        ...p,
        isHost: p.name === action.payload.newHost,
      }));
      state.isHost = action.payload.newHost === state.playerName;
    },

    gameStarted: (state) => {
      state.gameStatus = 'playing';
      state.winner = null;
      state.players = state.players.map(p => ({ ...p, isAlive: true }));
    },

    gameEnded: (state, action: PayloadAction<string | null>) => {
      state.gameStatus = 'ended';
      state.winner = action.payload;
    },

    updateSpectrum: (
      state,
      action: PayloadAction<{ playerName: string; spectrum: number[] }>
    ) => {
      state.spectrums[action.payload.playerName] = action.payload.spectrum;
    },

    playerEliminated: (state, action: PayloadAction<{ playerName: string }>) => {
      state.players = state.players.map(p =>
        p.name === action.payload.playerName ? { ...p, isAlive: false } : p
      );
    },

    resetRoom: () => initialState,
  },
});

export const {
  setPlayerIdentity,
  setRoomState,
  playerJoined,
  playerLeft,
  hostChanged,
  gameStarted,
  gameEnded,
  updateSpectrum,
  playerEliminated,
  resetRoom,
} = roomSlice.actions;

export default roomSlice.reducer;

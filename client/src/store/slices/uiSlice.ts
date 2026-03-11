import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success';
}

interface UiState {
  isConnected: boolean;
  notifications: Notification[];
}

const initialState: UiState = {
  isConnected: false,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },

    addNotification: (
      state,
      action: PayloadAction<{ message: string; type: Notification['type'] }>
    ) => {
      const id = Date.now().toString();
      state.notifications.push({ id, ...action.payload });
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  setConnected,
  addNotification,
  removeNotification,
  clearNotifications,
} = uiSlice.actions;

export default uiSlice.reducer;

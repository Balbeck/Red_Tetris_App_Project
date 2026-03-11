'use client';

import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SERVER_URL) ||
  'http://localhost:3000';

// Singleton — created once, never re-created
let _socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!_socket) {
    _socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return _socket;
};

// Named export for direct use
export const socket = (() => {
  if (typeof window === 'undefined') {
    // SSR guard — return a no-op proxy during server render
    return null as unknown as Socket;
  }
  return getSocket();
})();

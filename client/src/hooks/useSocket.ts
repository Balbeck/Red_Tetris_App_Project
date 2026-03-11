'use client';

import { useEffect } from 'react';
import { getSocket } from '@/socket/socket';

export const useSocket = (shouldConnect: boolean = true) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const socket = getSocket();

    if (shouldConnect && !socket.connected) {
      socket.connect();
    }

    return () => {
      if (socket.connected && shouldConnect) {
        socket.disconnect();
      }
    };
  }, [shouldConnect]);

  return typeof window !== 'undefined' ? getSocket() : null;
};

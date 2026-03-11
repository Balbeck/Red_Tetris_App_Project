'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { setPlayerIdentity, resetRoom } from '@/store/slices/roomSlice';
import { resetGame } from '@/store/slices/gameSlice';
import { useSocket } from '@/hooks/useSocket';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { getSocket } from '@/socket/socket';
import { Events } from '@/socket/events';

import Layout_Lobby from '@/components/LobbyComponents/Layout_Lobby';
import Lobby_Component from '@/components/LobbyComponents/Lobby_Component';
import GameBoard_Component from '@/components/GameBoardComponents/GameBoard_Component';
import NextPiece_Component from '@/components/NextPieceComponents/NextPiece_Component';
import Spectrum_Component from '@/components/SpectrumComponents/Spectrum_Component';
import GameInfo_Component from '@/components/GameInfoComponents/GameInfo_Component';
import GameOverlay_Component from '@/components/GameOverlayComponents/GameOverlay_Component';

interface GamePageProps {
  params: { room: string; player: string };
}

// ── Game screen layout ─────────────────────────────────────────────────────
const GameScreen = () => {
  useGameLoop();
  useKeyboard();

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      {/* 3-column layout: Info | Board | Panels */}
      <div
        className="relative z-10 flex gap-4 items-start w-full"
        style={{ maxWidth: '900px', maxHeight: '95vh' }}
      >
        {/* Left: Game info */}
        <div className="flex-shrink-0 w-40">
          <GameInfo_Component />
        </div>

        {/* Center: Game board */}
        <div className="relative flex-1" style={{ maxWidth: '320px' }}>
          <GameBoard_Component />
          <GameOverlay_Component />
        </div>

        {/* Right: Next piece + Spectrums */}
        <div className="flex-shrink-0 w-40 flex flex-col gap-4">
          <NextPiece_Component />
          <Spectrum_Component />
        </div>
      </div>
    </div>
  );
};

// ── Page entry point ───────────────────────────────────────────────────────
export default function GamePage({ params }: GamePageProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const gameStatus = useSelector((s: RootState) => s.room.gameStatus);
  const currentRoomName = useSelector((s: RootState) => s.room.roomName);

  const { room, player } = params;

  // Socket connection
  useSocket(true);

  useEffect(() => {
    // Validate params
    const validName = /^[a-zA-Z0-9_-]{1,20}$/;
    if (!validName.test(room) || !validName.test(player)) {
      router.replace('/');
      return;
    }

    // Reset state for new session
    dispatch(resetGame());
    dispatch(resetRoom());
    dispatch(setPlayerIdentity({ roomName: room, playerName: player }));

    // Give socket a moment to connect before emitting
    const timer = setTimeout(() => {
      const socket = getSocket();
      if (socket.connected) {
        socket.emit(Events.JOIN_ROOM, { room, playerName: player });
      } else {
        // Wait for connection
        socket.once('connect', () => {
          socket.emit(Events.JOIN_ROOM, { room, playerName: player });
        });
        socket.connect();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [room, player, dispatch, router]);

  // Lobby phase
  if (gameStatus === 'waiting') {
    return (
      <Layout_Lobby>
        <Lobby_Component />
      </Layout_Lobby>
    );
  }

  // Game / ended phase
  return <GameScreen />;
}

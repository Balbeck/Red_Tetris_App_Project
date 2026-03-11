'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getSocket } from '@/socket/socket';
import { Events } from '@/socket/events';
import Button_Component from '@/components/SharedComponents/Button_Component';

const GameOverlay_Component = () => {
  const { status } = useSelector((s: RootState) => s.game);
  const { winner, isHost, roomName, playerName, gameStatus } = useSelector((s: RootState) => s.room);

  const isLost = status === 'lost' || status === 'won';
  const isGameEnded = gameStatus === 'ended';

  // Only show when game is over
  if (!isLost && !isGameEnded) return null;

  const isVictory = winner === playerName;
  const isEliminated = status === 'lost';

  const handleRestart = () => {
    const socket = getSocket();
    socket.emit(Events.RESTART_GAME, { room: roomName });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
    >
      <div className="glass-strong rounded-2xl p-10 flex flex-col items-center gap-6 text-center animate-scale-in max-w-sm mx-4">

        {/* Emoji + Title */}
        <div>
          <div className="text-6xl mb-3">
            {isVictory ? '🏆' : isEliminated ? '💀' : '🎮'}
          </div>
          <h2 className={`text-4xl font-black tracking-tight ${
            isVictory ? 'text-yellow-400 title-glow' : 'gradient-text'
          }`}>
            {isVictory ? 'VICTORY!' : isEliminated ? 'GAME OVER' : 'DEFEATED'}
          </h2>
        </div>

        {/* Winner info */}
        {winner && (
          <div className="text-center">
            {isVictory ? (
              <p className="text-white/60">You won the round!</p>
            ) : (
              <div>
                <p className="text-white/40 text-sm mb-1">Winner</p>
                <p className="text-white font-bold text-xl">{winner}</p>
              </div>
            )}
          </div>
        )}

        {!winner && isEliminated && (
          <p className="text-white/40">You were eliminated. Watching the game...</p>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {isHost && isGameEnded && (
            <Button_Component onClick={handleRestart} size="lg" fullWidth>
              🔄 Play Again
            </Button_Component>
          )}
          {!isHost && isGameEnded && (
            <p className="text-white/30 text-sm">Waiting for host to restart...</p>
          )}
          {isEliminated && !isGameEnded && (
            <p className="text-white/30 text-sm italic">Game still in progress...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameOverlay_Component;

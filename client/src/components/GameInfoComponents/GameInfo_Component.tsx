'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const GameInfo_Component = () => {
  const { roomName, playerName, players, isHost } = useSelector((s: RootState) => s.room);
  const { status: gameStatus } = useSelector((s: RootState) => s.game);
  const aliveCount = players.filter(p => p.isAlive).length;
  const totalCount = players.length;

  const statusLabel = {
    idle: 'Starting...',
    playing: 'In Progress',
    lost: 'Eliminated',
    won: 'Victory!',
  }[gameStatus] ?? '';

  const statusColor = {
    idle: 'text-white/50',
    playing: 'text-green-400',
    lost: 'text-red-400',
    won: 'text-yellow-400',
  }[gameStatus] ?? '';

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-4">
      {/* Room */}
      <div>
        <div className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Room</div>
        <div className="text-sm font-semibold text-white truncate">{roomName}</div>
      </div>

      {/* Player */}
      <div>
        <div className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Player</div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white truncate">{playerName}</span>
          {isHost && <span className="text-yellow-400 text-xs" title="Host">👑</span>}
        </div>
      </div>

      {/* Status */}
      <div>
        <div className="text-xs text-white/30 uppercase tracking-widest mb-0.5">Status</div>
        <div className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</div>
      </div>

      {/* Players alive */}
      <div>
        <div className="text-xs text-white/30 uppercase tracking-widest mb-1">Players</div>
        <div className="flex items-center gap-1">
          {players.map(p => (
            <div
              key={p.name}
              title={p.name}
              className={`w-2.5 h-2.5 rounded-full transition-all ${p.isAlive ? 'bg-green-400' : 'bg-red-500/50'}`}
            />
          ))}
        </div>
        <div className="text-xs text-white/40 mt-1">
          {aliveCount}/{totalCount} alive
        </div>
      </div>

      {/* Controls reminder */}
      <div className="border-t border-white/5 pt-3">
        <div className="text-xs text-white/20 uppercase tracking-widest mb-2">Controls</div>
        <div className="flex flex-col gap-1">
          {[['↑', 'Rotate'], ['←→', 'Move'], ['↓', 'Soft drop'], ['Spc', 'Hard drop']].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 font-mono text-xs">{k}</kbd>
              <span className="text-white/25">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameInfo_Component;

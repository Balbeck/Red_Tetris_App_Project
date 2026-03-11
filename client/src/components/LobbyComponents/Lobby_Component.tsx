'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { getSocket } from '@/socket/socket';
import { Events } from '@/socket/events';
import Button_Component from '@/components/SharedComponents/Button_Component';

const PlayerRow = ({ name, isHost, isMe }: { name: string; isHost: boolean; isMe: boolean }) => {
  const initials = name.slice(0, 2).toUpperCase();
  const hue = (name.charCodeAt(0) * 37 + name.charCodeAt(1 % name.length) * 73) % 360;

  return (
    <div className={[
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
      isMe ? 'bg-white/10 border border-white/15' : 'bg-white/5',
    ].join(' ')}>
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: `hsl(${hue}, 60%, 45%)` }}
      >
        {initials}
      </div>

      {/* Name */}
      <span className={`flex-1 font-medium ${isMe ? 'text-white' : 'text-white/80'}`}>
        {name}
        {isMe && <span className="text-white/40 text-xs ml-1">(you)</span>}
      </span>

      {/* Host crown */}
      {isHost && (
        <span className="text-yellow-400 text-sm" title="Room host">
          👑
        </span>
      )}
    </div>
  );
};

const Lobby_Component = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { players, isHost, roomName, playerName, gameStatus } = useSelector((s: RootState) => s.room);

  const handleStart = () => {
    const socket = getSocket();
    socket.emit(Events.START_GAME, { room: roomName });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Room header */}
      <div className="text-center">
        <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Room</div>
        <h2 className="text-2xl font-bold text-white">{roomName}</h2>
        <div className="text-sm text-white/50 mt-1">
          {players.length} player{players.length !== 1 ? 's' : ''} connected
        </div>
      </div>

      {/* Player list */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {players.map((p) => (
          <PlayerRow
            key={p.name}
            name={p.name}
            isHost={p.isHost}
            isMe={p.name === playerName}
          />
        ))}
      </div>

      {/* Status / Start button */}
      <div className="mt-auto">
        {isHost ? (
          <div className="flex flex-col gap-3">
            <p className="text-center text-white/40 text-sm">
              {players.length === 1
                ? 'You can play solo or wait for others to join'
                : `${players.length} players ready`}
            </p>
            <Button_Component onClick={handleStart} size="lg" fullWidth>
              🎮 Start Game
            </Button_Component>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-purple-400 animate-bounce-slow"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-white/50 text-sm">Waiting for host to start...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby_Component;

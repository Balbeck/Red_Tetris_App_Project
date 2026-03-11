'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setPlayerIdentity } from '@/store/slices/roomSlice';
import { clearNotifications } from '@/store/slices/uiSlice';
import Input_Component from '@/components/SharedComponents/Input_Component';
import Button_Component from '@/components/SharedComponents/Button_Component';

const VALID_NAME = /^[a-zA-Z0-9_-]+$/;

const Home_Component = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((s: RootState) => s.ui.notifications);
  const isConnected = useSelector((s: RootState) => s.ui.isConnected);

  const [roomName, setRoomName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [errors, setErrors] = useState<{ room?: string; player?: string }>({});

  const validate = (): boolean => {
    const newErrors: { room?: string; player?: string } = {};
    if (!roomName.trim()) newErrors.room = 'Room name is required';
    else if (!VALID_NAME.test(roomName)) newErrors.room = 'Letters, numbers, - and _ only';
    else if (roomName.length > 20) newErrors.room = 'Max 20 characters';

    if (!playerName.trim()) newErrors.player = 'Player name is required';
    else if (!VALID_NAME.test(playerName)) newErrors.player = 'Letters, numbers, - and _ only';
    else if (playerName.length > 15) newErrors.player = 'Max 15 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoin = () => {
    if (!validate()) return;
    dispatch(clearNotifications());
    dispatch(setPlayerIdentity({ roomName: roomName.trim(), playerName: playerName.trim() }));
    router.push(`/${encodeURIComponent(roomName.trim())}/${encodeURIComponent(playerName.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleJoin();
  };

  // Show server error notifications inline
  const serverError = notifications.find(n => n.type === 'error');

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Connection indicator */}
      <div className="flex items-center gap-2 justify-center">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
        <span className="text-xs text-white/40">
          {isConnected ? 'Connected to server' : 'Connecting...'}
        </span>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm text-center animate-fade-in">
          {serverError.message}
        </div>
      )}

      <Input_Component
        label="Room"
        value={roomName}
        onChange={setRoomName}
        placeholder="my-room"
        error={errors.room}
        maxLength={20}
        autoFocus
        onKeyDown={handleKeyDown}
      />

      <Input_Component
        label="Player Name"
        value={playerName}
        onChange={setPlayerName}
        placeholder="your-name"
        error={errors.player}
        maxLength={15}
        onKeyDown={handleKeyDown}
      />

      <Button_Component onClick={handleJoin} size="lg" fullWidth>
        Join Game →
      </Button_Component>

      {/* Controls hint */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {[
          ['←→', 'Move'],
          ['↑', 'Rotate'],
          ['↓', 'Soft drop'],
          ['Space', 'Hard drop'],
        ].map(([key, action]) => (
          <div key={key} className="flex items-center gap-2 text-xs text-white/30">
            <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/50 font-mono">
              {key}
            </kbd>
            <span>{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home_Component;

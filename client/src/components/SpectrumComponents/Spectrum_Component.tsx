'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { BOARD_HEIGHT } from 'shared/constants';

interface SpectrumBarProps {
  playerName: string;
  spectrum: number[];
  isAlive: boolean;
}

const SpectrumBar = ({ playerName, spectrum, isAlive }: SpectrumBarProps) => (
  <div className={`flex flex-col gap-1.5 items-center ${isAlive ? '' : 'opacity-40'}`}>
    {/* Mini board — 10 columns */}
    <div
      className="rounded overflow-hidden border border-white/10"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(10, 1fr)',
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
        width: '60px',
        aspectRatio: `10 / ${BOARD_HEIGHT}`,
        gap: '1px',
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      {Array.from({ length: BOARD_HEIGHT }, (_, row) =>
        Array.from({ length: 10 }, (__, col) => {
          const colHeight = spectrum[col] ?? 0;
          const isFilled = row >= BOARD_HEIGHT - colHeight;
          return (
            <div
              key={`${row}-${col}`}
              style={{
                backgroundColor: isFilled
                  ? isAlive ? '#a855f7' : '#6b7280'
                  : 'rgba(255,255,255,0.02)',
              }}
            />
          );
        })
      )}
    </div>
    {/* Player name */}
    <div className="text-center">
      <span className={`text-xs font-medium truncate block max-w-[60px] ${isAlive ? 'text-white/70' : 'text-white/30 line-through'}`}>
        {playerName}
      </span>
      {!isAlive && (
        <span className="text-xs text-red-400">✕</span>
      )}
    </div>
  </div>
);

const Spectrum_Component = () => {
  const { spectrums, players, playerName } = useSelector((s: RootState) => s.room);

  // Show only opponents
  const opponents = players.filter(p => p.name !== playerName);

  if (opponents.length === 0) {
    return (
      <div className="glass rounded-xl p-4 text-center">
        <div className="text-xs text-white/30 uppercase tracking-widest mb-2">Opponents</div>
        <div className="text-xs text-white/20 italic">None yet</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3">
      <div className="text-xs font-semibold text-white/40 uppercase tracking-widest text-center">
        Opponents
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {opponents.map(p => (
          <SpectrumBar
            key={p.name}
            playerName={p.name}
            spectrum={spectrums[p.name] ?? Array(10).fill(0)}
            isAlive={p.isAlive}
          />
        ))}
      </div>
    </div>
  );
};

export default Spectrum_Component;

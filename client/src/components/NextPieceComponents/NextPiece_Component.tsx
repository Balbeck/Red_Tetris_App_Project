'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getPieceShape, PIECE_COLORS, PIECE_TYPE_TO_VALUE } from '@/game/pieces';

const NextPiece_Component = () => {
  const nextPiece = useSelector((s: RootState) => s.game.nextPiece);

  const renderGrid = () => {
    if (!nextPiece) {
      return Array(16).fill(0).map((_, i) => (
        <div key={i} className="cell border border-white/[0.03]" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }} />
      ));
    }

    const shape = getPieceShape(nextPiece.type, 0);
    const value = PIECE_TYPE_TO_VALUE[nextPiece.type];
    const color = PIECE_COLORS[value];

    return shape.flat().map((cell, i) => {
      const isActive = cell !== 0;
      return (
        <div
          key={i}
          className="cell border border-white/[0.03]"
          style={{
            backgroundColor: isActive ? color.bg : 'rgba(255,255,255,0.02)',
            boxShadow: isActive && color.glow
              ? `0 0 5px ${color.glow}`
              : undefined,
          }}
        />
      );
    });
  };

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3">
      <div className="text-xs font-semibold text-white/40 uppercase tracking-widest text-center">
        Next
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(4, 1fr)',
          gap: '2px',
          aspectRatio: '1/1',
        }}
      >
        {renderGrid()}
      </div>
    </div>
  );
};

export default NextPiece_Component;

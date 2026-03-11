'use client';

import { PIECE_COLORS } from '@/game/pieces';

interface CellProps {
  value: number;
  size?: number; // px
}

const Cell_Component = ({ value, size }: CellProps) => {
  const color = PIECE_COLORS[value] ?? PIECE_COLORS[0];

  const style: React.CSSProperties = {
    backgroundColor: color.bg,
    boxShadow: color.glow ? `0 0 6px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` : undefined,
    ...(size ? { width: size, height: size } : {}),
  };

  return (
    <div
      className="cell border border-white/[0.05]"
      style={style}
    />
  );
};

export default Cell_Component;

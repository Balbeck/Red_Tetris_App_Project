'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { mergePiece } from '@/game/board';
import { getGhostPosition } from '@/game/movement';
import { getPieceShape, PIECE_TYPE_TO_VALUE } from '@/game/pieces';
import { BOARD_WIDTH, BOARD_HEIGHT } from 'shared/constants';
import Cell_Component from '@/components/CellComponents/Cell_Component';
import { BoardType } from 'shared/types';

const GameBoard_Component = () => {
  const board = useSelector((s: RootState) => s.game.board) as BoardType;
  const activePiece = useSelector((s: RootState) => s.game.activePiece);

  // Merge active piece for display (pure — does not touch Redux)
  let displayBoard = activePiece ? mergePiece(board, activePiece) : board.map(r => [...r]);

  // Render ghost piece (value 9)
  if (activePiece) {
    const ghost = getGhostPosition(board, activePiece);
    if (ghost.position.y !== activePiece.position.y) {
      const shape = getPieceShape(ghost.type, ghost.rotation);
      displayBoard = displayBoard.map(r => [...r]);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          if (shape[row][col] === 0) continue;
          const bY = ghost.position.y + row;
          const bX = ghost.position.x + col;
          if (bY >= 0 && bY < BOARD_HEIGHT && bX >= 0 && bX < BOARD_WIDTH) {
            if (displayBoard[bY][bX] === 0) displayBoard[bY][bX] = 9; // ghost
          }
        }
      }
    }
  }

  return (
    <div
      className="board-bg rounded-lg overflow-hidden border border-white/10 shadow-2xl"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
        aspectRatio: `${BOARD_WIDTH} / ${BOARD_HEIGHT}`,
        width: '100%',
        gap: '1px',
        background: 'rgba(0,0,0,0.6)',
      }}
    >
      {displayBoard.flat().map((value, idx) => (
        <Cell_Component key={idx} value={value} />
      ))}
    </div>
  );
};

export default GameBoard_Component;

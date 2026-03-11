'use client';

import React from 'react';

// Floating tetromino shapes for background decoration
const FloatingShape = ({
  color,
  style,
}: {
  color: string;
  style: React.CSSProperties;
}) => (
  <div
    className="absolute opacity-10 float-shape pointer-events-none"
    style={style}
  >
    <svg width="60" height="60" viewBox="0 0 60 60" fill={color}>
      <rect x="0" y="20" width="20" height="20" rx="3" />
      <rect x="20" y="20" width="20" height="20" rx="3" />
      <rect x="40" y="20" width="20" height="20" rx="3" />
      <rect x="20" y="0" width="20" height="20" rx="3" />
    </svg>
  </div>
);

const Layout_Home = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">

    {/* Ambient glow blobs */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
    </div>

    {/* Floating tetrominos */}
    <FloatingShape color="#22d3ee" style={{ top: '10%', left: '5%', animationDelay: '0s' }} />
    <FloatingShape color="#a855f7" style={{ top: '20%', right: '8%', animationDelay: '-2s', transform: 'rotate(45deg)' }} />
    <FloatingShape color="#f97316" style={{ bottom: '15%', left: '10%', animationDelay: '-4s', transform: 'rotate(-30deg)' }} />
    <FloatingShape color="#4ade80" style={{ bottom: '25%', right: '5%', animationDelay: '-1s', transform: 'rotate(20deg)' }} />

    {/* Main card */}
    <div className="relative z-10 w-full max-w-md animate-scale-in">
      {/* Logo / Title */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-black tracking-tight gradient-text title-glow mb-2">
          RED TETRIS
        </h1>
        <p className="text-white/40 text-sm tracking-widest uppercase">
          Multiplayer · Real-time · Competitive
        </p>
      </div>

      {/* Glass card */}
      <div className="glass-strong rounded-2xl p-8 shadow-2xl">
        {children}
      </div>

      {/* Footer hint */}
      <p className="text-center text-white/20 text-xs mt-6">
        42 School Project — Red Tetris
      </p>
    </div>
  </div>
);

export default Layout_Home;

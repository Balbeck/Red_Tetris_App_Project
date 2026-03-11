'use client';

import React from 'react';

const Layout_Lobby = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4">
    {/* Ambient glows */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-purple-700/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl" />
    </div>

    <div className="relative z-10 w-full max-w-md animate-scale-in">
      {/* Title */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-black gradient-text title-glow">RED TETRIS</h1>
        <div className="text-white/30 text-xs uppercase tracking-widest mt-1">Lobby</div>
      </div>

      {/* Glass panel */}
      <div className="glass-strong rounded-2xl p-6 shadow-2xl" style={{ minHeight: '420px' }}>
        {children}
      </div>
    </div>
  </div>
);

export default Layout_Lobby;

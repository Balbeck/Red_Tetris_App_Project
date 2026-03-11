'use client';

import React from 'react';

const Layout_GameBoard = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-full">
    <div style={{ height: '100%', maxHeight: '100%', aspectRatio: '1/2' }}>
      {children}
    </div>
  </div>
);

export default Layout_GameBoard;

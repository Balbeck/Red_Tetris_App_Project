import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { Server } from 'socket.io';
import GameManager from './managers/GameManager';
import registerEvents from './socket/registerEvents';
import { SocketWithData } from './types';

// ─── Configuration ────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3001';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// ─── Express + HTTP ───────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: NODE_ENV,
    rooms: gameManager.getActiveGamesCount(),
    uptime: Math.floor(process.uptime()),
  });
});

// Serve Next.js static export (only if `client/out/` exists — production mode)
const CLIENT_STATIC_PATH = path.resolve(__dirname, '../../client/out');
if (fs.existsSync(CLIENT_STATIC_PATH)) {
  console.log(`[Server] Serving static client from: ${CLIENT_STATIC_PATH}`);
  app.use(express.static(CLIENT_STATIC_PATH));
  // Catch-all → SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_STATIC_PATH, 'index.html'));
  });
} else {
  console.log(`[Server] Static client not found — run "npm run build" in client/ for production`);
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 10000,
  pingInterval: 5000,
});

// ─── Game Manager (singleton) ────────────────────────────────────────────────

const gameManager = new GameManager();

// ─── Socket.IO Connection Handler ────────────────────────────────────────────

io.on('connection', (socket) => {
  registerEvents(socket as SocketWithData, gameManager);
});

// ─── Start Server ─────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  ██████╗ ███████╗██████╗     ████████╗███████╗████████╗██████╗ ██╗███████╗');
  console.log('  ██╔══██╗██╔════╝██╔══██╗    ╚══██╔══╝██╔════╝╚══██╔══╝██╔══██╗██║██╔════╝');
  console.log('  ██████╔╝█████╗  ██║  ██║       ██║   █████╗     ██║   ██████╔╝██║███████╗');
  console.log('  ██╔══██╗██╔══╝  ██║  ██║       ██║   ██╔══╝     ██║   ██╔══██╗██║╚════██║');
  console.log('  ██║  ██║███████╗██████╔╝       ██║   ███████╗   ██║   ██║  ██║██║███████║');
  console.log('  ╚═╝  ╚═╝╚══════╝╚═════╝        ╚═╝   ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝╚══════╝');
  console.log('');
  console.log(`  🚀 Server running on http://localhost:${PORT}`);
  console.log(`  🎮 Frontend expected at ${CLIENT_URL}`);
  console.log(`  🌍 Environment: ${NODE_ENV}`);
  console.log('');
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

const shutdown = (): void => {
  console.log('\n[Server] Shutting down gracefully...');
  io.close();
  httpServer.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

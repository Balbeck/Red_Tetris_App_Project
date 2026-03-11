"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
exports.Events = {
    // Client → Server
    JOIN_ROOM: 'JOIN_ROOM',
    START_GAME: 'START_GAME',
    REQUEST_PIECE: 'REQUEST_PIECE',
    UPDATE_SPECTRUM: 'UPDATE_SPECTRUM',
    LINES_CLEARED: 'LINES_CLEARED',
    GAME_OVER_PLAYER: 'GAME_OVER_PLAYER',
    RESTART_GAME: 'RESTART_GAME',
    // Server → Client
    ROOM_STATE: 'ROOM_STATE',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    HOST_CHANGED: 'HOST_CHANGED',
    GAME_STARTED: 'GAME_STARTED',
    NEW_PIECE: 'NEW_PIECE',
    SPECTRUM_UPDATE: 'SPECTRUM_UPDATE',
    PENALTY_LINES: 'PENALTY_LINES',
    PLAYER_ELIMINATED: 'PLAYER_ELIMINATED',
    GAME_OVER: 'GAME_OVER',
    ERROR: 'ERROR',
};
//# sourceMappingURL=events.js.map
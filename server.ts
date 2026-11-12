import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket, WebSocketServer } from 'ws';
import {
  createInitialMatch,
  emptyInput,
  stepMatch,
} from './src/shared/combatEngine.ts';
import {
  ClientWsMessage,
  FighterId,
  FighterInput,
  MatchState,
  RoomPlayerSummary,
  ServerWsMessage,
} from './src/shared/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface RoomPlayer {
  slot: 0 | 1;
  token: string;
  fighterId: FighterId;
  ready: boolean;
  connected: boolean;
  ws: WebSocket | null;
  latestInput: FighterInput;
  edgeFlags: {
    punch: boolean;
    heavyPunch: boolean;
    kick: boolean;
    highKick: boolean;
    dodge: boolean;
    takedown: boolean;
    clinch: boolean;
  };
  disconnectTimer: NodeJS.Timeout | null;
}

interface GameRoom {
  code: string;
  status: 'waiting' | 'countdown' | 'fighting' | 'finished';
  players: [RoomPlayer | null, RoomPlayer | null];
  match: MatchState | null;
  lastTickMs: number;
  loopTimer: NodeJS.Timeout | null;
  createdAt: number;
}

const rooms = new Map<string, GameRoom>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function generateToken(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

function sendMsg(ws: WebSocket | null, msg: ServerWsMessage): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function getRoomSummaries(room: GameRoom): RoomPlayerSummary[] {
  const list: RoomPlayerSummary[] = [];
  for (const p of room.players) {
    if (p) {
      list.push({
        slot: p.slot,
        fighterId: p.fighterId,
        ready: p.ready,
        connected: p.connected,
      });
    }
  }
  return list;
}

function broadcastRoomUpdate(room: GameRoom): void {
  const msg: ServerWsMessage = {
    type: 'room_update',
    code: room.code,
    players: getRoomSummaries(room),
    status: room.status,
  };
  for (const p of room.players) {
    if (p) sendMsg(p.ws, msg);
  }
}

function broadcastMatchState(room: GameRoom): void {
  if (!room.match) return;
  const msg: ServerWsMessage = {
    type: 'match_state',
    state: room.match,
  };
  for (const p of room.players) {
    if (p) sendMsg(p.ws, msg);
  }
}

function createEmptyEdgeFlags() {
  return {
    punch: false,
    heavyPunch: false,
    kick: false,
    highKick: false,
    dodge: false,
    takedown: false,
    clinch: false,
  };
}

function cleanupRoom(code: string): void {
  const room = rooms.get(code);
  if (!room) return;
  if (room.loopTimer) {
    clearInterval(room.loopTimer);
    room.loopTimer = null;
  }
  for (const p of room.players) {
    if (p?.disconnectTimer) clearTimeout(p.disconnectTimer);
  }
  rooms.delete(code);
}

function startRoomMatch(room: GameRoom): void {
  const p0 = room.players[0];
  const p1 = room.players[1];
  if (!p0 || !p1) return;

  if (room.loopTimer) {
    clearInterval(room.loopTimer);
    room.loopTimer = null;
  }

  room.status = 'countdown';
  room.match = createInitialMatch(p0.fighterId, p1.fighterId, true);
  room.lastTickMs = Date.now();
  broadcastRoomUpdate(room);
  broadcastMatchState(room);

  room.loopTimer = setInterval(() => {
    if (!room.match) return;
    const now = Date.now();
    const dt = Math.min(0.05, Math.max(0.01, (now - room.lastTickMs) / 1000));
    room.lastTickMs = now;

    // Pause simulation if either player is temporarily disconnected
    if (!p0.connected || !p1.connected) {
      return;
    }

    const inp0: FighterInput = {
      ...p0.latestInput,
      punch: p0.latestInput.punch || p0.edgeFlags.punch,
      heavyPunch: p0.latestInput.heavyPunch || p0.edgeFlags.heavyPunch,
      kick: p0.latestInput.kick || p0.edgeFlags.kick,
      highKick: p0.latestInput.highKick || p0.edgeFlags.highKick,
      dodge: p0.latestInput.dodge || p0.edgeFlags.dodge,
      takedown: p0.latestInput.takedown || p0.edgeFlags.takedown,
      clinch: p0.latestInput.clinch || p0.edgeFlags.clinch,
    };
    const inp1: FighterInput = {
      ...p1.latestInput,
      punch: p1.latestInput.punch || p1.edgeFlags.punch,
      heavyPunch: p1.latestInput.heavyPunch || p1.edgeFlags.heavyPunch,
      kick: p1.latestInput.kick || p1.edgeFlags.kick,
      highKick: p1.latestInput.highKick || p1.edgeFlags.highKick,
      dodge: p1.latestInput.dodge || p1.edgeFlags.dodge,
      takedown: p1.latestInput.takedown || p1.edgeFlags.takedown,
      clinch: p1.latestInput.clinch || p1.edgeFlags.clinch,
    };

    p0.edgeFlags = createEmptyEdgeFlags();
    p1.edgeFlags = createEmptyEdgeFlags();

    stepMatch(room.match, [inp0, inp1], dt);

    if (room.match.phase === 'fighting' && room.status !== 'fighting') {
      room.status = 'fighting';
      broadcastRoomUpdate(room);
    }

    broadcastMatchState(room);

    if (room.match.phase === 'finished') {
      room.status = 'finished';
      p0.ready = false;
      p1.ready = false;
      broadcastRoomUpdate(room);
      if (room.loopTimer) {
        clearInterval(room.loopTimer);
        room.loopTimer = null;
      }
    }
  }, 33); // ~30Hz authoritative server tick
}

async function bootstrap() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, activeRooms: rooms.size });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let boundRoomCode: string | null = null;
    let boundSlot: 0 | 1 | null = null;

    const detachPlayer = (gracefulLeave: boolean) => {
      if (!boundRoomCode || boundSlot === null) return;
      const room = rooms.get(boundRoomCode);
      if (!room) return;
      const player = room.players[boundSlot];
      if (!player) return;

      if (gracefulLeave) {
        if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
        room.players[boundSlot] = null;
        const other = room.players[boundSlot === 0 ? 1 : 0];
        if (!other) {
          cleanupRoom(room.code);
        } else {
          if (room.status === 'fighting' && room.match && room.match.phase !== 'finished') {
            room.match.phase = 'finished';
            room.match.result = {
              winnerSlot: other.slot,
              winnerId: other.fighterId,
              method: 'ABANDONO',
              round: room.match.round,
              roundTimeElapsed: Math.max(1, Math.round(300 - room.match.roundClock)),
              totalTimeElapsed: Math.max(1, Math.round(300 - room.match.roundClock)),
              roundScores: room.match.roundScores,
            };
            broadcastMatchState(room);
          }
          room.status = 'waiting';
          other.ready = false;
          broadcastRoomUpdate(room);
        }
      } else {
        player.connected = false;
        player.ws = null;
        const other = room.players[boundSlot === 0 ? 1 : 0];
        if (other) {
          sendMsg(other.ws, {
            type: 'player_disconnected',
            slot: boundSlot,
            graceSeconds: 30,
          });
          broadcastRoomUpdate(room);
        }
        player.disconnectTimer = setTimeout(() => {
          const r = rooms.get(room.code);
          if (!r) return;
          const p = r.players[boundSlot!];
          if (p && !p.connected) {
            detachPlayer(true);
          }
        }, 30000);
      }

      boundRoomCode = null;
      boundSlot = null;
    };

    ws.on('message', (raw) => {
      let msg: ClientWsMessage;
      try {
        msg = JSON.parse(String(raw)) as ClientWsMessage;
      } catch {
        return;
      }

      if (msg.type === 'ping') {
        sendMsg(ws, { type: 'pong', ts: msg.ts });
        return;
      }

      if (msg.type === 'create_room') {
        if (boundRoomCode) detachPlayer(true);
        const code = generateRoomCode();
        const token = generateToken();
        const p0: RoomPlayer = {
          slot: 0,
          token,
          fighterId: msg.fighterId,
          ready: false,
          connected: true,
          ws,
          latestInput: emptyInput(),
          edgeFlags: createEmptyEdgeFlags(),
          disconnectTimer: null,
        };
        const room: GameRoom = {
          code,
          status: 'waiting',
          players: [p0, null],
          match: null,
          lastTickMs: Date.now(),
          loopTimer: null,
          createdAt: Date.now(),
        };
        rooms.set(code, room);
        boundRoomCode = code;
        boundSlot = 0;
        sendMsg(ws, {
          type: 'room_joined',
          code,
          slot: 0,
          token,
          players: getRoomSummaries(room),
        });
        broadcastRoomUpdate(room);
        return;
      }

      if (msg.type === 'join_room') {
        const cleanCode = msg.code.trim().toUpperCase();
        const room = rooms.get(cleanCode);
        if (!room) {
          sendMsg(ws, {
            type: 'room_error',
            message: 'Sala não encontrada. Verifique o código de 6 caracteres.',
          });
          return;
        }
        const openSlot: 0 | 1 | null =
          room.players[0] === null ? 0 : room.players[1] === null ? 1 : null;
        if (openSlot === null) {
          sendMsg(ws, {
            type: 'room_error',
            message: 'Esta sala já está lotada (2/2 jogadores).',
          });
          return;
        }
        if (boundRoomCode) detachPlayer(true);
        const token = generateToken();
        const player: RoomPlayer = {
          slot: openSlot,
          token,
          fighterId: msg.fighterId,
          ready: false,
          connected: true,
          ws,
          latestInput: emptyInput(),
          edgeFlags: createEmptyEdgeFlags(),
          disconnectTimer: null,
        };
        room.players[openSlot] = player;
        boundRoomCode = cleanCode;
        boundSlot = openSlot;
        sendMsg(ws, {
          type: 'room_joined',
          code: cleanCode,
          slot: openSlot,
          token,
          players: getRoomSummaries(room),
        });
        broadcastRoomUpdate(room);
        return;
      }

      if (msg.type === 'join_with_password') {
        const cleanPass = msg.password
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9_-]/g, '');
        if (cleanPass.length < 3 || cleanPass.length > 16) {
          sendMsg(ws, {
            type: 'room_error',
            message: 'Digite uma senha entre 3 e 16 letras ou números.',
          });
          return;
        }
        if (boundRoomCode) detachPlayer(true);

        let room = rooms.get(cleanPass);
        if (!room) {
          const token = generateToken();
          const p0: RoomPlayer = {
            slot: 0,
            token,
            fighterId: msg.fighterId,
            ready: true,
            connected: true,
            ws,
            latestInput: emptyInput(),
            edgeFlags: createEmptyEdgeFlags(),
            disconnectTimer: null,
          };
          room = {
            code: cleanPass,
            status: 'waiting',
            players: [p0, null],
            match: null,
            lastTickMs: Date.now(),
            loopTimer: null,
            createdAt: Date.now(),
          };
          rooms.set(cleanPass, room);
          boundRoomCode = cleanPass;
          boundSlot = 0;
          sendMsg(ws, {
            type: 'room_joined',
            code: cleanPass,
            slot: 0,
            token,
            players: getRoomSummaries(room),
          });
          broadcastRoomUpdate(room);
          return;
        }

        const openSlot: 0 | 1 | null =
          room.players[0] === null ? 0 : room.players[1] === null ? 1 : null;
        if (openSlot === null) {
          sendMsg(ws, {
            type: 'room_error',
            message: 'Já existem 2 lutadores nesta senha. Tente outra senha.',
          });
          return;
        }

        const token = generateToken();
        const player: RoomPlayer = {
          slot: openSlot,
          token,
          fighterId: msg.fighterId,
          ready: true,
          connected: true,
          ws,
          latestInput: emptyInput(),
          edgeFlags: createEmptyEdgeFlags(),
          disconnectTimer: null,
        };
        room.players[openSlot] = player;
        boundRoomCode = cleanPass;
        boundSlot = openSlot;
        sendMsg(ws, {
          type: 'room_joined',
          code: cleanPass,
          slot: openSlot,
          token,
          players: getRoomSummaries(room),
        });
        broadcastRoomUpdate(room);

        if (
          room.players[0]?.ready &&
          room.players[1]?.ready &&
          (room.status === 'waiting' || room.status === 'finished')
        ) {
          startRoomMatch(room);
        }
        return;
      }

      if (msg.type === 'reconnect_room') {
        const cleanCode = msg.code.trim().toUpperCase();
        const room = rooms.get(cleanCode);
        if (!room) {
          sendMsg(ws, { type: 'room_error', message: 'Sessão expirada.' });
          return;
        }
        const player = room.players.find((p) => p && p.token === msg.token);
        if (!player) {
          sendMsg(ws, { type: 'room_error', message: 'Token inválido.' });
          return;
        }
        if (player.disconnectTimer) {
          clearTimeout(player.disconnectTimer);
          player.disconnectTimer = null;
        }
        player.connected = true;
        player.ws = ws;
        boundRoomCode = cleanCode;
        boundSlot = player.slot;

        sendMsg(ws, {
          type: 'room_joined',
          code: cleanCode,
          slot: player.slot,
          token: player.token,
          players: getRoomSummaries(room),
        });
        const other = room.players[player.slot === 0 ? 1 : 0];
        if (other) {
          sendMsg(other.ws, { type: 'player_reconnected', slot: player.slot });
        }
        broadcastRoomUpdate(room);
        if (room.match) broadcastMatchState(room);
        return;
      }

      if (!boundRoomCode || boundSlot === null) return;
      const room = rooms.get(boundRoomCode);
      const player = room?.players[boundSlot];
      if (!room || !player) return;

      if (msg.type === 'select_fighter') {
        player.fighterId = msg.fighterId;
        if (room.players[0] && room.players[1]) {
          player.ready = false;
        }
        broadcastRoomUpdate(room);
      } else if (msg.type === 'set_ready') {
        player.ready = msg.ready;
        broadcastRoomUpdate(room);
        if (
          room.players[0]?.ready &&
          room.players[1]?.ready &&
          (room.status === 'waiting' || room.status === 'finished')
        ) {
          startRoomMatch(room);
        }
      } else if (msg.type === 'player_input') {
        player.latestInput = msg.input;
        if (msg.input.punch) player.edgeFlags.punch = true;
        if (msg.input.heavyPunch) player.edgeFlags.heavyPunch = true;
        if (msg.input.kick) player.edgeFlags.kick = true;
        if (msg.input.highKick) player.edgeFlags.highKick = true;
        if (msg.input.dodge) player.edgeFlags.dodge = true;
        if (msg.input.takedown) player.edgeFlags.takedown = true;
        if (msg.input.clinch) player.edgeFlags.clinch = true;
      } else if (msg.type === 'request_rematch') {
        player.ready = true;
        broadcastRoomUpdate(room);
        if (room.players[0]?.ready && room.players[1]?.ready) {
          startRoomMatch(room);
        }
      } else if (msg.type === 'leave_room') {
        detachPlayer(true);
      }
    });

    ws.on('close', () => {
      detachPlayer(false);
    });
  });

  // Periodic stale room garbage collection
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms.entries()) {
      const anyConnected = room.players.some((p) => p?.connected);
      if (!anyConnected && now - room.createdAt > 120000) {
        cleanupRoom(code);
      }
    }
  }, 60000);

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Apex Octagon 3D server listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();

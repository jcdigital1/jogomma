import {
  ClientWsMessage,
  FighterId,
  FighterInput,
  MatchState,
  RoomPlayerSummary,
  ServerWsMessage,
} from '../shared/types.ts';

export interface MultiplayerCallbacks {
  onJoined: (data: {
    code: string;
    slot: 0 | 1;
    token: string;
    players: RoomPlayerSummary[];
  }) => void;
  onRoomUpdate: (data: {
    code: string;
    players: RoomPlayerSummary[];
    status: 'waiting' | 'countdown' | 'fighting' | 'finished';
  }) => void;
  onMatchState: (state: MatchState) => void;
  onOpponentDisconnected: (graceSeconds: number) => void;
  onOpponentReconnected: () => void;
  onError: (message: string) => void;
  onLatency?: (ms: number) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private callbacks: MultiplayerCallbacks;
  private seq = 0;
  private pingTimer: number | null = null;
  private roomCode: string | null = null;
  private sessionToken: string | null = null;
  private manualClose = false;

  constructor(callbacks: MultiplayerCallbacks) {
    this.callbacks = callbacks;
  }

  public connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    this.manualClose = false;
    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.callbacks.onConnectionChange?.(true);
        if (this.pingTimer !== null) clearInterval(this.pingTimer);
        this.pingTimer = window.setInterval(() => {
          this.send({ type: 'ping', ts: Date.now() });
        }, 3000);
        if (this.roomCode && this.sessionToken) {
          this.send({
            type: 'reconnect_room',
            code: this.roomCode,
            token: this.sessionToken,
          });
        }
        resolve();
      };

      ws.onerror = () => {
        this.callbacks.onError('Falha ao conectar ao servidor multiplayer.');
        reject(new Error('WebSocket error'));
      };

      ws.onclose = () => {
        this.callbacks.onConnectionChange?.(false);
        if (this.pingTimer !== null) {
          clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
        if (!this.manualClose && this.roomCode && this.sessionToken) {
          window.setTimeout(() => {
            if (!this.manualClose) this.connect().catch(() => {});
          }, 1500);
        }
      };

      ws.onmessage = (event) => {
        let msg: ServerWsMessage;
        try {
          msg = JSON.parse(String(event.data)) as ServerWsMessage;
        } catch {
          return;
        }

        switch (msg.type) {
          case 'room_joined':
            this.roomCode = msg.code;
            this.sessionToken = msg.token;
            this.callbacks.onJoined({
              code: msg.code,
              slot: msg.slot,
              token: msg.token,
              players: msg.players,
            });
            break;
          case 'room_update':
            this.callbacks.onRoomUpdate({
              code: msg.code,
              players: msg.players,
              status: msg.status,
            });
            break;
          case 'match_state':
            this.callbacks.onMatchState(msg.state);
            break;
          case 'player_disconnected':
            this.callbacks.onOpponentDisconnected(msg.graceSeconds);
            break;
          case 'player_reconnected':
            this.callbacks.onOpponentReconnected();
            break;
          case 'room_error':
            this.callbacks.onError(msg.message);
            break;
          case 'pong':
            this.callbacks.onLatency?.(Math.max(1, Date.now() - msg.ts));
            break;
        }
      };
    });
  }

  private send(msg: ClientWsMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public async createRoom(fighterId: FighterId): Promise<void> {
    await this.connect();
    this.send({ type: 'create_room', fighterId });
  }

  public async joinRoom(code: string, fighterId: FighterId): Promise<void> {
    await this.connect();
    this.send({ type: 'join_room', code, fighterId });
  }

  public selectFighter(fighterId: FighterId): void {
    this.send({ type: 'select_fighter', fighterId });
  }

  public setReady(ready: boolean): void {
    this.send({ type: 'set_ready', ready });
  }

  public sendInput(input: FighterInput): void {
    this.seq += 1;
    this.send({ type: 'player_input', input, seq: this.seq });
  }

  public requestRematch(): void {
    this.send({ type: 'request_rematch' });
  }

  public leaveRoom(): void {
    this.send({ type: 'leave_room' });
    this.roomCode = null;
    this.sessionToken = null;
  }

  public dispose(): void {
    this.manualClose = true;
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.leaveRoom();
    this.ws?.close();
    this.ws = null;
  }
}

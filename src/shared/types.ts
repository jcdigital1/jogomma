export type FighterId = 'jean' | 'charles';

export type GraphicsQuality = 'low' | 'medium' | 'high';
export type AIDifficulty = 'easy' | 'normal' | 'hard';

export type MoveId =
  | 'none'
  | 'jab'
  | 'cross'
  | 'hook'
  | 'uppercut'
  | 'overhand'
  | 'elbow'
  | 'low_kick'
  | 'body_kick'
  | 'high_kick'
  | 'front_kick'
  | 'knee'
  | 'dodge_left'
  | 'dodge_right'
  | 'dodge_back'
  | 'clinch_attempt'
  | 'takedown_attempt'
  | 'gnp_strike'
  | 'submission_attempt'
  | 'stand_up';

export type FighterPosture =
  | 'standing'
  | 'clinch'
  | 'ground_top'
  | 'ground_bottom'
  | 'knockdown'
  | 'ko'
  | 'victory';

export type HitZone = 'head' | 'body' | 'legs';

export interface MoveDefinition {
  id: MoveId;
  label: string;
  zone: HitZone | 'grapple' | 'evade';
  startup: number; // seconds before active hitbox
  active: number; // active hit window seconds
  recovery: number; // recovery seconds after active
  damage: number;
  staminaCost: number;
  reach: number;
  knockback: number;
  stunDuration: number;
  koMultiplier: number;
  isHeavy: boolean;
  lungeSpeed: number;
}

export interface FighterProfile {
  id: FighterId;
  name: string;
  shortName: string;
  nickname: string;
  avatarUrl: string;
  cornerColor: 'red' | 'blue';
  gloveHex: number;
  shortsAccentHex: number;
  skinHex: number;
  hairHex: number;
  heightScale: number;
  buildWidth: number;
  stance: 'orthodox' | 'southpaw';
  stats: {
    striking: number;
    kicking: number;
    grappling: number;
    cardio: number;
  };
  traits: string;
}

export interface FighterInput {
  moveX: number; // -1..1 (screen/camera-relative or world lateral)
  moveZ: number; // -1..1 (forward/back intent)
  punch: boolean; // edge or held
  heavyPunch: boolean;
  kick: boolean;
  highKick: boolean;
  block: boolean; // held
  dodge: boolean; // edge
  takedown: boolean; // edge
  clinch: boolean; // edge
}

export interface FighterState {
  slot: 0 | 1;
  profileId: FighterId;
  x: number;
  z: number;
  vx: number;
  vz: number;
  facing: number; // radians in XZ plane
  posture: FighterPosture;
  health: number; // 0..100
  maxHealth: number;
  stamina: number; // 0..100
  maxStamina: number;
  headIntegrity: number; // 0..100 (100 = fresh)
  bodyIntegrity: number; // 0..100
  legIntegrity: number; // 0..100
  isBlocking: boolean;
  blockZone: 'high' | 'low';
  activeMove: MoveId;
  moveTimer: number;
  moveHasHit: boolean;
  comboStep: number;
  comboWindow: number;
  counterWindow: number;
  stunTimer: number;
  rockedTimer: number;
  invulnTimer: number;
  submissionProgress: number; // 0..100 when attempting or escaping sub
  lastHitZone: HitZone | null;
  lastHitTime: number;
  strikesLanded: number;
  strikesThrown: number;
  takedownsLanded: number;
  knockdowns: number;
  roundDamageDealt: number;
}

export type MatchPhase =
  | 'walkout'
  | 'countdown'
  | 'fighting'
  | 'round_break'
  | 'finished';

export type VictoryMethod =
  | 'NOCAUTE (KO)'
  | 'NOCAUTE TÉCNICO (TKO)'
  | 'FINALIZAÇÃO (SUB)'
  | 'DECISÃO DOS JUÍZES'
  | 'ABANDONO';

export interface MatchResult {
  winnerSlot: 0 | 1;
  winnerId: FighterId;
  method: VictoryMethod;
  round: number;
  roundTimeElapsed: number;
  totalTimeElapsed: number;
  roundScores: Array<[number, number]>;
}

export interface CombatEvent {
  id: number;
  type:
    | 'strike_swing'
    | 'strike_hit'
    | 'strike_blocked'
    | 'dodge_slip'
    | 'rocked'
    | 'knockdown'
    | 'clinch_start'
    | 'clinch_break'
    | 'takedown_landed'
    | 'takedown_stuffed'
    | 'submission_start'
    | 'submission_escaped'
    | 'stand_up'
    | 'round_start'
    | 'round_end'
    | 'ten_seconds'
    | 'ko';
  actorSlot: 0 | 1;
  targetSlot?: 0 | 1;
  zone?: HitZone;
  isHeavy?: boolean;
  x: number;
  y: number;
  z: number;
  damage?: number;
}

export interface MatchState {
  phase: MatchPhase;
  round: number; // 1..3
  maxRounds: number;
  roundClock: number; // 300 down to 0 seconds
  phaseTimer: number; // walkout / countdown / round_break timer
  tenSecondWarned: boolean;
  fighters: [FighterState, FighterState];
  roundScores: Array<[number, number]>;
  result: MatchResult | null;
  events: CombatEvent[];
  nextEventId: number;
  tickCount: number;
}

// Client <-> Server WebSocket Protocol
export type ClientWsMessage =
  | { type: 'create_room'; fighterId: FighterId }
  | { type: 'join_room'; code: string; fighterId: FighterId }
  | { type: 'reconnect_room'; code: string; token: string }
  | { type: 'select_fighter'; fighterId: FighterId }
  | { type: 'set_ready'; ready: boolean }
  | { type: 'player_input'; input: FighterInput; seq: number }
  | { type: 'request_rematch' }
  | { type: 'leave_room' }
  | { type: 'ping'; ts: number };

export interface RoomPlayerSummary {
  slot: 0 | 1;
  fighterId: FighterId;
  ready: boolean;
  connected: boolean;
}

export type ServerWsMessage =
  | {
      type: 'room_joined';
      code: string;
      slot: 0 | 1;
      token: string;
      players: RoomPlayerSummary[];
    }
  | {
      type: 'room_update';
      code: string;
      players: RoomPlayerSummary[];
      status: 'waiting' | 'countdown' | 'fighting' | 'finished';
    }
  | { type: 'match_state'; state: MatchState }
  | { type: 'player_disconnected'; slot: 0 | 1; graceSeconds: number }
  | { type: 'player_reconnected'; slot: 0 | 1 }
  | { type: 'room_error'; message: string }
  | { type: 'pong'; ts: number };

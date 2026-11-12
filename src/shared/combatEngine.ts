import {
  CombatEvent,
  FighterId,
  FighterInput,
  FighterProfile,
  FighterState,
  HitZone,
  MatchState,
  MoveDefinition,
  MoveId,
} from './types.ts';

export const OCTAGON_RADIUS = 5.4;
export const OCTAGON_APOTHEM = OCTAGON_RADIUS * Math.cos(Math.PI / 8); // ~4.989m
export const FIGHTER_RADIUS = 0.36;
export const MIN_FIGHTER_DIST = 0.74;
export const ROUND_DURATION_SECONDS = 300; // 5:00 per round

export const FIGHTER_PROFILES: Record<FighterId, FighterProfile> = {
  jean: {
    id: 'jean',
    name: 'JEAN',
    shortName: 'JEAN',
    nickname: 'O Estrategista',
    avatarUrl: '/assets/aistudio/E80639F1-AF88-48FD-8D21-8DD1609CBF4E_e25771d7.png',
    cornerColor: 'red',
    gloveHex: 0xd91e2a,
    shortsAccentHex: 0xd91e2a,
    skinHex: 0xc68960,
    hairHex: 0x161414,
    heightScale: 1.0,
    buildWidth: 0.98,
    stance: 'orthodox',
    stats: {
      striking: 93,
      kicking: 89,
      grappling: 85,
      cardio: 91,
    },
    traits: 'Boxe preciso, contra-ataque rápido, óculos, barba e tatuagens no braço e pernas.',
  },
  charles: {
    id: 'charles',
    name: 'CHARLES DO BRONX',
    shortName: 'CHARLES',
    nickname: 'Do Bronx',
    avatarUrl: '/assets/aistudio/0226AC40-777C-4DDC-80AC-C5B6D0657E7E_fe0b6c37.png',
    cornerColor: 'blue',
    gloveHex: 0x1d6feb,
    shortsAccentHex: 0x1d6feb,
    skinHex: 0xc1835a,
    hairHex: 0x1c1917,
    heightScale: 1.02,
    buildWidth: 1.0,
    stance: 'orthodox',
    stats: {
      striking: 89,
      kicking: 87,
      grappling: 96,
      cardio: 90,
    },
    traits: 'Chutes frontais, joelhadas no clinch, tatuagens nos braços e especialista em finalizações.',
  },
};

export const MOVES: Record<MoveId, MoveDefinition> = {
  none: {
    id: 'none',
    label: 'Neutro',
    zone: 'head',
    startup: 0,
    active: 0,
    recovery: 0,
    damage: 0,
    staminaCost: 0,
    reach: 0,
    knockback: 0,
    stunDuration: 0,
    koMultiplier: 1,
    isHeavy: false,
    lungeSpeed: 0,
  },
  jab: {
    id: 'jab',
    label: 'Jab',
    zone: 'head',
    startup: 0.11,
    active: 0.09,
    recovery: 0.15,
    damage: 5.5,
    staminaCost: 4.5,
    reach: 1.28,
    knockback: 0.45,
    stunDuration: 0.18,
    koMultiplier: 0.85,
    isHeavy: false,
    lungeSpeed: 1.35,
  },
  cross: {
    id: 'cross',
    label: 'Direto',
    zone: 'head',
    startup: 0.14,
    active: 0.1,
    recovery: 0.2,
    damage: 8.5,
    staminaCost: 7,
    reach: 1.36,
    knockback: 0.75,
    stunDuration: 0.25,
    koMultiplier: 1.15,
    isHeavy: false,
    lungeSpeed: 1.7,
  },
  hook: {
    id: 'hook',
    label: 'Cruzado',
    zone: 'head',
    startup: 0.2,
    active: 0.11,
    recovery: 0.26,
    damage: 13,
    staminaCost: 11.5,
    reach: 1.18,
    knockback: 1.15,
    stunDuration: 0.36,
    koMultiplier: 1.45,
    isHeavy: true,
    lungeSpeed: 1.45,
  },
  uppercut: {
    id: 'uppercut',
    label: 'Uppercut',
    zone: 'head',
    startup: 0.22,
    active: 0.11,
    recovery: 0.28,
    damage: 14.5,
    staminaCost: 12.5,
    reach: 1.12,
    knockback: 0.95,
    stunDuration: 0.4,
    koMultiplier: 1.55,
    isHeavy: true,
    lungeSpeed: 1.55,
  },
  overhand: {
    id: 'overhand',
    label: 'Gancho',
    zone: 'head',
    startup: 0.25,
    active: 0.11,
    recovery: 0.3,
    damage: 15.5,
    staminaCost: 13.5,
    reach: 1.32,
    knockback: 1.35,
    stunDuration: 0.42,
    koMultiplier: 1.6,
    isHeavy: true,
    lungeSpeed: 2.1,
  },
  elbow: {
    id: 'elbow',
    label: 'Cotovelada',
    zone: 'head',
    startup: 0.15,
    active: 0.1,
    recovery: 0.22,
    damage: 12,
    staminaCost: 9,
    reach: 0.96,
    knockback: 0.7,
    stunDuration: 0.36,
    koMultiplier: 1.45,
    isHeavy: true,
    lungeSpeed: 0.9,
  },
  low_kick: {
    id: 'low_kick',
    label: 'Chute Baixo',
    zone: 'legs',
    startup: 0.17,
    active: 0.11,
    recovery: 0.22,
    damage: 8.5,
    staminaCost: 8,
    reach: 1.48,
    knockback: 0.55,
    stunDuration: 0.2,
    koMultiplier: 0.5,
    isHeavy: false,
    lungeSpeed: 1.1,
  },
  body_kick: {
    id: 'body_kick',
    label: 'Chute no Corpo',
    zone: 'body',
    startup: 0.21,
    active: 0.12,
    recovery: 0.25,
    damage: 12,
    staminaCost: 10.5,
    reach: 1.52,
    knockback: 1.1,
    stunDuration: 0.28,
    koMultiplier: 0.85,
    isHeavy: true,
    lungeSpeed: 1.25,
  },
  high_kick: {
    id: 'high_kick',
    label: 'Chute Alto',
    zone: 'head',
    startup: 0.26,
    active: 0.12,
    recovery: 0.33,
    damage: 18,
    staminaCost: 15,
    reach: 1.54,
    knockback: 1.65,
    stunDuration: 0.48,
    koMultiplier: 1.85,
    isHeavy: true,
    lungeSpeed: 1.35,
  },
  front_kick: {
    id: 'front_kick',
    label: 'Chute Frontal',
    zone: 'body',
    startup: 0.18,
    active: 0.12,
    recovery: 0.24,
    damage: 10,
    staminaCost: 9,
    reach: 1.62,
    knockback: 1.95,
    stunDuration: 0.3,
    koMultiplier: 0.9,
    isHeavy: true,
    lungeSpeed: 1.5,
  },
  knee: {
    id: 'knee',
    label: 'Joelhada',
    zone: 'body',
    startup: 0.16,
    active: 0.11,
    recovery: 0.22,
    damage: 13.5,
    staminaCost: 10,
    reach: 1.0,
    knockback: 0.8,
    stunDuration: 0.35,
    koMultiplier: 1.35,
    isHeavy: true,
    lungeSpeed: 1.1,
  },
  dodge_left: {
    id: 'dodge_left',
    label: 'Esquiva Esquerda',
    zone: 'evade',
    startup: 0.04,
    active: 0.22,
    recovery: 0.12,
    damage: 0,
    staminaCost: 6,
    reach: 0,
    knockback: 0,
    stunDuration: 0,
    koMultiplier: 1,
    isHeavy: false,
    lungeSpeed: 2.8,
  },
  dodge_right: {
    id: 'dodge_right',
    label: 'Esquiva Direita',
    zone: 'evade',
    startup: 0.04,
    active: 0.22,
    recovery: 0.12,
    damage: 0,
    staminaCost: 6,
    reach: 0,
    knockback: 0,
    stunDuration: 0,
    koMultiplier: 1,
    isHeavy: false,
    lungeSpeed: 2.8,
  },
  dodge_back: {
    id: 'dodge_back',
    label: 'Recuo Rápido',
    zone: 'evade',
    startup: 0.04,
    active: 0.2,
    recovery: 0.13,
    damage: 0,
    staminaCost: 5.5,
    reach: 0,
    knockback: 0,
    stunDuration: 0,
    koMultiplier: 1,
    isHeavy: false,
    lungeSpeed: 3.1,
  },
  clinch_attempt: {
    id: 'clinch_attempt',
    label: 'Clinch',
    zone: 'grapple',
    startup: 0.14,
    active: 0.14,
    recovery: 0.24,
    damage: 0,
    staminaCost: 8,
    reach: 1.15,
    knockback: 0,
    stunDuration: 0.25,
    koMultiplier: 1,
    isHeavy: false,
    lungeSpeed: 2.2,
  },
  takedown_attempt: {
    id: 'takedown_attempt',
    label: 'Queda',
    zone: 'grapple',
    startup: 0.2,
    active: 0.16,
    recovery: 0.34,
    damage: 5,
    staminaCost: 14,
    reach: 1.38,
    knockback: 0,
    stunDuration: 0.45,
    koMultiplier: 1,
    isHeavy: true,
    lungeSpeed: 3.3,
  },
  gnp_strike: {
    id: 'gnp_strike',
    label: 'Ground & Pound',
    zone: 'head',
    startup: 0.14,
    active: 0.1,
    recovery: 0.22,
    damage: 10.5,
    staminaCost: 8.5,
    reach: 1.0,
    knockback: 0,
    stunDuration: 0.26,
    koMultiplier: 1.4,
    isHeavy: true,
    lungeSpeed: 0,
  },
  submission_attempt: {
    id: 'submission_attempt',
    label: 'Finalização',
    zone: 'grapple',
    startup: 0.25,
    active: 0.45,
    recovery: 0.25,
    damage: 2,
    staminaCost: 12,
    reach: 1.0,
    knockback: 0,
    stunDuration: 0.35,
    koMultiplier: 1,
    isHeavy: true,
    lungeSpeed: 0,
  },
  stand_up: {
    id: 'stand_up',
    label: 'Levantar',
    zone: 'grapple',
    startup: 0.22,
    active: 0.18,
    recovery: 0.2,
    damage: 0,
    staminaCost: 11,
    reach: 1.0,
    knockback: 0.6,
    stunDuration: 0,
    koMultiplier: 1,
    isHeavy: false,
    lungeSpeed: 0,
  },
};

export function emptyInput(): FighterInput {
  return {
    moveX: 0,
    moveZ: 0,
    punch: false,
    heavyPunch: false,
    kick: false,
    highKick: false,
    block: false,
    dodge: false,
    takedown: false,
    clinch: false,
  };
}

function createFighterState(slot: 0 | 1, profileId: FighterId): FighterState {
  const startX = slot === 0 ? -1.85 : 1.85;
  const facing = slot === 0 ? 0 : Math.PI;
  return {
    slot,
    profileId,
    x: startX,
    z: 0,
    vx: 0,
    vz: 0,
    facing,
    posture: 'standing',
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    headIntegrity: 100,
    bodyIntegrity: 100,
    legIntegrity: 100,
    isBlocking: false,
    blockZone: 'high',
    activeMove: 'none',
    moveTimer: 0,
    moveHasHit: false,
    comboStep: 0,
    comboWindow: 0,
    counterWindow: 0,
    stunTimer: 0,
    rockedTimer: 0,
    invulnTimer: 0,
    submissionProgress: 0,
    lastHitZone: null,
    lastHitTime: -10,
    strikesLanded: 0,
    strikesThrown: 0,
    takedownsLanded: 0,
    knockdowns: 0,
    roundDamageDealt: 0,
  };
}

export function createInitialMatch(
  p1Id: FighterId,
  p2Id: FighterId,
  skipWalkout = false,
): MatchState {
  return {
    phase: skipWalkout ? 'countdown' : 'walkout',
    round: 1,
    maxRounds: 3,
    roundClock: ROUND_DURATION_SECONDS,
    phaseTimer: skipWalkout ? 3.0 : 3.4,
    tenSecondWarned: false,
    fighters: [createFighterState(0, p1Id), createFighterState(1, p2Id)],
    roundScores: [],
    result: null,
    events: [],
    nextEventId: 1,
    tickCount: 0,
  };
}

function pushEvent(
  state: MatchState,
  ev: Omit<CombatEvent, 'id'>,
): void {
  state.events.push({
    ...ev,
    id: state.nextEventId++,
  });
  if (state.events.length > 32) {
    state.events.shift();
  }
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function clampToOctagon(f: FighterState): void {
  const safeApothem = OCTAGON_APOTHEM - FIGHTER_RADIUS;
  for (let i = 0; i < 8; i++) {
    const theta = (i * Math.PI) / 4 + Math.PI / 8;
    const nx = Math.cos(theta);
    const nz = Math.sin(theta);
    const dist = f.x * nx + f.z * nz;
    if (dist > safeApothem) {
      const push = dist - safeApothem;
      f.x -= nx * push;
      f.z -= nz * push;
      // Slide velocity along cage wall
      const vDot = f.vx * nx + f.vz * nz;
      if (vDot > 0) {
        f.vx -= nx * vDot;
        f.vz -= nz * vDot;
      }
    }
  }
}

function resolveFighterSeparation(a: FighterState, b: FighterState): void {
  if (a.posture === 'ko' || b.posture === 'ko') return;
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const distSq = dx * dx + dz * dz;
  let targetMin = MIN_FIGHTER_DIST;
  if (a.posture === 'clinch' && b.posture === 'clinch') {
    targetMin = 0.56;
  } else if (
    a.posture === 'ground_top' ||
    a.posture === 'ground_bottom' ||
    b.posture === 'ground_top' ||
    b.posture === 'ground_bottom'
  ) {
    targetMin = 0.45;
  }

  if (distSq < targetMin * targetMin) {
    const dist = Math.sqrt(distSq) || 0.001;
    const nx = dx / dist;
    const nz = dz / dist;
    const overlap = targetMin - dist;
    a.x -= nx * overlap * 0.5;
    a.z -= nz * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.z += nz * overlap * 0.5;
    clampToOctagon(a);
    clampToOctagon(b);
  }
}

function getMoveTimeScale(f: FighterState): number {
  // Tired fighters attack noticeably slower
  const fatigueScale = f.stamina < 20 ? 0.72 : f.stamina < 40 ? 0.88 : 1.0;
  return fatigueScale;
}

function startMove(
  state: MatchState,
  f: FighterState,
  opp: FighterState,
  moveId: MoveId,
): void {
  const def = MOVES[moveId];
  if (f.stamina < Math.max(2.5, def.staminaCost * 0.35)) {
    return;
  }

  f.activeMove = moveId;
  f.moveTimer = 0;
  f.moveHasHit = false;
  f.stamina = Math.max(0, f.stamina - def.staminaCost);

  if (
    def.zone === 'head' ||
    def.zone === 'body' ||
    def.zone === 'legs'
  ) {
    f.strikesThrown += 1;
    pushEvent(state, {
      type: 'strike_swing',
      actorSlot: f.slot,
      zone: def.zone,
      isHeavy: def.isHeavy,
      x: f.x,
      y: 1.2,
      z: f.z,
    });
  }

  // Face opponent immediately on strike startup
  const dx = opp.x - f.x;
  const dz = opp.z - f.z;
  if (dx * dx + dz * dz > 0.001) {
    f.facing = Math.atan2(dz, dx);
  }

  if (moveId === 'dodge_left' || moveId === 'dodge_right' || moveId === 'dodge_back') {
    f.invulnTimer = 0.24;
    f.counterWindow = 0.55;
    pushEvent(state, {
      type: 'dodge_slip',
      actorSlot: f.slot,
      x: f.x,
      y: 1.3,
      z: f.z,
    });
  }
}

function selectStrikeFromInput(
  f: FighterState,
  opp: FighterState,
  input: FighterInput,
): MoveId | null {
  const dist = Math.hypot(opp.x - f.x, opp.z - f.z);

  if (f.posture === 'clinch') {
    if (input.kick || input.highKick) return 'knee';
    if (input.heavyPunch) return 'elbow';
    if (input.punch) return 'hook';
    if (input.takedown) return 'takedown_attempt';
    return null;
  }

  if (f.posture === 'ground_top') {
    if (input.takedown || input.clinch) return 'submission_attempt';
    if (input.punch || input.heavyPunch || input.kick || input.highKick) {
      return 'gnp_strike';
    }
    return null;
  }

  if (f.posture === 'ground_bottom') {
    if (input.dodge || input.takedown || input.clinch || input.kick) {
      return 'stand_up';
    }
    return null;
  }

  if (f.posture !== 'standing') return null;

  // Grappling triggers
  if (input.takedown) return 'takedown_attempt';
  if (input.clinch) return 'clinch_attempt';

  // Dodge trigger
  if (input.dodge) {
    if (input.moveX < -0.25) return 'dodge_left';
    if (input.moveX > 0.25) return 'dodge_right';
    if (input.moveZ < -0.25) return 'dodge_back';
    return f.slot === 0 ? 'dodge_left' : 'dodge_right';
  }

  // Forward intent relative to opponent
  const fx = Math.cos(f.facing);
  const fz = Math.sin(f.facing);
  const forwardIntent = input.moveX * fx + input.moveZ * fz;

  if (input.highKick) {
    return 'high_kick';
  }

  if (input.kick) {
    if (dist < 0.96) return 'knee';
    if (forwardIntent > 0.45) return 'body_kick';
    if (forwardIntent < -0.35) return 'front_kick';
    return f.comboStep >= 1 ? 'body_kick' : 'low_kick';
  }

  if (input.heavyPunch) {
    if (dist < 0.92) return 'elbow';
    if (forwardIntent > 0.45) return 'uppercut';
    if (f.comboStep >= 1) return 'overhand';
    return 'hook';
  }

  if (input.punch) {
    if (f.counterWindow > 0) return 'cross';
    if (f.comboStep === 1) return 'cross';
    if (f.comboStep >= 2) return 'hook';
    return forwardIntent > 0.55 ? 'cross' : 'jab';
  }

  return null;
}

function resetPositionsForNewRound(state: MatchState): void {
  state.fighters.forEach((f, idx) => {
    f.x = idx === 0 ? -1.85 : 1.85;
    f.z = 0;
    f.vx = 0;
    f.vz = 0;
    f.facing = idx === 0 ? 0 : Math.PI;
    f.posture = 'standing';
    f.activeMove = 'none';
    f.moveTimer = 0;
    f.moveHasHit = false;
    f.isBlocking = false;
    f.stunTimer = 0;
    f.rockedTimer = 0;
    f.invulnTimer = 0;
    f.submissionProgress = 0;
    f.roundDamageDealt = 0;
    // Recover stamina and slight health between rounds
    f.stamina = Math.min(f.maxStamina, f.stamina + 48);
    f.health = Math.min(f.maxHealth, f.health + 14);
    f.headIntegrity = Math.min(100, f.headIntegrity + 12);
    f.bodyIntegrity = Math.min(100, f.bodyIntegrity + 12);
    f.legIntegrity = Math.min(100, f.legIntegrity + 12);
  });
}

function scoreCurrentRound(state: MatchState): [number, number] {
  const f0 = state.fighters[0];
  const f1 = state.fighters[1];
  const s0 = f0.roundDamageDealt + f0.takedownsLanded * 8 + f0.knockdowns * 15;
  const s1 = f1.roundDamageDealt + f1.takedownsLanded * 8 + f1.knockdowns * 15;
  if (Math.abs(s0 - s1) < 4) return [10, 10];
  if (s0 > s1) {
    return s0 - s1 > 28 ? [10, 8] : [10, 9];
  }
  return s1 - s0 > 28 ? [8, 10] : [9, 10];
}

function finishMatch(
  state: MatchState,
  winnerSlot: 0 | 1,
  method: MatchState['result'] extends infer R
    ? R extends { method: infer M }
      ? M
      : never
    : never,
): void {
  state.phase = 'finished';
  const loserSlot: 0 | 1 = winnerSlot === 0 ? 1 : 0;
  const winner = state.fighters[winnerSlot];
  const loser = state.fighters[loserSlot];

  winner.posture = 'victory';
  winner.activeMove = 'none';
  if (method === 'NOCAUTE (KO)' || method === 'NOCAUTE TÉCNICO (TKO)') {
    loser.posture = 'ko';
    loser.activeMove = 'none';
  }

  if (state.roundScores.length < state.round) {
    state.roundScores.push(scoreCurrentRound(state));
  }

  const roundElapsed = ROUND_DURATION_SECONDS - state.roundClock;
  const totalElapsed =
    (state.round - 1) * ROUND_DURATION_SECONDS + roundElapsed;

  state.result = {
    winnerSlot,
    winnerId: winner.profileId,
    method,
    round: state.round,
    roundTimeElapsed: Math.max(1, Math.round(roundElapsed)),
    totalTimeElapsed: Math.max(1, Math.round(totalElapsed)),
    roundScores: [...state.roundScores],
  };

  pushEvent(state, {
    type: 'ko',
    actorSlot: winnerSlot,
    targetSlot: loserSlot,
    x: loser.x,
    y: 0.6,
    z: loser.z,
  });
}

export function stepMatch(
  state: MatchState,
  inputs: [FighterInput, FighterInput],
  rawDt: number,
): void {
  const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
  state.tickCount += 1;

  if (state.phase === 'finished') {
    return;
  }

  if (state.phase === 'walkout') {
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) {
      state.phase = 'countdown';
      state.phaseTimer = 3.0;
    }
    return;
  }

  if (state.phase === 'countdown') {
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) {
      state.phase = 'fighting';
      pushEvent(state, {
        type: 'round_start',
        actorSlot: 0,
        x: 0,
        y: 1.5,
        z: 0,
      });
    }
    return;
  }

  if (state.phase === 'round_break') {
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) {
      state.round += 1;
      state.roundClock = ROUND_DURATION_SECONDS;
      state.tenSecondWarned = false;
      resetPositionsForNewRound(state);
      state.phase = 'countdown';
      state.phaseTimer = 2.5;
    }
    return;
  }

  // Active Fighting Phase
  state.roundClock = Math.max(0, state.roundClock - dt);

  if (!state.tenSecondWarned && state.roundClock <= 10.0) {
    state.tenSecondWarned = true;
    pushEvent(state, {
      type: 'ten_seconds',
      actorSlot: 0,
      x: 0,
      y: 2,
      z: 0,
    });
  }

  if (state.roundClock <= 0) {
    state.roundScores.push(scoreCurrentRound(state));
    pushEvent(state, {
      type: 'round_end',
      actorSlot: 0,
      x: 0,
      y: 2,
      z: 0,
    });

    if (state.round >= state.maxRounds) {
      // Judges' Decision
      let total0 = 0;
      let total1 = 0;
      for (const [s0, s1] of state.roundScores) {
        total0 += s0;
        total1 += s1;
      }
      const winnerSlot: 0 | 1 =
        total0 === total1
          ? state.fighters[0].health >= state.fighters[1].health
            ? 0
            : 1
          : total0 > total1
            ? 0
            : 1;
      finishMatch(state, winnerSlot, 'DECISÃO DOS JUÍZES');
      return;
    }

    state.phase = 'round_break';
    state.phaseTimer = 6.5;
    return;
  }

  const [f0, f1] = state.fighters;
  const pair: [FighterState, FighterState] = [f0, f1];

  // Update timers & block states
  for (let i = 0; i < 2; i++) {
    const f = pair[i];
    const opp = pair[i === 0 ? 1 : 0];
    const inp = inputs[i];

    f.stunTimer = Math.max(0, f.stunTimer - dt);
    f.rockedTimer = Math.max(0, f.rockedTimer - dt);
    f.invulnTimer = Math.max(0, f.invulnTimer - dt);
    f.comboWindow = Math.max(0, f.comboWindow - dt);
    f.counterWindow = Math.max(0, f.counterWindow - dt);

    if (f.comboWindow <= 0 && f.activeMove === 'none') {
      f.comboStep = 0;
    }

    // Knockdown recovery
    if (f.posture === 'knockdown') {
      if (f.stunTimer <= 0) {
        f.posture = 'standing';
        f.health = Math.max(12, f.health);
        f.invulnTimer = 0.5;
      }
      continue;
    }

    // Stamina regeneration when idle
    const bodyFactor = 0.55 + 0.45 * (f.bodyIntegrity / 100);
    if (f.activeMove === 'none' && !inp.block) {
      const regenRate =
        f.posture === 'clinch' || f.posture === 'ground_top' ? 6.5 : 13.5;
      f.stamina = Math.min(f.maxStamina, f.stamina + regenRate * bodyFactor * dt);
    } else if (inp.block && f.activeMove === 'none') {
      f.stamina = Math.min(f.maxStamina, f.stamina + 4.5 * bodyFactor * dt);
    }

    // Guarding
    const canBlock =
      f.activeMove === 'none' &&
      f.stunTimer <= 0 &&
      (f.posture === 'standing' || f.posture === 'ground_bottom');
    f.isBlocking = canBlock && inp.block;
    if (f.isBlocking) {
      const fx = Math.cos(f.facing);
      const fz = Math.sin(f.facing);
      const fwd = inp.moveX * fx + inp.moveZ * fz;
      f.blockZone = fwd < -0.35 || opp.activeMove === 'low_kick' ? 'low' : 'high';
    }

    // Face opponent smoothly when standing or clinching
    if (
      f.posture === 'standing' ||
      f.posture === 'clinch' ||
      f.posture === 'ground_top' ||
      f.posture === 'ground_bottom'
    ) {
      const dx = opp.x - f.x;
      const dz = opp.z - f.z;
      if (dx * dx + dz * dz > 0.0004 && f.activeMove === 'none') {
        const targetAngle = Math.atan2(dz, dx);
        const diff = normalizeAngle(targetAngle - f.facing);
        f.facing = normalizeAngle(f.facing + diff * Math.min(1, dt * 11));
      }
    }

    // Active move progression
    if (f.activeMove !== 'none') {
      const def = MOVES[f.activeMove];
      const timeScale = getMoveTimeScale(f);
      f.moveTimer += dt * timeScale;

      const activeEnd = def.startup + def.active;
      const totalDur = activeEnd + def.recovery;

      // Apply forward lunge during startup/active
      if (f.moveTimer < activeEnd && def.lungeSpeed > 0) {
        const fx = Math.cos(f.facing);
        const fz = Math.sin(f.facing);
        if (f.activeMove === 'dodge_left') {
          f.vx = fz * def.lungeSpeed;
          f.vz = -fx * def.lungeSpeed;
        } else if (f.activeMove === 'dodge_right') {
          f.vx = -fz * def.lungeSpeed;
          f.vz = fx * def.lungeSpeed;
        } else if (f.activeMove === 'dodge_back') {
          f.vx = -fx * def.lungeSpeed;
          f.vz = -fz * def.lungeSpeed;
        } else {
          f.vx = fx * def.lungeSpeed;
          f.vz = fz * def.lungeSpeed;
        }
      } else {
        f.vx *= Math.exp(-12 * dt);
        f.vz *= Math.exp(-12 * dt);
      }

      // Hit Detection in Active Window
      if (
        !f.moveHasHit &&
        f.moveTimer >= def.startup &&
        f.moveTimer <= activeEnd
      ) {
        if (evaluateActiveMove(state, f, opp, def)) return;
      }

      // Combo cancellation in recovery window
      const inComboWindow =
        f.moveTimer > activeEnd + 0.04 &&
        f.moveTimer < totalDur &&
        def.zone !== 'grapple' &&
        def.zone !== 'evade';
      if (inComboWindow && (inp.punch || inp.heavyPunch || inp.kick || inp.highKick)) {
        const nextMove = selectStrikeFromInput(f, opp, inp);
        if (nextMove && nextMove !== f.activeMove) {
          f.comboStep = Math.min(3, f.comboStep + 1);
          f.comboWindow = 0.5;
          startMove(state, f, opp, nextMove);
          continue;
        }
      }

      if (f.moveTimer >= totalDur) {
        f.activeMove = 'none';
        f.moveTimer = 0;
        f.moveHasHit = false;
        if (def.zone !== 'evade' && def.zone !== 'grapple') {
          f.comboWindow = 0.45;
          f.comboStep = Math.min(3, f.comboStep + 1);
        }
      }
      continue;
    }

    // Free Movement (Standing or Clinch shuffle)
    if (f.stunTimer <= 0) {
      if (f.posture === 'standing') {
        const legFactor = 0.55 + 0.45 * (f.legIntegrity / 100);
        const blockPenalty = f.isBlocking ? 0.58 : 1.0;
        const tiredPenalty = f.stamina < 15 ? 0.78 : 1.0;
        const baseSpeed = 2.95 * legFactor * blockPenalty * tiredPenalty;
        const mag = Math.hypot(inp.moveX, inp.moveZ);
        if (mag > 0.08) {
          const clampMag = Math.min(1, mag);
          f.vx = (inp.moveX / mag) * baseSpeed * clampMag;
          f.vz = (inp.moveZ / mag) * baseSpeed * clampMag;
        } else {
          f.vx *= Math.exp(-14 * dt);
          f.vz *= Math.exp(-14 * dt);
        }
      } else if (f.posture === 'clinch') {
        // Clinch shuffle together
        const mag = Math.hypot(inp.moveX, inp.moveZ);
        if (mag > 0.15) {
          f.vx = (inp.moveX / mag) * 1.1;
          f.vz = (inp.moveZ / mag) * 1.1;
        } else {
          f.vx *= Math.exp(-12 * dt);
          f.vz *= Math.exp(-12 * dt);
        }
        // Break clinch if pulling away strongly with dodge
        if (inp.dodge) {
          f.posture = 'standing';
          opp.posture = 'standing';
          const dx = f.x - opp.x;
          const dz = f.z - opp.z;
          const d = Math.hypot(dx, dz) || 1;
          f.x += (dx / d) * 0.45;
          f.z += (dz / d) * 0.45;
          pushEvent(state, {
            type: 'clinch_break',
            actorSlot: f.slot,
            x: (f.x + opp.x) * 0.5,
            y: 1.2,
            z: (f.z + opp.z) * 0.5,
          });
        }
      } else {
        f.vx = 0;
        f.vz = 0;
      }

      // Check new move trigger
      if (!f.isBlocking || inp.dodge || inp.takedown || inp.clinch) {
        const chosen = selectStrikeFromInput(f, opp, inp);
        if (chosen) {
          startMove(state, f, opp, chosen);
        }
      }
    } else {
      f.vx *= Math.exp(-10 * dt);
      f.vz *= Math.exp(-10 * dt);
    }
  }

  // Ground Submission continuous battle
  if (
    (f0.posture === 'ground_top' && f1.posture === 'ground_bottom') ||
    (f1.posture === 'ground_top' && f0.posture === 'ground_bottom')
  ) {
    const top = f0.posture === 'ground_top' ? f0 : f1;
    const bottom = top === f0 ? f1 : f0;
    const topInput = inputs[top.slot];
    const bottomInput = inputs[bottom.slot];

    if (top.activeMove === 'submission_attempt') {
      // Top fighter pushes submission, bottom struggles to escape
      const bottomStruggle =
        (bottomInput.dodge ? 1.5 : 0) +
        (bottomInput.punch ? 0.9 : 0) +
        Math.hypot(bottomInput.moveX, bottomInput.moveZ) * 1.1;
      const topDrive =
        1.1 +
        (topInput.takedown || topInput.clinch ? 1.0 : 0) +
        (FIGHTER_PROFILES[top.profileId].stats.grappling / 100) * 0.8;

      const staminaBonus = top.stamina > bottom.stamina ? 14 : -8;
      const deltaProg = (topDrive * 28 - bottomStruggle * 24 + staminaBonus) * dt;
      top.submissionProgress = Math.max(
        0,
        Math.min(100, top.submissionProgress + deltaProg),
      );
      bottom.submissionProgress = top.submissionProgress;

      if (top.submissionProgress >= 100) {
        finishMatch(state, top.slot, 'FINALIZAÇÃO (SUB)');
        return;
      }
      if (top.submissionProgress <= 0 && top.moveTimer > 0.35) {
        top.activeMove = 'none';
        top.submissionProgress = 0;
        bottom.submissionProgress = 0;
        top.posture = 'standing';
        bottom.posture = 'standing';
        const dx = bottom.x - top.x;
        const dz = bottom.z - top.z;
        const d = Math.hypot(dx, dz) || 1;
        bottom.x += (dx / d) * 0.6;
        bottom.z += (dz / d) * 0.6;
        pushEvent(state, {
          type: 'submission_escaped',
          actorSlot: bottom.slot,
          targetSlot: top.slot,
          x: bottom.x,
          y: 0.6,
          z: bottom.z,
        });
      }
    }
  }

  // Integrate positions & enforce octagon + fighter separation
  for (let i = 0; i < 2; i++) {
    const f = pair[i];
    if (f.posture === 'standing' || f.posture === 'clinch') {
      f.x += f.vx * dt;
      f.z += f.vz * dt;
      clampToOctagon(f);
    }
  }
  resolveFighterSeparation(f0, f1);
}

function evaluateActiveMove(
  state: MatchState,
  attacker: FighterState,
  defender: FighterState,
  def: MoveDefinition,
): boolean {
  const dx = defender.x - attacker.x;
  const dz = defender.z - attacker.z;
  const dist = Math.hypot(dx, dz);

  // Range check (no infinite reach)
  if (dist > def.reach) return false;

  // Facing cone check
  const fx = Math.cos(attacker.facing);
  const fz = Math.sin(attacker.facing);
  const dirX = dist > 0.001 ? dx / dist : fx;
  const dirZ = dist > 0.001 ? dz / dist : fz;
  const alignment = fx * dirX + fz * dirZ;
  if (alignment < 0.35) return false;

  // Evade / dodge slip check for standing strikes
  if (def.zone === 'evade') return false;

  if (
    defender.invulnTimer > 0 &&
    def.zone === 'head' &&
    attacker.posture === 'standing'
  ) {
    attacker.moveHasHit = true;
    return false;
  }

  // Clinch initiation
  if (def.id === 'clinch_attempt') {
    attacker.moveHasHit = true;
    if (defender.posture !== 'standing') return false;
    if (defender.isBlocking && defender.stamina > 25 && Math.random() < 0.35) {
      pushEvent(state, {
        type: 'strike_blocked',
        actorSlot: attacker.slot,
        targetSlot: defender.slot,
        x: defender.x,
        y: 1.2,
        z: defender.z,
      });
      return false;
    }
    attacker.posture = 'clinch';
    defender.posture = 'clinch';
    attacker.activeMove = 'none';
    defender.activeMove = 'none';
    const mx = (attacker.x + defender.x) * 0.5;
    const mz = (attacker.z + defender.z) * 0.5;
    attacker.x = mx - dirX * 0.28;
    attacker.z = mz - dirZ * 0.28;
    defender.x = mx + dirX * 0.28;
    defender.z = mz + dirZ * 0.28;
    pushEvent(state, {
      type: 'clinch_start',
      actorSlot: attacker.slot,
      targetSlot: defender.slot,
      x: mx,
      y: 1.3,
      z: mz,
    });
    return false;
  }

  // Takedown attempt
  if (def.id === 'takedown_attempt') {
    attacker.moveHasHit = true;
    if (defender.posture !== 'standing' && defender.posture !== 'clinch') return false;

    const grapSkill = FIGHTER_PROFILES[attacker.profileId].stats.grappling / 100;
    const defSkill = FIGHTER_PROFILES[defender.profileId].stats.grappling / 100;
    const isDefendingTakedown =
      defender.isBlocking ||
      defender.activeMove === 'dodge_back' ||
      defender.activeMove === 'uppercut' ||
      defender.activeMove === 'knee';

    const successScore =
      0.62 +
      grapSkill * 0.25 -
      defSkill * 0.15 +
      (defender.stamina < 30 ? 0.22 : 0) -
      (isDefendingTakedown ? 0.42 : 0);

    if (successScore > 0.38) {
      attacker.posture = 'ground_top';
      defender.posture = 'ground_bottom';
      attacker.activeMove = 'none';
      defender.activeMove = 'none';
      attacker.takedownsLanded += 1;
      defender.health = Math.max(1, defender.health - def.damage);
      attacker.roundDamageDealt += def.damage;
      const mx = (attacker.x + defender.x) * 0.5;
      const mz = (attacker.z + defender.z) * 0.5;
      attacker.x = mx - dirX * 0.22;
      attacker.z = mz - dirZ * 0.22;
      defender.x = mx + dirX * 0.22;
      defender.z = mz + dirZ * 0.22;
      clampToOctagon(attacker);
      clampToOctagon(defender);
      pushEvent(state, {
        type: 'takedown_landed',
        actorSlot: attacker.slot,
        targetSlot: defender.slot,
        x: defender.x,
        y: 0.35,
        z: defender.z,
        damage: def.damage,
      });
    } else {
      attacker.stunTimer = 0.35;
      attacker.stamina = Math.max(0, attacker.stamina - 8);
      pushEvent(state, {
        type: 'takedown_stuffed',
        actorSlot: defender.slot,
        targetSlot: attacker.slot,
        x: defender.x,
        y: 0.9,
        z: defender.z,
      });
    }
    return false;
  }

  // Stand up from ground bottom
  if (def.id === 'stand_up') {
    attacker.moveHasHit = true;
    attacker.posture = 'standing';
    defender.posture = 'standing';
    attacker.activeMove = 'none';
    defender.activeMove = 'none';
    attacker.x -= dirX * 0.5;
    attacker.z -= dirZ * 0.5;
    defender.x += dirX * 0.3;
    defender.z += dirZ * 0.3;
    clampToOctagon(attacker);
    clampToOctagon(defender);
    pushEvent(state, {
      type: 'stand_up',
      actorSlot: attacker.slot,
      x: attacker.x,
      y: 0.8,
      z: attacker.z,
    });
    return false;
  }

  // Submission initiation from ground top
  if (def.id === 'submission_attempt') {
    attacker.moveHasHit = true;
    if (defender.posture !== 'ground_bottom') return false;
    attacker.submissionProgress = Math.max(
      28,
      36 + (100 - defender.stamina) * 0.22,
    );
    defender.submissionProgress = attacker.submissionProgress;
    pushEvent(state, {
      type: 'submission_start',
      actorSlot: attacker.slot,
      targetSlot: defender.slot,
      x: defender.x,
      y: 0.3,
      z: defender.z,
    });
    return false;
  }

  // Normal & GnP Strike Impact
  if (defender.posture === 'knockdown' || defender.posture === 'ko') return false;

  attacker.moveHasHit = true;
  const zone: HitZone =
    def.zone === 'head' || def.zone === 'body' || def.zone === 'legs'
      ? def.zone
      : 'body';

  // Counter-hit bonus
  const isCounter =
    attacker.counterWindow > 0 || defender.activeMove !== 'none';
  const counterMult = isCounter ? 1.28 : 1.0;

  // Guard mitigation
  let blocked = false;
  let blockMult = 1.0;
  if (defender.isBlocking && defender.stamina > 4) {
    const matchedZone =
      (zone === 'head' && defender.blockZone === 'high') ||
      ((zone === 'body' || zone === 'legs') && defender.blockZone === 'low') ||
      (zone === 'body' && defender.blockZone === 'high');
    if (matchedZone) {
      blocked = true;
      blockMult = def.isHeavy ? 0.24 : 0.14;
      defender.stamina = Math.max(0, defender.stamina - def.damage * 0.55);
    } else {
      blockMult = 0.72;
    }
  }

  const strikingSkill =
    (zone === 'legs' || def.id.includes('kick')
      ? FIGHTER_PROFILES[attacker.profileId].stats.kicking
      : FIGHTER_PROFILES[attacker.profileId].stats.striking) / 100;

  const rawDamage = def.damage * (0.88 + strikingSkill * 0.24) * counterMult;
  const finalDamage = rawDamage * blockMult;

  defender.health = Math.max(0, defender.health - finalDamage);
  defender.lastHitZone = zone;
  defender.lastHitTime = state.tickCount / 60;
  attacker.roundDamageDealt += finalDamage;

  if (!blocked) {
    attacker.strikesLanded += 1;
    if (zone === 'head') {
      defender.headIntegrity = Math.max(
        0,
        defender.headIntegrity - finalDamage * 1.15,
      );
    } else if (zone === 'body') {
      defender.bodyIntegrity = Math.max(
        0,
        defender.bodyIntegrity - finalDamage * 1.25,
      );
      defender.stamina = Math.max(0, defender.stamina - finalDamage * 0.6);
    } else {
      defender.legIntegrity = Math.max(
        0,
        defender.legIntegrity - finalDamage * 1.45,
      );
    }

    // Interrupt opponent windup on clean hit
    if (
      defender.activeMove !== 'none' &&
      MOVES[defender.activeMove].startup > defender.moveTimer
    ) {
      defender.activeMove = 'none';
      defender.moveTimer = 0;
    }

    defender.stunTimer = Math.max(defender.stunTimer, def.stunDuration);

    // Knockback
    if (defender.posture === 'standing') {
      defender.x += dirX * def.knockback * 0.28;
      defender.z += dirZ * def.knockback * 0.28;
      clampToOctagon(defender);
    }
  } else {
    // Blocked knockback
    if (defender.posture === 'standing') {
      defender.x += dirX * def.knockback * 0.12;
      defender.z += dirZ * def.knockback * 0.12;
      clampToOctagon(defender);
    }
  }

  const hitY = zone === 'head' ? 1.56 : zone === 'body' ? 1.08 : 0.55;
  pushEvent(state, {
    type: blocked ? 'strike_blocked' : 'strike_hit',
    actorSlot: attacker.slot,
    targetSlot: defender.slot,
    zone,
    isHeavy: def.isHeavy && !blocked,
    x: defender.x - dirX * 0.2,
    y: defender.posture === 'ground_bottom' ? 0.35 : hitY,
    z: defender.z - dirZ * 0.2,
    damage: finalDamage,
  });

  // Check KO / Knockdown / Rocked
  if (defender.health <= 0) {
    const method =
      defender.posture === 'ground_bottom'
        ? 'NOCAUTE TÉCNICO (TKO)'
        : 'NOCAUTE (KO)';
    finishMatch(state, attacker.slot, method);
    return true;
  }

  if (!blocked && zone === 'head') {
    const koRisk =
      ((100 - defender.headIntegrity) / 100) * 0.45 * def.koMultiplier +
      (defender.stamina < 15 ? 0.12 : 0) +
      (isCounter ? 0.14 : 0);

    if (def.isHeavy && defender.headIntegrity < 32 && koRisk > 0.48) {
      if (defender.knockdowns >= 2 || defender.health < 18) {
        defender.health = 0;
        finishMatch(state, attacker.slot, 'NOCAUTE (KO)');
        return true;
      }
      // Knockdown!
      defender.posture = 'knockdown';
      defender.activeMove = 'none';
      defender.stunTimer = 1.65;
      defender.knockdowns += 1;
      pushEvent(state, {
        type: 'knockdown',
        actorSlot: attacker.slot,
        targetSlot: defender.slot,
        x: defender.x,
        y: 0.4,
        z: defender.z,
      });
    } else if (def.isHeavy && defender.headIntegrity < 65 && koRisk > 0.25) {
      defender.rockedTimer = 2.0;
      pushEvent(state, {
        type: 'rocked',
        actorSlot: attacker.slot,
        targetSlot: defender.slot,
        x: defender.x,
        y: 1.65,
        z: defender.z,
      });
    }
  }
  return false;
}

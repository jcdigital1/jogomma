import React, { useRef, useState } from 'react';
import { Maximize2, Pause, Volume2, VolumeX } from 'lucide-react';
import { FIGHTER_PROFILES, MOVES } from '../shared/combatEngine.ts';
import { FighterInput, MatchState } from '../shared/types.ts';
import { requestLandscapeFullscreen } from './OrientationGuard.tsx';

interface FightHUDProps {
  match: MatchState;
  playerSlot: 0 | 1;
  muted: boolean;
  latencyMs: number | null;
  isMultiplayer: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onTouchMove: (mx: number, mz: number) => void;
  onTouchAction: (
    action: keyof Omit<FighterInput, 'moveX' | 'moveZ'>,
    pressed: boolean,
  ) => void;
}

function formatClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

interface FaceButtonProps {
  symbol: string;
  actionLabel: string;
  ringColor: string;
  bgGradient: string;
  symbolColor: string;
  onPressChange: (pressed: boolean) => void;
}

const GamepadFaceButton: React.FC<FaceButtonProps> = ({
  symbol,
  actionLabel,
  ringColor,
  bgGradient,
  symbolColor,
  onPressChange,
}) => {
  const [active, setActive] = useState(false);

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActive(true);
    onPressChange(true);
  };

  const handleUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    onPressChange(false);
  };

  return (
    <button
      type="button"
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={() => {
        setActive(false);
        onPressChange(false);
      }}
      style={{ touchAction: 'none' }}
      className={`flex h-13 w-13 sm:h-15 sm:w-15 flex-col items-center justify-center rounded-full border-2 shadow-[0_4px_12px_rgba(0,0,0,0.7)] transition-transform duration-75 select-none ${ringColor} ${bgGradient} ${
        active ? 'scale-90 brightness-125 ring-2 ring-white' : ''
      }`}
    >
      <span
        className={`font-display text-lg sm:text-xl font-extrabold leading-none ${symbolColor}`}
      >
        {symbol}
      </span>
      <span className="mt-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-tight leading-none text-white/90 whitespace-nowrap">
        {actionLabel}
      </span>
    </button>
  );
};

interface TriggerButtonProps {
  badge: string;
  label: string;
  colorClass: string;
  onPressChange: (pressed: boolean) => void;
}

const GamepadTriggerButton: React.FC<TriggerButtonProps> = ({
  badge,
  label,
  colorClass,
  onPressChange,
}) => {
  const [active, setActive] = useState(false);

  const handleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActive(true);
    onPressChange(true);
  };

  const handleUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    onPressChange(false);
  };

  return (
    <button
      type="button"
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onLostPointerCapture={() => {
        setActive(false);
        onPressChange(false);
      }}
      style={{ touchAction: 'none' }}
      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-md transition-transform duration-75 select-none ${colorClass} ${
        active ? 'scale-92 brightness-125 ring-2 ring-white/80' : ''
      }`}
    >
      <span className="rounded bg-black/50 px-1 py-0.5 font-mono-tabular text-[9px] font-bold text-white/90">
        {badge}
      </span>
      <span className="font-display text-xs sm:text-sm font-bold tracking-wide text-white whitespace-nowrap">
        {label}
      </span>
    </button>
  );
};

export const FightHUD: React.FC<FightHUDProps> = ({
  match,
  playerSlot,
  muted,
  latencyMs,
  isMultiplayer,
  onToggleMute,
  onPause,
  onTouchMove,
  onTouchAction,
}) => {
  const f0 = match.fighters[0];
  const f1 = match.fighters[1];
  const p0 = FIGHTER_PROFILES[f0.profileId];
  const p1 = FIGHTER_PROFILES[f1.profileId];
  const localFighter = match.fighters[playerSlot];

  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyPointerId = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const maxRadius = 40;

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobPos({ x: dx, y: dy });
    onTouchMove(dx / maxRadius, dy / maxRadius);
  };

  const resetJoystick = () => {
    joyPointerId.current = null;
    setKnobPos({ x: 0, y: 0 });
    onTouchMove(0, 0);
  };

  const isLowClock = match.roundClock <= 10 && match.phase === 'fighting';
  const isGroundTop = localFighter.posture === 'ground_top';
  const isGroundBot = localFighter.posture === 'ground_bottom';
  const isClinch = localFighter.posture === 'clinch';
  const subActive =
    f0.activeMove === 'submission_attempt' ||
    f1.activeMove === 'submission_attempt';
  const subProgress = Math.max(f0.submissionProgress, f1.submissionProgress);

  const recentCounter = match.events.some(
    (ev, idx) =>
      idx >= match.events.length - 4 &&
      ev.type === 'strike_hit' &&
      ev.isCounter &&
      ev.actorSlot === playerSlot,
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between safe-area-hud">
      {/* TOP FIGHT HUD BAR WITH PORTRAIT AVATARS */}
      <div className="flex items-start justify-between gap-2 sm:gap-4 px-1">
        {/* FIGHTER 1 (LEFT - RED) */}
        <div className="flex flex-1 max-w-[39%] items-center gap-2">
          <div className="h-9 w-9 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg border-2 border-[#d91e2a] bg-[#11141c]">
            <img
              src={p0.avatarUrl}
              alt={p0.name}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display text-sm sm:text-lg font-bold tracking-wider text-white truncate">
                {p0.shortName}
                {playerSlot === 0 ? ' (VOCÊ)' : ''}
              </span>
              <span className="font-mono-tabular text-[10px] sm:text-xs text-slate-300">
                {Math.ceil(f0.health)}%
              </span>
            </div>
            <div className="h-3 sm:h-3.5 w-full overflow-hidden rounded-sm border border-white/25 bg-black/80">
              <div
                className="h-full bg-gradient-to-r from-[#991b1b] to-[#ef4444] transition-[width] duration-75"
                style={{ width: `${Math.max(0, f0.health)}%` }}
              />
            </div>
            <div className="mt-1 h-1.5 sm:h-2 w-[88%] overflow-hidden rounded-sm bg-black/75 border border-white/10">
              <div
                className="h-full bg-amber-400 transition-[width] duration-75"
                style={{ width: `${Math.max(0, f0.stamina)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[9px] sm:text-[10px] font-mono-tabular text-slate-300">
              <span>CAB {Math.round(f0.headIntegrity)}%</span>
              <span className="text-slate-600">·</span>
              <span>CRP {Math.round(f0.bodyIntegrity)}%</span>
              <span className="text-slate-600">·</span>
              <span>PRN {Math.round(f0.legIntegrity)}%</span>
            </div>
          </div>
        </div>

        {/* CENTER ROUND CLOCK */}
        <div className="flex flex-col items-center shrink-0">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#0b0d13]/92 px-3 py-1 sm:px-4 sm:py-1.5">
            <span className="font-display text-xs sm:text-base font-bold tracking-wider text-slate-200 whitespace-nowrap">
              ROUND {match.round}
            </span>
            <span className="text-slate-500">—</span>
            <span
              className={`font-mono-tabular text-sm sm:text-lg font-bold ${
                isLowClock ? 'text-[#ef4444]' : 'text-white'
              }`}
            >
              {formatClock(match.roundClock)}
            </span>
          </div>

          <div className="pointer-events-auto mt-1.5 flex items-center gap-2">
            <button
              type="button"
              onClick={onPause}
              aria-label="Pausar luta"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-[#0b0d13]/88 text-slate-200 hover:bg-white/10 active:scale-95"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Ativar som' : 'Silenciar'}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-[#0b0d13]/88 text-slate-200 hover:bg-white/10 active:scale-95"
            >
              {muted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => requestLandscapeFullscreen(true)}
              aria-label="Tela Cheia"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/15 bg-[#0b0d13]/88 text-slate-200 hover:bg-white/10 active:scale-95"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            {isMultiplayer && latencyMs !== null && (
              <span className="font-mono-tabular text-[10px] text-slate-300 bg-[#0b0d13]/85 px-1.5 py-0.5 rounded border border-white/10">
                {latencyMs}ms
              </span>
            )}
          </div>
        </div>

        {/* FIGHTER 2 (RIGHT - BLUE) */}
        <div className="flex flex-1 max-w-[39%] items-center gap-2 justify-end">
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-mono-tabular text-[10px] sm:text-xs text-slate-300">
                {Math.ceil(f1.health)}%
              </span>
              <span className="font-display text-sm sm:text-lg font-bold tracking-wider text-white truncate">
                {playerSlot === 1 ? '(VOCÊ) ' : ''}
                {p1.shortName}
              </span>
            </div>
            <div className="h-3 sm:h-3.5 w-full overflow-hidden rounded-sm border border-white/25 bg-black/80">
              <div
                className="ml-auto h-full bg-gradient-to-l from-[#1e40af] to-[#3b82f6] transition-[width] duration-75"
                style={{ width: `${Math.max(0, f1.health)}%` }}
              />
            </div>
            <div className="ml-auto mt-1 h-1.5 sm:h-2 w-[88%] overflow-hidden rounded-sm bg-black/75 border border-white/10">
              <div
                className="ml-auto h-full bg-amber-400 transition-[width] duration-75"
                style={{ width: `${Math.max(0, f1.stamina)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-end gap-2 text-[9px] sm:text-[10px] font-mono-tabular text-slate-300">
              <span>CAB {Math.round(f1.headIntegrity)}%</span>
              <span className="text-slate-600">·</span>
              <span>CRP {Math.round(f1.bodyIntegrity)}%</span>
              <span className="text-slate-600">·</span>
              <span>PRN {Math.round(f1.legIntegrity)}%</span>
            </div>
          </div>
          <div className="h-9 w-9 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-lg border-2 border-[#1d6feb] bg-[#11141c]">
            <img
              src={p1.avatarUrl}
              alt={p1.name}
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>
      </div>

      {/* CENTER PHASE / SUBMISSION / COMBO CALLOUT */}
      <div className="flex flex-col items-center justify-center">
        {match.phase === 'walkout' && (
          <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-[#0b0d13]/92 px-5 py-3">
            <img
              src={p0.avatarUrl}
              alt={p0.name}
              className="h-14 w-14 rounded-lg border-2 border-[#d91e2a] object-cover object-top"
            />
            <div className="text-center">
              <div className="text-[10px] font-bold tracking-widest text-slate-400">
                JZN MMA · EVENTO PRINCIPAL
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-wider text-white">
                <span className="text-[#ef4444]">{p0.shortName}</span>
                <span className="mx-2 text-slate-400">VS</span>
                <span className="text-[#3b82f6]">{p1.shortName}</span>
              </div>
            </div>
            <img
              src={p1.avatarUrl}
              alt={p1.name}
              className="h-14 w-14 rounded-lg border-2 border-[#1d6feb] object-cover object-top"
            />
          </div>
        )}

        {match.phase === 'countdown' && (
          <div className="font-display text-6xl sm:text-7xl font-extrabold tracking-widest text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.9)]">
            {Math.max(1, Math.ceil(match.phaseTimer))}
          </div>
        )}

        {match.phase === 'round_break' && (
          <div className="rounded-xl border border-white/15 bg-[#0b0d13]/92 px-6 py-3 text-center">
            <div className="font-display text-2xl font-bold tracking-wider text-white">
              FIM DO ROUND {match.round}
            </div>
            <div className="mt-1 text-xs text-slate-300">
              Recuperando fôlego · Próximo round em{' '}
              <span className="font-mono-tabular font-bold text-white">
                {Math.ceil(match.phaseTimer)}s
              </span>
            </div>
          </div>
        )}

        {match.phase === 'fighting' && subActive && (
          <div className="w-64 sm:w-80 rounded-xl border border-amber-400/50 bg-[#0b0d13]/92 px-4 py-2.5 text-center">
            <div className="font-display text-base font-bold tracking-wider text-amber-300">
              FINALIZAÇÃO ENCAIXADA!
            </div>
            <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-black border border-white/20">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-[width] duration-75"
                style={{ width: `${Math.min(100, subProgress)}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] text-slate-300">
              {localFighter.posture === 'ground_top'
                ? 'Toque rápido em RT (QUEDA) para finalizar!'
                : 'Toque em RB (ESQUIVA) + ANALÓGICO para escapar!'}
            </div>
          </div>
        )}

        {match.phase === 'fighting' &&
          !subActive &&
          (f0.rockedTimer > 0 || f1.rockedTimer > 0) && (
            <div className="rounded-md bg-[#d91e2a]/90 px-3 py-1 font-display text-sm font-bold tracking-widest text-white">
              ABALADO! CHANCE DE NOCAUTE
            </div>
          )}

        {match.phase === 'fighting' &&
          (localFighter.activeMove !== 'none' || localFighter.counterWindow > 0.1) && (
            <div className="mt-1 flex items-center gap-2 rounded bg-[#090b10]/85 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white">
              {localFighter.activeMove !== 'none' && (
                <span>{MOVES[localFighter.activeMove].label}</span>
              )}
              {localFighter.comboStep > 0 && (
                <span className="text-amber-400">
                  COMBO x{localFighter.comboStep + 1}
                </span>
              )}
              {(recentCounter || localFighter.counterWindow > 0.1) && (
                <span className="text-emerald-400">CONTRAGOLPE!</span>
              )}
            </div>
          )}
      </div>

      {/* BOTTOM CONSOLE GAMEPAD CONTROLS: ANALOG STICK LEFT + X / Y / A / B-CIRCLE RIGHT */}
      <div className="flex items-end justify-between px-1 pb-1">
        {/* LEFT: CONSOLE ANALOG THUMBSTICK */}
        <div className="flex flex-col items-start gap-2">
          <div className="pointer-events-auto flex gap-1.5">
            <GamepadTriggerButton
              badge="LB"
              label="DEFESA"
              colorClass="border-blue-400/50 bg-[#1e3a8a]/90"
              onPressChange={(p) => onTouchAction('block', p)}
            />
            <GamepadTriggerButton
              badge="LT"
              label="CLINCH"
              colorClass="border-slate-400/40 bg-[#1e2433]/90"
              onPressChange={(p) => onTouchAction('clinch', p)}
            />
          </div>

          <div
            ref={joyRef}
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              joyPointerId.current = e.pointerId;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (joyPointerId.current !== e.pointerId) return;
              e.preventDefault();
              updateJoystick(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (joyPointerId.current !== e.pointerId) return;
              e.preventDefault();
              resetJoystick();
            }}
            onPointerCancel={resetJoystick}
            onLostPointerCapture={resetJoystick}
            style={{ touchAction: 'none' }}
            className="pointer-events-auto relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-2 border-white/25 bg-[#0c0f17]/82 shadow-[inset_0_2px_14px_rgba(0,0,0,0.8)]"
          >
            <div className="pointer-events-none absolute inset-3 rounded-full border border-white/10" />
            {/* 4 Directional Indicator Ticks */}
            <div className="pointer-events-none absolute top-2 h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="pointer-events-none absolute bottom-2 h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="pointer-events-none absolute left-2 h-1.5 w-1.5 rounded-full bg-white/30" />
            <div className="pointer-events-none absolute right-2 h-1.5 w-1.5 rounded-full bg-white/30" />

            <div
              className="pointer-events-none h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-white/50 bg-gradient-to-b from-slate-600 to-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
              style={{
                transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
              }}
            />
          </div>
        </div>

        {/* RIGHT: CONSOLE DIAMOND FACE BUTTONS (X, Y, A, B/○) + RB/RT */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          {/* Shoulder / Trigger Row (RB + RT) */}
          <div className="flex items-center gap-1.5">
            <GamepadTriggerButton
              badge="RB"
              label={isGroundBot ? 'LEVANTAR' : isClinch ? 'SAIR' : 'ESQUIVA'}
              colorClass="border-slate-400/40 bg-[#1e2433]/90"
              onPressChange={(p) => onTouchAction('dodge', p)}
            />
            <GamepadTriggerButton
              badge="RT"
              label={isGroundTop ? 'FINALIZAR' : 'QUEDA'}
              colorClass="border-amber-400/50 bg-[#7c2d12]/92"
              onPressChange={(p) => onTouchAction('takedown', p)}
            />
          </div>

          {/* Classic Console 4-Button Diamond Grid: Y (Top), X (Left), ○/B (Right), A (Bottom) */}
          <div className="grid grid-cols-3 grid-rows-3 items-center justify-items-center gap-0.5 w-40 h-38 sm:w-44 sm:h-42">
            {/* Top: Y */}
            <div className="col-start-2 row-start-1">
              <GamepadFaceButton
                symbol="Y"
                actionLabel="FORTE"
                ringColor="border-amber-300/80"
                bgGradient="bg-gradient-to-b from-amber-500 to-amber-700"
                symbolColor="text-white"
                onPressChange={(p) => onTouchAction('heavyPunch', p)}
              />
            </div>

            {/* Left: X */}
            <div className="col-start-1 row-start-2">
              <GamepadFaceButton
                symbol="X"
                actionLabel={isGroundTop ? 'G&P' : 'SOCO'}
                ringColor="border-sky-300/80"
                bgGradient="bg-gradient-to-b from-blue-500 to-blue-800"
                symbolColor="text-white"
                onPressChange={(p) => onTouchAction('punch', p)}
              />
            </div>

            {/* Right: ○ / B */}
            <div className="col-start-3 row-start-2">
              <GamepadFaceButton
                symbol="○"
                actionLabel="CHUTE ALTO"
                ringColor="border-rose-300/85"
                bgGradient="bg-gradient-to-b from-[#e11d48] to-[#9f1239]"
                symbolColor="text-white"
                onPressChange={(p) => onTouchAction('highKick', p)}
              />
            </div>

            {/* Bottom: A */}
            <div className="col-start-2 row-start-3">
              <GamepadFaceButton
                symbol="A"
                actionLabel={isClinch ? 'JOELHO' : 'CHUTE'}
                ringColor="border-emerald-300/80"
                bgGradient="bg-gradient-to-b from-emerald-500 to-emerald-800"
                symbolColor="text-white"
                onPressChange={(p) => onTouchAction('kick', p)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

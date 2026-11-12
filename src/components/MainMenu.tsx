import React from 'react';
import {
  Dumbbell,
  Maximize2,
  Play,
  Settings,
  Users,
  Wifi,
} from 'lucide-react';
import { FIGHTER_PROFILES } from '../shared/combatEngine.ts';
import { FighterId } from '../shared/types.ts';
import { requestLandscapeFullscreen } from './OrientationGuard.tsx';

interface MainMenuProps {
  selectedFighter: FighterId;
  onQuickPlay: () => void;
  onMultiplayer: () => void;
  onTraining: () => void;
  onSelectFighter: () => void;
  onSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedFighter,
  onQuickPlay,
  onMultiplayer,
  onTraining,
  onSelectFighter,
  onSettings,
}) => {
  const fighter = FIGHTER_PROFILES[selectedFighter];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between safe-area-hud">
      {/* Top minimal bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 36 36"
            className="h-8 w-8 shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <polygon
              points="11,2 25,2 34,11 34,25 25,34 11,34 2,25 2,11"
              stroke="#ffffff"
              strokeWidth="2.2"
              fill="#0f1218"
            />
            <polygon
              points="13,7 23,7 29,13 29,23 23,29 13,29 7,23 7,13"
              stroke="#d91e2a"
              strokeWidth="1.6"
            />
          </svg>
          <div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold tracking-wider text-white leading-none">
              JZN <span className="text-[#d91e2a]">MMA</span>
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              Arena 3D · Mobile Multiplayer
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => requestLandscapeFullscreen(true)}
          className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0d1017]/90 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 active:scale-95"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">Tela Cheia</span>
        </button>
      </div>

      {/* Left Menu Column leaving Center/Right 3D Octagon Showcase Unobstructed */}
      <div className="flex items-end justify-between px-2 pb-1">
        <div className="pointer-events-auto w-64 sm:w-72 space-y-2 rounded-2xl border border-white/15 bg-[#090b10]/88 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between gap-2 border-b border-white/10 pb-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={fighter.avatarUrl}
                alt={fighter.name}
                className={`h-8 w-8 shrink-0 rounded-lg border object-cover object-top ${
                  fighter.cornerColor === 'red'
                    ? 'border-[#d91e2a]'
                    : 'border-[#1d6feb]'
                }`}
              />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 leading-none">
                  Seu Lutador
                </div>
                <div
                  className={`truncate font-display text-sm font-bold tracking-wide leading-tight ${
                    fighter.cornerColor === 'red'
                      ? 'text-[#ef4444]'
                      : 'text-[#3b82f6]'
                  }`}
                >
                  {fighter.name}
                </div>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-medium text-slate-400">
              {fighter.cornerColor === 'red' ? 'Vermelho' : 'Azul'}
            </span>
          </div>

          <button
            type="button"
            onClick={onQuickPlay}
            className="flex w-full items-center justify-between rounded-xl bg-[#d91e2a] px-4 py-2.5 text-left font-display text-lg font-bold tracking-wider text-white transition-transform hover:bg-[#c01924] active:scale-98"
          >
            <span>JOGAR</span>
            <Play className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={onMultiplayer}
            className="flex w-full items-center justify-between rounded-xl border border-blue-500/40 bg-[#1d6feb]/20 px-4 py-2 text-left font-display text-base font-bold tracking-wider text-white transition-colors hover:bg-[#1d6feb]/35 active:scale-98"
          >
            <span>MULTIPLAYER</span>
            <Wifi className="h-4 w-4 text-blue-400" />
          </button>

          <button
            type="button"
            onClick={onTraining}
            className="flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-left font-display text-base font-bold tracking-wider text-slate-100 transition-colors hover:bg-white/10 active:scale-98"
          >
            <span>TREINO</span>
            <Dumbbell className="h-4 w-4 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={onSelectFighter}
            className="flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-left font-display text-base font-bold tracking-wider text-slate-100 transition-colors hover:bg-white/10 active:scale-98"
          >
            <span>SELECIONAR LUTADOR</span>
            <Users className="h-4 w-4 text-slate-300" />
          </button>

          <button
            type="button"
            onClick={onSettings}
            className="flex w-full items-center justify-between rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-left font-display text-base font-bold tracking-wider text-slate-100 transition-colors hover:bg-white/10 active:scale-98"
          >
            <span>CONFIGURAÇÕES</span>
            <Settings className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        {/* Subtle flat control hint on desktop/mobile bottom-right */}
        <div className="hidden sm:block rounded-lg border border-white/10 bg-[#090b10]/80 px-3 py-1.5 text-[11px] text-slate-300">
          Controle: Analógico + Botões X/Y/A/○ · Teclado: WASD Mover · J/K Socos · L/U Chutes · I Defesa · Espaço Esquiva · Q Queda · E Clinch
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import { FIGHTER_PROFILES } from '../shared/combatEngine.ts';
import { MatchState } from '../shared/types.ts';

interface ResultModalProps {
  match: MatchState;
  playerSlot: 0 | 1;
  onRematch: () => void;
  onMenu: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  match,
  playerSlot,
  onRematch,
  onMenu,
}) => {
  const result = match.result;
  if (!result) return null;

  const winner = FIGHTER_PROFILES[result.winnerId];
  const f0 = match.fighters[0];
  const f1 = match.fighters[1];
  const p0 = FIGHTER_PROFILES[f0.profileId];
  const p1 = FIGHTER_PROFILES[f1.profileId];
  const isPlayerWinner = result.winnerSlot === playerSlot;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#07080b]/82 p-4 safe-area-hud">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0e1118] p-5 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={winner.avatarUrl}
              alt={winner.name}
              className={`h-20 w-20 rounded-2xl border-2 object-cover object-top shadow-lg ${
                winner.cornerColor === 'red'
                  ? 'border-[#d91e2a]'
                  : 'border-[#1d6feb]'
              }`}
            />
            <div
              className={`absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border bg-[#0e1118] ${
                winner.cornerColor === 'red'
                  ? 'border-red-500 text-red-400'
                  : 'border-blue-500 text-blue-400'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="mt-2 text-xs font-semibold tracking-widest text-slate-400">
            {isPlayerWinner ? 'VITÓRIA NO OCTÓGONO' : 'FIM DE COMBATE'}
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider text-white">
            {winner.name} VENCEU
          </h2>

          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-amber-300">
            <span>{result.method}</span>
            <span className="text-slate-500">·</span>
            <span className="font-mono-tabular text-white">
              R{result.round} ({formatTime(result.roundTimeElapsed)})
            </span>
          </div>
        </div>

        {/* Fight Stats Comparison */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#141822] p-3 text-xs">
          <div className="grid grid-cols-3 text-center font-bold border-b border-white/10 pb-2 mb-2">
            <span className="text-red-400">{p0.shortName}</span>
            <span className="text-slate-400">ESTATÍSTICAS</span>
            <span className="text-blue-400">{p1.shortName}</span>
          </div>

          {[
            {
              label: 'Golpes Conectados',
              v0: `${f0.strikesLanded}/${f0.strikesThrown}`,
              v1: `${f1.strikesLanded}/${f1.strikesThrown}`,
            },
            {
              label: 'Quedas',
              v0: String(f0.takedownsLanded),
              v1: String(f1.takedownsLanded),
            },
            {
              label: 'Knockdowns',
              v0: String(f0.knockdowns),
              v1: String(f1.knockdowns),
            },
            {
              label: 'Vida Restante',
              v0: `${Math.ceil(f0.health)}%`,
              v1: `${Math.ceil(f1.health)}%`,
            },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 py-1 text-center items-center"
            >
              <span className="font-mono-tabular font-semibold text-white">
                {row.v0}
              </span>
              <span className="text-slate-400 text-[11px]">{row.label}</span>
              <span className="font-mono-tabular font-semibold text-white">
                {row.v1}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onRematch}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d91e2a] py-2.5 font-display text-lg font-bold tracking-wider text-white hover:bg-[#c01924] active:scale-98"
          >
            <RotateCcw className="h-4 w-4" />
            <span>REVANCHE</span>
          </button>

          <button
            type="button"
            onClick={onMenu}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 py-2.5 font-display text-lg font-bold tracking-wider text-white hover:bg-white/15 active:scale-98"
          >
            <Home className="h-4 w-4" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { FIGHTER_PROFILES } from '../shared/combatEngine.ts';
import { FighterId } from '../shared/types.ts';

interface FighterSelectProps {
  selected: FighterId;
  onPreviewChange: (id: FighterId) => void;
  onConfirm: (id: FighterId) => void;
  onBack: () => void;
}

export const FighterSelect: React.FC<FighterSelectProps> = ({
  selected,
  onPreviewChange,
  onConfirm,
  onBack,
}) => {
  const profile = FIGHTER_PROFILES[selected];
  const isJean = selected === 'jean';

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between safe-area-hud">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#090b10]/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </button>

        <div className="font-display text-xl sm:text-2xl font-bold tracking-wider text-white">
          SELECIONAR LUTADOR
        </div>

        <div className="w-20" />
      </div>

      {/* Right Side Fighter Card (leaving Left/Center 3D Character fully visible) */}
      <div className="flex items-end justify-between px-2 pb-1">
        {/* Bottom-left quick fighter tabs */}
        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => onPreviewChange('jean')}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
              isJean
                ? 'border-[#d91e2a] bg-[#d91e2a]/25 text-white'
                : 'border-white/15 bg-[#090b10]/88 text-slate-300 hover:bg-white/10'
            }`}
          >
            <img
              src={FIGHTER_PROFILES.jean.avatarUrl}
              alt={FIGHTER_PROFILES.jean.name}
              className="h-11 w-11 shrink-0 rounded-lg border border-[#d91e2a]/60 object-cover object-top"
            />
            <div>
              <div className="font-display text-lg font-bold leading-none">
                JEAN
              </div>
              <div className="mt-1 text-[10px] text-slate-300">
                Luvas Vermelhas · Trocação
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onPreviewChange('charles')}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors ${
              !isJean
                ? 'border-[#1d6feb] bg-[#1d6feb]/25 text-white'
                : 'border-white/15 bg-[#090b10]/88 text-slate-300 hover:bg-white/10'
            }`}
          >
            <img
              src={FIGHTER_PROFILES.charles.avatarUrl}
              alt={FIGHTER_PROFILES.charles.name}
              className="h-11 w-11 shrink-0 rounded-lg border border-[#1d6feb]/60 object-cover object-top"
            />
            <div>
              <div className="font-display text-lg font-bold leading-none">
                CHARLES DO BRONX
              </div>
              <div className="mt-1 text-[10px] text-slate-300">
                Luvas Azuis · Finalizações
              </div>
            </div>
          </button>
        </div>

        {/* Right Info Panel */}
        <div className="pointer-events-auto w-76 sm:w-88 rounded-2xl border border-white/15 bg-[#090b10]/92 p-4">
          <div className="flex items-center gap-3">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className={`h-16 w-16 shrink-0 rounded-xl border-2 object-cover object-top ${
                isJean ? 'border-[#d91e2a]' : 'border-[#1d6feb]'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={`text-[11px] font-bold tracking-wider ${
                    isJean ? 'text-[#ef4444]' : 'text-[#3b82f6]'
                  }`}
                >
                  {isJean ? 'CORNER VERMELHO' : 'CORNER AZUL'}
                </div>
                <span className="text-[11px] font-medium text-slate-400 truncate">
                  "{profile.nickname}"
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide text-white leading-tight truncate">
                {profile.name}
              </h2>
            </div>
          </div>

          <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
            {profile.traits}
          </p>

          {/* Attribute Bars */}
          <div className="mt-3 space-y-2 text-xs">
            {[
              { label: 'Trocação', val: profile.stats.striking },
              { label: 'Chutes', val: profile.stats.kicking },
              { label: 'Luta Agarrada', val: profile.stats.grappling },
              { label: 'Resistência', val: profile.stats.cardio },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-[11px] text-slate-300 mb-0.5">
                  <span>{s.label}</span>
                  <span className="font-mono-tabular font-semibold text-white">
                    {s.val}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full ${
                      isJean ? 'bg-[#d91e2a]' : 'bg-[#1d6feb]'
                    }`}
                    style={{ width: `${s.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] leading-snug text-slate-300">
            {isJean
              ? 'Jzn MMA · Óculos armação fina, barba cheia, fechamento no braço esquerdo (coroa, leão e cruz) e luvas vermelhas.'
              : 'Jzn MMA · Cabelo escuro curto, tatuagens no braço direito e esquerdo, calção preto/azul e luvas azuis.'}
          </div>

          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-display text-lg font-bold tracking-wider text-white transition-transform active:scale-98 ${
              isJean
                ? 'bg-[#d91e2a] hover:bg-[#c01924]'
                : 'bg-[#1d6feb] hover:bg-[#185ec9]'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>CONFIRMAR LUTADOR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

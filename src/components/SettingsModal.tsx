import React from 'react';
import { X } from 'lucide-react';
import { AIDifficulty, GraphicsQuality } from '../shared/types.ts';

interface SettingsModalProps {
  quality: GraphicsQuality;
  aiDifficulty: AIDifficulty;
  muted: boolean;
  haptics: boolean;
  onChangeQuality: (q: GraphicsQuality) => void;
  onChangeDifficulty: (d: AIDifficulty) => void;
  onToggleMuted: () => void;
  onToggleHaptics: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  quality,
  aiDifficulty,
  muted,
  haptics,
  onChangeQuality,
  onChangeDifficulty,
  onToggleMuted,
  onToggleHaptics,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#07080b]/85 p-4 safe-area-hud">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0e1118] p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="font-display text-2xl font-bold tracking-wider text-white">
            CONFIGURAÇÕES
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          {/* Graphics Quality */}
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">
              Qualidade Gráfica (30–60 FPS Mobile)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'low', label: 'Baixo' },
                  { id: 'medium', label: 'Médio' },
                  { id: 'high', label: 'Alto' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeQuality(opt.id)}
                  className={`rounded-lg border py-2 text-xs font-bold transition-colors ${
                    quality === opt.id
                      ? 'border-[#d91e2a] bg-[#d91e2a]/25 text-white'
                      : 'border-white/10 bg-[#141822] text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Difficulty */}
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">
              Dificuldade da IA (Modo Treino)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'easy', label: 'Fácil' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'hard', label: 'Campeão' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeDifficulty(opt.id)}
                  className={`rounded-lg border py-2 text-xs font-bold transition-colors ${
                    aiDifficulty === opt.id
                      ? 'border-[#1d6feb] bg-[#1d6feb]/25 text-white'
                      : 'border-white/10 bg-[#141822] text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audio & Haptics */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onToggleMuted}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${
                !muted
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-[#141822] text-slate-400'
              }`}
            >
              Som da Arena: {muted ? 'DESATIVADO' : 'ATIVADO'}
            </button>

            <button
              type="button"
              onClick={onToggleHaptics}
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${
                haptics
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-[#141822] text-slate-400'
              }`}
            >
              Vibração em Impactos: {haptics ? 'ATIVADA' : 'DESATIVADA'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-white py-2.5 font-display text-lg font-bold tracking-wider text-[#07080b] hover:bg-slate-200"
        >
          CONCLUÍDO
        </button>
      </div>
    </div>
  );
};

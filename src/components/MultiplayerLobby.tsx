import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, Share2, Users, Wifi } from 'lucide-react';
import { FIGHTER_PROFILES } from '../shared/combatEngine.ts';
import { FighterId, RoomPlayerSummary } from '../shared/types.ts';

interface MultiplayerLobbyProps {
  roomCode: string | null;
  playerSlot: 0 | 1 | null;
  players: RoomPlayerSummary[];
  selectedFighter: FighterId;
  errorMsg: string | null;
  connected: boolean;
  latencyMs: number | null;
  initialJoinCode?: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onEnterWithPassword: (password: string) => void;
  onSelectFighter: (id: FighterId) => void;
  onToggleReady: (ready: boolean) => void;
  onBack: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  roomCode,
  playerSlot,
  players,
  selectedFighter,
  errorMsg,
  connected,
  latencyMs,
  initialJoinCode = '',
  onCreateRoom,
  onJoinRoom,
  onEnterWithPassword,
  onSelectFighter,
  onToggleReady,
  onBack,
}) => {
  const [joinInput, setJoinInput] = useState(initialJoinCode);
  const [passwordInput, setPasswordInput] = useState(initialJoinCode);
  const [copied, setCopied] = useState(false);

  const shareUrl = roomCode
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : '';

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const nativeShare = async () => {
    if (!roomCode) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Jzn MMA — Convite de Luta',
          text: `Entre na minha sala de Jzn MMA! Senha/Código: ${roomCode}`,
          url: shareUrl,
        });
      } catch {
        copyShare();
      }
    } else {
      copyShare();
    }
  };

  const myPlayer = players.find((p) => p.slot === playerSlot) ?? null;
  const oppPlayer = players.find((p) => p.slot !== playerSlot) ?? null;
  const bothPresent = players.length === 2;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#07080b]/88 p-3 sm:p-4 safe-area-hud overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0e1118] p-4 sm:p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-400" />
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-white">
              MULTIPLAYER ONLINE
            </h2>
          </div>

          <div className="font-mono-tabular text-xs text-slate-400">
            {connected
              ? latencyMs
                ? `Online · ${latencyMs}ms`
                : 'Conectado'
              : 'Servidor Pronto'}
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {!roomCode ? (
          /* Step 1: Enter Same Password to Instantly Fight + Secondary Invite Code */
          <div className="mt-3 space-y-3">
            {/* Quick Fighter Selection before entering */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                Seu lutador:
              </span>
              {(['jean', 'charles'] as FighterId[]).map((fid) => {
                const active = selectedFighter === fid;
                const fp = FIGHTER_PROFILES[fid];
                return (
                  <button
                    key={fid}
                    type="button"
                    onClick={() => onSelectFighter(fid)}
                    className={`flex flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-bold transition-colors ${
                      active
                        ? fid === 'jean'
                          ? 'border-[#d91e2a] bg-[#d91e2a]/25 text-white'
                          : 'border-[#1d6feb] bg-[#1d6feb]/25 text-white'
                        : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    <img
                      src={fp.avatarUrl}
                      alt={fp.shortName}
                      className="h-7 w-7 shrink-0 rounded object-cover object-top"
                    />
                    <span className="truncate">{fp.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Primary: Password Matchmaking */}
              <div className="rounded-xl border border-[#d91e2a]/45 bg-[#141822] p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#ef4444]">
                    MODO RÁPIDO POR SENHA
                  </div>
                  <h3 className="mt-0.5 font-display text-xl font-bold text-white">
                    ENTRAR COM SENHA
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-300 leading-snug">
                    Você e seu amigo digitam a mesma senha e já caem direto na luta!
                  </p>
                  <input
                    type="text"
                    maxLength={16}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value.toUpperCase())}
                    placeholder="EX: JZN123 ou 2026"
                    className="mt-2.5 w-full rounded-lg border border-white/20 bg-black/65 px-3 py-2 text-center font-mono-tabular text-base font-bold tracking-[0.18em] text-white uppercase focus:border-[#d91e2a] focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={passwordInput.trim().length < 3}
                  onClick={() => onEnterWithPassword(passwordInput.trim())}
                  className="mt-3 w-full rounded-xl bg-[#d91e2a] py-2.5 font-display text-lg font-bold tracking-wider text-white disabled:opacity-40 hover:bg-[#c01924] active:scale-98"
                >
                  ENTRAR E LUTAR
                </button>
              </div>

              {/* Secondary: Random Code / Share Link */}
              <div className="rounded-xl border border-white/10 bg-[#141822] p-3.5 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-blue-400">
                    CONVITE POR LINK OU CÓDIGO
                  </div>
                  <h3 className="mt-0.5 font-display text-xl font-bold text-white">
                    SALA COM LINK
                  </h3>
                  <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                    Gere um código automático para enviar no WhatsApp, ou entre com um código recebido:
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <input
                      type="text"
                      maxLength={16}
                      value={joinInput}
                      onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black/60 px-2.5 py-2 text-center font-mono-tabular text-sm font-bold tracking-[0.18em] text-white uppercase focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={joinInput.trim().length < 3}
                      onClick={() => onJoinRoom(joinInput.trim().toUpperCase())}
                      className="rounded-lg bg-[#1d6feb] px-3 py-2 font-display text-sm font-bold tracking-wider text-white disabled:opacity-40 hover:bg-[#185ec9]"
                    >
                      ENTRAR
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCreateRoom}
                  className="mt-3 w-full rounded-xl border border-blue-500/40 bg-[#1d6feb]/20 py-2 font-display text-base font-bold tracking-wider text-white hover:bg-[#1d6feb]/35 active:scale-98"
                >
                  GERAR CÓDIGO ALEATÓRIO
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Inside Room — Share Password/Code, Waiting or Ready */
          <div className="mt-4 space-y-4">
            {/* Room Code & Share Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#141822] px-4 py-3">
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-slate-400">
                  SENHA / CÓDIGO DA SALA
                </div>
                <div className="font-mono-tabular text-2xl font-bold tracking-[0.2em] text-white">
                  {roomCode}
                </div>
                {!bothPresent && (
                  <div className="text-[11px] text-emerald-400">
                    Peça para seu amigo digitar a mesma senha ({roomCode}) para a luta começar na hora!
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyShare}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
                <button
                  type="button"
                  onClick={nativeShare}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1d6feb] px-3 py-2 text-xs font-semibold text-white hover:bg-[#185ec9]"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>

            {/* Two Players Status & Fighter Pick */}
            <div className="grid grid-cols-2 gap-3">
              {/* Local Player */}
              <div className="rounded-xl border border-white/15 bg-[#141822] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">
                    VOCÊ (CORNER {playerSlot === 0 ? 'VERMELHO' : 'AZUL'})
                  </span>
                  <span
                    className={`font-semibold ${
                      myPlayer?.ready ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {myPlayer?.ready ? 'PRONTO' : 'Escolhendo'}
                  </span>
                </div>

                <div className="mt-2.5 flex gap-2">
                  {(['jean', 'charles'] as FighterId[]).map((fid) => {
                    const active = selectedFighter === fid;
                    const fp = FIGHTER_PROFILES[fid];
                    return (
                      <button
                        key={fid}
                        type="button"
                        onClick={() => onSelectFighter(fid)}
                        className={`flex flex-1 items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs font-bold transition-colors ${
                          active
                            ? fid === 'jean'
                              ? 'border-[#d91e2a] bg-[#d91e2a]/30 text-white'
                              : 'border-[#1d6feb] bg-[#1d6feb]/30 text-white'
                            : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                        }`}
                      >
                        <img
                          src={fp.avatarUrl}
                          alt={fp.shortName}
                          className="h-8 w-8 shrink-0 rounded-md object-cover object-top"
                        />
                        <span className="truncate">{fp.shortName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opponent */}
              <div className="rounded-xl border border-white/15 bg-[#141822] p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">ADVERSÁRIO</span>
                  {oppPlayer ? (
                    <span
                      className={`font-semibold ${
                        oppPlayer.ready ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {oppPlayer.ready ? 'PRONTO' : 'Na sala'}
                    </span>
                  ) : (
                    <span className="text-slate-400">Aguardando...</span>
                  )}
                </div>

                {oppPlayer ? (
                  <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5">
                    <img
                      src={FIGHTER_PROFILES[oppPlayer.fighterId].avatarUrl}
                      alt={FIGHTER_PROFILES[oppPlayer.fighterId].name}
                      className="h-9 w-9 shrink-0 rounded-md object-cover object-top"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-display text-base font-bold text-white leading-tight">
                        {FIGHTER_PROFILES[oppPlayer.fighterId].name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {oppPlayer.connected ? 'Conectado' : 'Reconectando...'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/15 py-2.5 text-xs text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>Envie o código {roomCode} para o 2º celular</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!bothPresent}
              onClick={() => onToggleReady(!(myPlayer?.ready ?? false))}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-display text-xl font-bold tracking-wider text-white transition-all ${
                myPlayer?.ready
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-[#d91e2a] hover:bg-[#c01924]'
              } disabled:opacity-40`}
            >
              <Check className="h-5 w-5" />
              <span>
                {!bothPresent
                  ? 'AGUARDANDO ADVERSÁRIO ENTRAR...'
                  : myPlayer?.ready
                    ? 'PRONTO! AGUARDANDO ADVERSÁRIO...'
                    : 'CONFIRMAR QUE ESTOU PRONTO'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

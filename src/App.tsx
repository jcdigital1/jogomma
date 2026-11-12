import { useCallback, useEffect, useRef, useState } from 'react';
import { FighterSelect } from './components/FighterSelect.tsx';
import { FightHUD } from './components/FightHUD.tsx';
import { MainMenu } from './components/MainMenu.tsx';
import { MultiplayerLobby } from './components/MultiplayerLobby.tsx';
import {
  OrientationGuard,
  requestLandscapeFullscreen,
} from './components/OrientationGuard.tsx';
import { ResultModal } from './components/ResultModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AIController } from './game/aiController.ts';
import { ArenaSceneController } from './game/arenaScene.ts';
import { arenaAudio } from './game/audio.ts';
import { MultiplayerClient } from './game/multiplayerClient.ts';
import { createInitialMatch, stepMatch } from './shared/combatEngine.ts';
import {
  AIDifficulty,
  FighterId,
  FighterInput,
  GraphicsQuality,
  MatchState,
  RoomPlayerSummary,
} from './shared/types.ts';

type AppScreen = 'menu' | 'select' | 'lobby' | 'fighting';
type FightMode = 'local' | 'online';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ArenaSceneController | null>(null);
  const aiRef = useRef<AIController>(new AIController());
  const mpRef = useRef<MultiplayerClient | null>(null);

  const [screen, setScreen] = useState<AppScreen>('menu');
  const [fightMode, setFightMode] = useState<FightMode>('local');
  const [selectedFighter, setSelectedFighter] = useState<FighterId>('jean');
  const [quality, setQuality] = useState<GraphicsQuality>('medium');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal');
  const [muted, setMuted] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [paused, setPaused] = useState(false);

  // Match & Multiplayer State
  const [matchUi, setMatchUi] = useState<MatchState | null>(null);
  const matchRef = useRef<MatchState | null>(null);
  const screenRef = useRef<AppScreen>('menu');
  const fightModeRef = useRef<FightMode>('local');
  const pausedRef = useRef(false);
  const aiDiffRef = useRef<AIDifficulty>('normal');

  // Multiplayer room UI state
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerSlot, setPlayerSlot] = useState<0 | 1>(0);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayerSummary[]>([]);
  const [mpConnected, setMpConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [mpError, setMpError] = useState<string | null>(null);
  const [disconnectBanner, setDisconnectBanner] = useState<string | null>(null);
  const [initialInviteCode, setInitialInviteCode] = useState<string>('');

  // Mutable input state (zero-rerender for 60fps loop)
  const touchMoveRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchActionsRef = useRef<Omit<FighterInput, 'moveX' | 'moveZ'>>({
    punch: false,
    heavyPunch: false,
    kick: false,
    highKick: false,
    block: false,
    dodge: false,
    takedown: false,
    clinch: false,
  });
  const edgeBufferRef = useRef<Omit<FighterInput, 'moveX' | 'moveZ' | 'block'>>({
    punch: false,
    heavyPunch: false,
    kick: false,
    highKick: false,
    dodge: false,
    takedown: false,
    clinch: false,
  });
  const keysHeldRef = useRef<Set<string>>(new Set());
  const uiSyncCounterRef = useRef(0);
  const mpSendAccumRef = useRef(0);

  useEffect(() => {
    screenRef.current = screen;
    if (sceneRef.current) {
      if (screen === 'fighting') {
        sceneRef.current.setMode('fight', selectedFighter);
      } else if (screen === 'select') {
        sceneRef.current.setMode('select', selectedFighter);
      } else {
        sceneRef.current.setMode('menu', selectedFighter);
      }
    }
    arenaAudio.setMenuMusic(screen === 'menu' || screen === 'select');
  }, [screen, selectedFighter]);

  useEffect(() => {
    fightModeRef.current = fightMode;
  }, [fightMode]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    aiDiffRef.current = aiDifficulty;
  }, [aiDifficulty]);

  const buildLocalInput = useCallback((): FighterInput => {
    const keys = keysHeldRef.current;
    let jx = touchMoveRef.current.x;
    let jy = touchMoveRef.current.y;

    if (keys.has('KeyA') || keys.has('ArrowLeft')) jx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) jx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) jy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) jy += 1;

    const mag = Math.hypot(jx, jy);
    if (mag > 1) {
      jx /= mag;
      jy /= mag;
    }

    // Transform screen/joystick 2D direction relative to broadcast camera yaw
    const yaw = sceneRef.current ? sceneRef.current.getCameraYaw() : 0;
    const fwdX = Math.sin(yaw);
    const fwdZ = Math.cos(yaw);
    const rightX = -fwdZ;
    const rightZ = fwdX;

    // jy < 0 means joystick pushed UP (into screen / camera forward)
    const moveX = rightX * jx + fwdX * -jy;
    const moveZ = rightZ * jx + fwdZ * -jy;

    const inp: FighterInput = {
      moveX,
      moveZ,
      punch:
        touchActionsRef.current.punch ||
        edgeBufferRef.current.punch ||
        keys.has('KeyJ'),
      heavyPunch:
        touchActionsRef.current.heavyPunch ||
        edgeBufferRef.current.heavyPunch ||
        keys.has('KeyK'),
      kick:
        touchActionsRef.current.kick ||
        edgeBufferRef.current.kick ||
        keys.has('KeyL'),
      highKick:
        touchActionsRef.current.highKick ||
        edgeBufferRef.current.highKick ||
        keys.has('KeyU'),
      block:
        touchActionsRef.current.block ||
        keys.has('KeyI') ||
        keys.has('ShiftLeft') ||
        keys.has('ShiftRight'),
      dodge:
        touchActionsRef.current.dodge ||
        edgeBufferRef.current.dodge ||
        keys.has('Space'),
      takedown:
        touchActionsRef.current.takedown ||
        edgeBufferRef.current.takedown ||
        keys.has('KeyQ'),
      clinch:
        touchActionsRef.current.clinch ||
        edgeBufferRef.current.clinch ||
        keys.has('KeyE'),
    };

    edgeBufferRef.current = {
      punch: false,
      heavyPunch: false,
      kick: false,
      highKick: false,
      dodge: false,
      takedown: false,
      clinch: false,
    };

    return inp;
  }, []);

  // Mount Three.js Arena Scene once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const controller = new ArenaSceneController(mount, quality, (dt) => {
      if (screenRef.current !== 'fighting' || pausedRef.current) return;

      if (fightModeRef.current === 'local' && matchRef.current) {
        const pInput = buildLocalInput();
        const aiInput = aiRef.current.computeInput(
          matchRef.current,
          1,
          aiDiffRef.current,
          dt,
        );
        stepMatch(matchRef.current, [pInput, aiInput], dt);
        controller.setMatchState(matchRef.current);

        uiSyncCounterRef.current += 1;
        if (uiSyncCounterRef.current % 3 === 0 || matchRef.current.phase === 'finished') {
          setMatchUi({
            ...matchRef.current,
            fighters: [
              { ...matchRef.current.fighters[0] },
              { ...matchRef.current.fighters[1] },
            ],
          });
        }
      } else if (fightModeRef.current === 'online' && mpRef.current) {
        mpSendAccumRef.current += dt;
        const inp = buildLocalInput();
        const hasAction =
          inp.punch ||
          inp.heavyPunch ||
          inp.kick ||
          inp.highKick ||
          inp.dodge ||
          inp.takedown ||
          inp.clinch;
        if (hasAction || mpSendAccumRef.current >= 0.045) {
          mpSendAccumRef.current = 0;
          mpRef.current.sendInput(inp);
        }
      }
    });

    sceneRef.current = controller;
    return () => {
      controller.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildLocalInput]);

  // Keyboard Listeners + Blur Reset
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Escape' && screenRef.current === 'fighting') {
        setPaused((p) => !p);
        return;
      }
      keysHeldRef.current.add(e.code);
      if (e.code === 'KeyJ') edgeBufferRef.current.punch = true;
      if (e.code === 'KeyK') edgeBufferRef.current.heavyPunch = true;
      if (e.code === 'KeyL') edgeBufferRef.current.kick = true;
      if (e.code === 'KeyU') edgeBufferRef.current.highKick = true;
      if (e.code === 'Space') edgeBufferRef.current.dodge = true;
      if (e.code === 'KeyQ') edgeBufferRef.current.takedown = true;
      if (e.code === 'KeyE') edgeBufferRef.current.clinch = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.code);
    };

    const onBlur = () => {
      keysHeldRef.current.clear();
      touchMoveRef.current = { x: 0, y: 0 };
      touchActionsRef.current = {
        punch: false,
        heavyPunch: false,
        kick: false,
        highKick: false,
        block: false,
        dodge: false,
        takedown: false,
        clinch: false,
      };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Initialize Multiplayer client & check ?room=XXXXXX invite URL
  const ensureMpClient = useCallback(() => {
    if (mpRef.current) return mpRef.current;
    const client = new MultiplayerClient({
      onJoined: ({ code, slot, players }) => {
        setRoomCode(code);
        setPlayerSlot(slot);
        setRoomPlayers(players);
        setMpError(null);
      },
      onRoomUpdate: ({ players, status }) => {
        setRoomPlayers(players);
        if (status === 'countdown' || status === 'fighting') {
          setFightMode('online');
          setPaused(false);
          setScreen('fighting');
        }
      },
      onMatchState: (state) => {
        matchRef.current = state;
        sceneRef.current?.setMatchState(state);
        setMatchUi(state);
      },
      onOpponentDisconnected: (grace) => {
        setDisconnectBanner(
          `Adversário desconectado. Aguardando reconexão (${grace}s)...`,
        );
      },
      onOpponentReconnected: () => {
        setDisconnectBanner(null);
      },
      onError: (msg) => {
        setMpError(msg);
      },
      onLatency: (ms) => {
        setLatencyMs(ms);
      },
      onConnectionChange: (conn) => {
        setMpConnected(conn);
      },
    });
    mpRef.current = client;
    return client;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code && code.trim().length >= 4) {
      const clean = code.trim().toUpperCase();
      setInitialInviteCode(clean);
      setScreen('lobby');
    }
    return () => {
      mpRef.current?.dispose();
      mpRef.current = null;
    };
  }, []);

  const startLocalFight = (skipWalkout = false) => {
    arenaAudio.unlock();
    requestLandscapeFullscreen();
    const opp: FighterId = selectedFighter === 'jean' ? 'charles' : 'jean';
    const initial = createInitialMatch(selectedFighter, opp, skipWalkout);
    matchRef.current = initial;
    sceneRef.current?.setMatchState(initial);
    setMatchUi(initial);
    setPlayerSlot(0);
    setFightMode('local');
    setPaused(false);
    setScreen('fighting');
  };

  const handleTouchMove = useCallback((mx: number, my: number) => {
    touchMoveRef.current = { x: mx, y: my };
  }, []);

  const handleTouchAction = useCallback(
    (
      action: keyof Omit<FighterInput, 'moveX' | 'moveZ'>,
      pressed: boolean,
    ) => {
      arenaAudio.unlock();
      touchActionsRef.current[action] = pressed;
      if (pressed && action !== 'block') {
        edgeBufferRef.current[action] = true;
      }
      if (fightModeRef.current === 'online' && mpRef.current && pressed) {
        mpRef.current.sendInput(buildLocalInput());
      }
    },
    [buildLocalInput],
  );

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    arenaAudio.setMuted(next);
  };

  const handleToggleHaptics = () => {
    const next = !haptics;
    setHaptics(next);
    arenaAudio.setHaptics(next);
  };

  const handleQualityChange = (q: GraphicsQuality) => {
    setQuality(q);
    sceneRef.current?.setQuality(q);
  };

  const handleReturnToMenu = () => {
    setPaused(false);
    setDisconnectBanner(null);
    if (fightMode === 'online') {
      mpRef.current?.leaveRoom();
      setRoomCode(null);
      setRoomPlayers([]);
    }
    matchRef.current = null;
    sceneRef.current?.setMatchState(null);
    setMatchUi(null);
    setScreen('menu');
  };

  const handleRematch = () => {
    if (fightMode === 'local') {
      startLocalFight(true);
    } else if (mpRef.current) {
      mpRef.current.requestRematch();
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#07080b]">
      {/* Isolated 3D WebGL Canvas Mount */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {/* Mandatory Landscape Enforcement on Portrait Phones */}
      <OrientationGuard />

      {/* Menu Principal */}
      {screen === 'menu' && (
        <MainMenu
          selectedFighter={selectedFighter}
          onQuickPlay={() => startLocalFight(false)}
          onMultiplayer={() => {
            arenaAudio.unlock();
            requestLandscapeFullscreen();
            setMpError(null);
            setScreen('lobby');
          }}
          onTraining={() => startLocalFight(true)}
          onSelectFighter={() => {
            arenaAudio.unlock();
            setScreen('select');
          }}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {/* Seleção de Lutador em 3D */}
      {screen === 'select' && (
        <FighterSelect
          selected={selectedFighter}
          onPreviewChange={(id) => {
            setSelectedFighter(id);
            sceneRef.current?.setMode('select', id);
          }}
          onConfirm={(id) => {
            setSelectedFighter(id);
            setScreen('menu');
          }}
          onBack={() => setScreen('menu')}
        />
      )}

      {/* Lobby Multiplayer Online */}
      {screen === 'lobby' && (
        <MultiplayerLobby
          roomCode={roomCode}
          playerSlot={playerSlot}
          players={roomPlayers}
          selectedFighter={selectedFighter}
          errorMsg={mpError}
          connected={mpConnected}
          latencyMs={latencyMs}
          initialJoinCode={initialInviteCode}
          onCreateRoom={() => {
            const mp = ensureMpClient();
            mp.createRoom(selectedFighter).catch(() => {});
          }}
          onJoinRoom={(code) => {
            const mp = ensureMpClient();
            mp.joinRoom(code, selectedFighter).catch(() => {});
          }}
          onSelectFighter={(id) => {
            setSelectedFighter(id);
            mpRef.current?.selectFighter(id);
          }}
          onToggleReady={(ready) => {
            mpRef.current?.setReady(ready);
          }}
          onBack={() => {
            mpRef.current?.leaveRoom();
            setRoomCode(null);
            setRoomPlayers([]);
            setScreen('menu');
          }}
        />
      )}

      {/* Fight HUD & Touch Controls */}
      {screen === 'fighting' && matchUi && (
        <>
          <FightHUD
            match={matchUi}
            playerSlot={playerSlot}
            muted={muted}
            latencyMs={latencyMs}
            isMultiplayer={fightMode === 'online'}
            onToggleMute={handleToggleMute}
            onPause={() => setPaused(true)}
            onTouchMove={handleTouchMove}
            onTouchAction={handleTouchAction}
          />

          {disconnectBanner && (
            <div className="fixed top-20 left-1/2 z-40 -translate-x-1/2 rounded-lg border border-amber-400/50 bg-[#0b0d13]/95 px-4 py-2 text-xs font-semibold text-amber-300">
              {disconnectBanner}
            </div>
          )}

          {matchUi.phase === 'finished' && (
            <ResultModal
              match={matchUi}
              playerSlot={playerSlot}
              onRematch={handleRematch}
              onMenu={handleReturnToMenu}
            />
          )}
        </>
      )}

      {/* Pause Modal */}
      {paused && screen === 'fighting' && matchUi?.phase !== 'finished' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#07080b]/82 p-4">
          <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-[#0e1118] p-5 text-center space-y-3">
            <h2 className="font-display text-2xl font-bold tracking-wider text-white">
              COMBATE PAUSADO
            </h2>
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="w-full rounded-xl bg-[#d91e2a] py-2.5 font-display text-lg font-bold tracking-wider text-white hover:bg-[#c01924]"
            >
              CONTINUAR
            </button>
            {fightMode === 'local' && (
              <button
                type="button"
                onClick={() => startLocalFight(true)}
                className="w-full rounded-xl border border-white/15 bg-white/10 py-2.5 font-display text-lg font-bold tracking-wider text-white hover:bg-white/15"
              >
                REINICIAR LUTA
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="w-full rounded-xl border border-white/15 bg-white/5 py-2 font-display text-base font-bold tracking-wider text-slate-200 hover:bg-white/10"
            >
              CONFIGURAÇÕES
            </button>
            <button
              type="button"
              onClick={handleReturnToMenu}
              className="w-full rounded-xl border border-white/15 bg-transparent py-2 font-display text-base font-bold tracking-wider text-slate-400 hover:text-white"
            >
              SAIR PARA O MENU
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          quality={quality}
          aiDifficulty={aiDifficulty}
          muted={muted}
          haptics={haptics}
          onChangeQuality={handleQualityChange}
          onChangeDifficulty={setAiDifficulty}
          onToggleMuted={handleToggleMute}
          onToggleHaptics={handleToggleHaptics}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

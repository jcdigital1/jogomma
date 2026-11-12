import React, { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';

export async function requestLandscapeFullscreen(): Promise<void> {
  try {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen && !document.fullscreenElement) {
      await docEl.requestFullscreen();
    }
  } catch {
    // Fullscreen not allowed or unsupported (e.g. iOS Safari)
  }
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
    };
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape');
    }
  } catch {
    // Orientation lock unsupported by browser; instruction overlay remains until rotated
  }
}

export const OrientationGuard: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const check = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07080b] px-8 text-center">
      <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-2xl border border-white/15 bg-[#10131a]">
        <svg
          viewBox="0 0 64 64"
          className="h-16 w-16 text-white animate-phone-rotate"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="20" y="8" width="24" height="48" rx="4" />
          <line x1="29" y1="13" x2="35" y2="13" />
          <circle cx="32" cy="50" r="1.5" fill="currentColor" />
        </svg>
      </div>

      <h1 className="font-display text-3xl font-bold tracking-wider text-white text-balance">
        VIRE O CELULAR PARA JOGAR
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
        O combate acontece em tela horizontal para melhor alcance do joystick analógico e dos botões de luta.
      </p>

      <button
        type="button"
        onClick={() => requestLandscapeFullscreen()}
        className="mt-7 inline-flex items-center gap-2.5 rounded-lg bg-[#d91e2a] px-5 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
      >
        <Maximize2 className="h-4 w-4" />
        <span>Tentar Tela Cheia Horizontal</span>
      </button>
    </div>
  );
};

'use client';

import { useEffect, useState } from 'react';

import { CloseIcon, ZoomIcon } from './icons';

type Props = {
  src: string;
  alt?: string;
  className?: string;
  aspectRatio: number;
  onAspectRatioChange: (ratio: number) => void;
};

// Shared by every place a DTK/XYZ diagram renders (single-question practice,
// dedicated DTK session, and the mixed test). Click to open the same image
// full-screen instead of squinting at the inline size.
export function DiagramImage({ src, alt = '', className = '', aspectRatio, onAspectRatioChange }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setFullscreen(true)}
        className={`group relative cursor-zoom-in overflow-hidden rounded-2xl border border-text/10 bg-text/[0.03] ${className}`}
        style={{ aspectRatio }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic aspect ratio measured from the loaded image itself */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-contain"
          loading="eager"
          onLoad={(e) => onAspectRatioChange(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        />
        <span className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIcon className="h-[18px] w-[18px]" />
        </span>
      </button>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- same source as the inline thumbnail above */}
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Stäng"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}

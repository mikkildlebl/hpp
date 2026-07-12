'use client';

import { useEffect, useRef, useState } from 'react';

import { MathText } from '@/components/MathText';
import { resolveDiagramUrl } from '@/lib/storage';
import { ParsedOption } from '@/lib/types';

type Props = {
  options: ParsedOption[];
  selected: string | null;
  submitted: boolean;
  correctAnswer: string;
  onSelect: (label: string) => void;
  compact?: boolean;
};

const MIN_IMAGE_HEIGHT = 28;
const MAX_IMAGE_HEIGHT = 160;

// Option crops vary a lot in shape (a one-line formula is very wide/short, a
// graph is closer to square), so size from the image's own aspect ratio
// against the row's actual width rather than a fixed box that either
// shrinks formulas to near-invisibility or crops graphs off.
function OptionImage({ uri }: { uri: string }) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = aspectRatio && width ? Math.min(MAX_IMAGE_HEIGHT, Math.max(MIN_IMAGE_HEIGHT, width / aspectRatio)) : MIN_IMAGE_HEIGHT;

  return (
    <div ref={wrapRef} className="flex-1">
      {/* eslint-disable-next-line @next/next/no-img-element -- dynamic aspect ratio measured from the loaded image itself */}
      <img
        src={uri}
        alt=""
        style={{ width: '100%', height, objectFit: 'contain' }}
        onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
      />
    </div>
  );
}

export function OptionList({ options, selected, submitted, correctAnswer, onSelect, compact }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.label;
        const isCorrect = opt.label === correctAnswer;

        let borderClass = 'border-white/10 hover:border-white/25 hover:bg-white/[0.04]';
        let badgeClass = 'bg-white/5 text-white/60';
        if (submitted && isCorrect) {
          borderClass = 'border-emerald-400/50 bg-emerald-400/10';
          badgeClass = 'bg-emerald-400/20 text-emerald-300';
        } else if (submitted && isSelected && !isCorrect) {
          borderClass = 'border-red-400/50 bg-red-400/10';
          badgeClass = 'bg-red-400/20 text-red-300';
        } else if (isSelected) {
          borderClass = 'border-[#3b82f6]/60 bg-[#3b82f6]/10';
          badgeClass = 'bg-[#3b82f6]/20 text-[#93c5fd]';
        }

        return (
          <button
            key={opt.label}
            type="button"
            disabled={submitted}
            onClick={() => onSelect(opt.label)}
            className={`flex items-center gap-3 rounded-xl border text-left text-white transition-colors disabled:cursor-default ${compact ? 'gap-2 p-2.5' : 'p-4'} ${borderClass}`}>
            <span
              className={`flex shrink-0 items-center justify-center rounded-lg text-sm font-bold ${compact ? 'h-6 w-6 text-xs' : 'h-7 w-7'} ${badgeClass}`}>
              {opt.label}
            </span>
            {opt.image ? (
              <OptionImage uri={resolveDiagramUrl(opt.image)} />
            ) : (
              <span className="flex-1">
                <MathText type={compact ? 'small' : 'default'}>{opt.text}</MathText>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

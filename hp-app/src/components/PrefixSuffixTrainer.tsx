'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchGlossaryProgress, saveGlossaryProgress } from '@/lib/glossaryProgress';
import { fetchGlossary } from '@/lib/questions';
import { GlossaryEntry } from '@/lib/types';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

type Filter = 'all' | 'prefix' | 'suffix';

const FILTER_LABELS: Record<Filter, string> = {
  all: 'Alla',
  prefix: 'Prefix',
  suffix: 'Suffix',
};

export function PrefixSuffixTrainer() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [shuffleKey, setShuffleKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    Promise.all([fetchGlossary(), fetchGlossaryProgress()]).then(([glossary, savedProgress]) => {
      setEntries(glossary);
      setProgress(savedProgress);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.type === filter);
  }, [entries, filter]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- shuffleKey is a deliberate re-shuffle trigger, not a data dependency
  const order = useMemo(() => shuffle(filtered), [filtered, shuffleKey]);

  const current = order[index];
  const knownCount = filtered.filter((e) => progress[e.id] === true).length;
  const unknownCount = filtered.filter((e) => progress[e.id] === false).length;
  const unmarkedCount = filtered.length - knownCount - unknownCount;

  const selectFilter = (f: Filter) => {
    setFilter(f);
    setIndex(0);
    setRevealed(false);
  };

  const goNext = () => {
    setRevealed(false);
    setIndex((i) => (i + 1) % order.length);
  };

  const reshuffle = () => {
    setShuffleKey((k) => k + 1);
    setIndex(0);
    setRevealed(false);
  };

  const mark = (known: boolean) => {
    if (!current) return;
    setProgress((p) => ({ ...p, [current.id]: known }));
    saveGlossaryProgress(current.id, known);
    goNext();
  };

  const currentStatus = current ? progress[current.id] : undefined;

  return (
    <div className="rounded-3xl border border-text/10 bg-gradient-to-br from-card to-background p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => selectFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? 'bg-[#3b82f6]/20 text-text' : 'text-text/50 hover:text-text'
              }`}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        {order.length > 0 && (
          <p className="text-xs text-text/40">
            {index + 1} / {order.length}
          </p>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-xs text-text/40">
          <span className="text-emerald-400">{knownCount} kan</span> · <span className="text-rose-400">{unknownCount} kan inte</span> ·{' '}
          {unmarkedCount} omarkerade
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-center text-sm text-text/50">Laddar…</p>
      ) : !current ? (
        <p className="mt-8 text-center text-sm text-text/50">Inga ord hittades.</p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="relative mt-6 flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-text/10 bg-text/[0.02] p-8 text-center transition-colors hover:bg-text/[0.04]">
            {currentStatus !== undefined && (
              <span
                className={`absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${
                  currentStatus ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'
                }`}>
                {currentStatus ? 'Kan' : 'Kan inte'}
              </span>
            )}
            <span className="text-xs font-semibold tracking-wide text-text/40 uppercase">{current.type}</span>
            <span className="text-3xl font-semibold text-text">{current.word}</span>
            {revealed ? (
              <span className="mt-2 flex flex-col gap-1">
                <span className="text-base text-text/80">{current.meaning}</span>
                <span className="text-sm text-text/40">{current.examples}</span>
              </span>
            ) : (
              <span className="mt-2 text-xs text-text/40">Tryck för att visa betydelse</span>
            )}
          </button>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={reshuffle}
              className="rounded-full border border-text/15 px-5 py-2.5 text-sm font-medium text-text/70 transition-colors hover:border-text/30 hover:text-text">
              Blanda om
            </button>
            {revealed ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => mark(false)}
                  className="rounded-full border border-rose-400/30 bg-rose-400/10 px-5 py-2.5 text-sm font-semibold text-rose-400 transition-transform hover:scale-[1.02]">
                  Kan inte
                </button>
                <button
                  type="button"
                  onClick={() => mark(true)}
                  className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-400 transition-transform hover:scale-[1.02]">
                  Kan
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(59,130,246,0.6)] transition-transform hover:scale-[1.02]">
                Nästa
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

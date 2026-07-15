'use client';

import { useEffect, useState } from 'react';

import { fetchQuestionTypeStats, QuestionTypeStat } from '@/lib/attemptStats';
import { fetchGlossary } from '@/lib/questions';
import { fetchGlossaryProgress } from '@/lib/glossaryProgress';
import { loadTestResultHistory, HpTestResult } from '@/lib/hpScore';
import { QUESTION_TYPE_LABELS, TestSection } from '@/lib/types';

const TEST_SECTION_LABELS: Record<TestSection, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
  full: 'Helt prov',
};

export default function StatistikPage() {
  const [history, setHistory] = useState<HpTestResult[] | null>(null);
  const [typeStats, setTypeStats] = useState<QuestionTypeStat[] | null>(null);
  const [glossaryTotal, setGlossaryTotal] = useState(0);
  const [glossaryKnown, setGlossaryKnown] = useState(0);
  const [glossaryUnknown, setGlossaryUnknown] = useState(0);

  useEffect(() => {
    loadTestResultHistory().then(setHistory);
    fetchQuestionTypeStats().then(setTypeStats);
    Promise.all([fetchGlossary(), fetchGlossaryProgress()]).then(([entries, progress]) => {
      const values = Object.values(progress);
      setGlossaryTotal(entries.length);
      setGlossaryKnown(values.filter((v) => v).length);
      setGlossaryUnknown(values.filter((v) => !v).length);
    });
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-12 sm:px-12">
      <div>
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">Statistik</h1>
        <p className="mt-4 text-base text-white/60">Din progress över tid.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Provresultat</h2>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1526] to-[#05070c]">
          {history === null ? (
            <p className="p-6 text-sm text-white/50 sm:p-8">Laddar…</p>
          ) : history.length === 0 ? (
            <p className="p-6 text-sm text-white/50 sm:p-8">Inga prov genomförda ännu.</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/10">
              {history.map((result, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-4 sm:px-8">
                  <div>
                    <p className="text-sm font-medium text-white">{TEST_SECTION_LABELS[result.section]}</p>
                    <p className="mt-0.5 text-xs text-white/40">{new Date(result.completedAt).toLocaleDateString('sv-SE')}</p>
                  </div>
                  <p className="bg-gradient-to-r from-[#93c5fd] via-[#60a5fa] to-[#3b82f6] bg-clip-text text-xl font-semibold text-transparent">
                    {result.totalScore.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Träffsäkerhet per frågetyp</h2>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1526] to-[#05070c]">
          {typeStats === null ? (
            <p className="p-6 text-sm text-white/50 sm:p-8">Laddar…</p>
          ) : typeStats.length === 0 ? (
            <p className="p-6 text-sm text-white/50 sm:p-8">Inga besvarade frågor ännu.</p>
          ) : (
            <div className="flex flex-col divide-y divide-white/10">
              {typeStats.map(({ type, correct, total }) => {
                const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                return (
                  <div key={type} className="flex flex-col gap-2 p-4 sm:px-8">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-white">{QUESTION_TYPE_LABELS[type]}</span>
                      <span className="text-white/50">
                        {correct} / {total} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Ordbank</h2>
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1526] to-[#05070c] p-6 text-center sm:p-8">
          <div>
            <p className="text-2xl font-semibold text-emerald-400">{glossaryKnown}</p>
            <p className="mt-1 text-xs text-white/40">Kan</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-rose-400">{glossaryUnknown}</p>
            <p className="mt-1 text-xs text-white/40">Kan inte</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-white/70">{glossaryTotal - glossaryKnown - glossaryUnknown}</p>
            <p className="mt-1 text-xs text-white/40">Omarkerade</p>
          </div>
        </div>
      </div>
    </main>
  );
}

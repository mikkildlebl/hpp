'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { PrefixSuffixTrainer } from '@/components/PrefixSuffixTrainer';
import { useAuth } from '@/lib/auth';
import { loadLatestTestResult, HpTestResult } from '@/lib/hpScore';
import { fetchQuestionTypeCounts } from '@/lib/questions';
import { QUESTION_TYPE_LABELS, QuestionType, SECTION_QUESTION_TYPES, SectionType, TEST_DURATIONS_SECONDS, TestSection } from '@/lib/types';

const SECTION_LABELS: Record<SectionType, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
};

const TEST_SECTION_LABELS: Record<TestSection, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
  full: 'Helt prov',
};

const TEST_SECTIONS: TestSection[] = ['verbal', 'kvant', 'full'];

export default function OvaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [counts, setCounts] = useState<Record<QuestionType, number> | null>(null);
  const [withTimer, setWithTimer] = useState(true);
  const [selectedTestSection, setSelectedTestSection] = useState<TestSection>('full');
  const [latestResult, setLatestResult] = useState<HpTestResult | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    fetchQuestionTypeCounts().then(setCounts);
    Promise.resolve(loadLatestTestResult()).then(setLatestResult);
  }, []);

  if (authLoading || !user) {
    return <div className="flex flex-1 flex-col bg-[#05070c]" />;
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#05070c] text-white">
      {/* drifting ambient glow blobs */}
      <div className="animate-drift-a pointer-events-none absolute top-[-220px] left-1/2 h-[620px] w-[620px] rounded-full bg-[#1d4ed8] opacity-30 blur-[150px]" />
      <div className="animate-drift-b pointer-events-none absolute top-[20%] right-[-200px] h-[460px] w-[460px] rounded-full bg-[#0ea5e9] opacity-20 blur-[150px]" />
      <div className="animate-drift-c pointer-events-none absolute bottom-[-200px] left-[-120px] h-[480px] w-[480px] rounded-full bg-[#60a5fa] opacity-[0.16] blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#05070c_100%)]" />

      {/* header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-base font-semibold tracking-tight">HP Pro</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-12 sm:px-12">
        {/* HP score card - always visible, defaults to 0.00 with no result yet */}
        <div className="flex items-center justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1526] to-[#05070c] p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">Ditt HP-resultat</p>
            {latestResult ? (
              <p className="mt-1 text-xs text-white/40">
                {TEST_SECTION_LABELS[latestResult.section]} · {new Date(latestResult.completedAt).toLocaleDateString('sv-SE')}
              </p>
            ) : (
              <p className="mt-1 text-xs text-white/40">Inget resultat ännu</p>
            )}
          </div>
          <p className="bg-gradient-to-r from-[#93c5fd] via-[#60a5fa] to-[#3b82f6] bg-clip-text text-4xl font-semibold text-transparent sm:text-5xl">
            {(latestResult?.totalScore ?? 0).toFixed(2)}
          </p>
        </div>

        {/* provsimulering - the flagship "run a full mock exam" flow, so it gets
            top billing as a single featured card instead of another list item */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1526] to-[#05070c] p-6 sm:p-8">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Provsimulering</h2>
            <p className="mt-2 max-w-sm text-sm text-white/60">Gör ett helt prov under tidspress, precis som på riktigt.</p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TEST_SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setSelectedTestSection(section)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  selectedTestSection === section
                    ? 'border-[#3b82f6]/60 bg-[#3b82f6]/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                }`}>
                <p className="text-sm font-medium text-white">{TEST_SECTION_LABELS[section]}</p>
                <p className="mt-1 text-xs text-white/40">{TEST_DURATIONS_SECONDS[section] / 60} min</p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={withTimer}
                onChange={(e) => setWithTimer(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-[#3b82f6]"
              />
              Med tidtagning
            </label>
            <Link
              href={`/session/test/${selectedTestSection}?timer=${withTimer ? '1' : '0'}`}
              className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] px-8 py-3 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(59,130,246,0.6)] transition-transform hover:scale-[1.02]">
              Starta {TEST_SECTION_LABELS[selectedTestSection].toLowerCase()}
            </Link>
          </div>
        </div>

        {/* per-type practice - a two-column grid on wider screens keeps verbal
            and kvant side by side instead of one long stacked list */}
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Öva per frågetyp</h2>
          <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {(Object.keys(SECTION_QUESTION_TYPES) as SectionType[]).map((section) => (
              <div key={section} className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold tracking-wide text-white/40 uppercase">{SECTION_LABELS[section]}</h3>
                <div className="flex flex-col gap-1.5">
                  {SECTION_QUESTION_TYPES[section].map((type) => (
                    <Link
                      key={type}
                      href={`/session/${type}`}
                      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#05070c] transition-colors hover:bg-white/[0.04]">
                      <div className="flex items-center gap-3 p-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/70 group-hover:text-white">
                          {type}
                        </span>
                        <span className="flex-1 text-sm font-medium text-white">{QUESTION_TYPE_LABELS[type]}</span>
                        <span className="text-sm text-white/40">{counts ? `${counts[type]} frågor` : '…'}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <PrefixSuffixTrainer />
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-xs text-white/40 sm:px-12">
        HP Pro — oberoende övningsverktyg för högskoleprovet.
      </footer>
    </div>
  );
}

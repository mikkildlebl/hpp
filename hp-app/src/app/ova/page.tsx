'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchQuestionTypeCounts } from '@/lib/questions';
import { QUESTION_TYPE_LABELS, QuestionType, SECTION_QUESTION_TYPES, SectionType } from '@/lib/types';

const SECTION_LABELS: Record<SectionType, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
};

export default function OvaPage() {
  const [counts, setCounts] = useState<Record<QuestionType, number> | null>(null);

  useEffect(() => {
    fetchQuestionTypeCounts().then(setCounts);
  }, []);

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

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-12 sm:px-12">
        <div>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">Högskoleprovet</h1>
          <p className="mt-4 text-base text-white/60 sm:text-lg">Öva på en fråga i taget, se resultatet direkt.</p>
        </div>

        {(Object.keys(SECTION_QUESTION_TYPES) as SectionType[]).map((section) => (
          <div key={section} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-white/50 uppercase">{SECTION_LABELS[section]}</h2>
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

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-white/50 uppercase">Ordbank</h2>
          <Link href="/glossary" className="group overflow-hidden rounded-2xl border border-white/10 bg-[#05070c] transition-colors hover:bg-white/[0.04]">
            <div className="flex items-center gap-3 p-4">
              <span className="flex-1 text-sm font-medium text-white">Prefix &amp; suffix</span>
              <span className="text-white/40 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-xs text-white/40 sm:px-12">
        HP Pro — oberoende övningsverktyg för högskoleprovet.
      </footer>
    </div>
  );
}

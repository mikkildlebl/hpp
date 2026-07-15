'use client';

import { PrefixSuffixTrainer } from '@/components/PrefixSuffixTrainer';

export default function GlossaryPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12 sm:px-12">
      <div>
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">Ordbank</h1>
        <p className="mt-4 text-base text-white/60">Lär dig prefix och suffix, och håll koll på vilka du redan kan.</p>
      </div>

      <PrefixSuffixTrainer />
    </main>
  );
}

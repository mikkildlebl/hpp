'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PrefixSuffixTrainer } from '@/components/PrefixSuffixTrainer';
import { useAuth } from '@/lib/auth';

export default function GlossaryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

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
        <Link href="/ova" className="flex items-center gap-2.5">
          <span className="text-base font-semibold tracking-tight">HP Pro</span>
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12 sm:px-12">
        <div>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">Ordbank</h1>
          <p className="mt-4 text-base text-white/60">Lär dig prefix och suffix, och håll koll på vilka du redan kan.</p>
        </div>

        <PrefixSuffixTrainer />
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-xs text-white/40 sm:px-12">
        HP Pro — oberoende övningsverktyg för högskoleprovet.
      </footer>
    </div>
  );
}

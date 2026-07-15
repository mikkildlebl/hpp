'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

import { useTheme } from '@/lib/colorMode';

// Shared chrome for every /session page — same backdrop and header treatment
// as the landing and öva pages, so the practice flow doesn't feel like a
// different app once you leave /ova. Glow blobs only show in dark theme.
export function SessionShell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const { theme } = useTheme();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-background text-text">
      {theme === 'dark' && (
        <>
          <div className="animate-drift-a pointer-events-none absolute top-[-220px] left-1/2 h-[620px] w-[620px] rounded-full bg-[#1d4ed8] opacity-20 blur-[150px]" />
          <div className="animate-drift-b pointer-events-none absolute top-[10%] right-[-200px] h-[460px] w-[460px] rounded-full bg-[#0ea5e9] opacity-[0.14] blur-[150px]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#05070c_100%)]" />
        </>
      )}

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12">
        <Link href="/ova" className="flex items-center gap-2.5">
          <span className="text-base font-semibold tracking-tight">HP Pro</span>
        </Link>
        {right}
      </header>

      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
    </div>
  );
}

export function SessionProgress({ current, total, correct }: { current: number; total: number; correct: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-text/50">
        {current} av {total} · {correct} rätt hittills
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-text/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-text/50">{label}</p>
    </div>
  );
}

export function SubmitButton({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] px-8 py-4 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(59,130,246,0.6)] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none disabled:hover:scale-100">
      {label}
    </button>
  );
}

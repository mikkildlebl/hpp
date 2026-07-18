'use client';

import Link from 'next/link';

import { useAuth } from '@/lib/auth';
import { QUESTION_TYPE_LABELS, QuestionType, SECTION_QUESTION_TYPES } from '@/lib/types';

const FEATURES: { title: string; body: string }[] = [
  { title: '10 000+ frågor', body: 'Frågebanken växer hela tiden — fler frågor tillkommer löpande.' },
  { title: 'AI svar', body: 'Rättat mot facit, med en AI-förklaring till varje svar.' },
  { title: 'Statistik', body: 'Se din utveckling över tid, frågetyp för frågetyp.' },
];

const STEPS: { title: string; body: string }[] = [
  { title: 'Välj vad du vill öva', body: 'Ett helt prov, en sektion, eller en enskild frågetyp — du bestämmer.' },
  { title: 'Svara och se facit direkt', body: 'Varje fråga rättas mot det officiella facit, ingen väntan.' },
  { title: 'Följ din utveckling', body: 'HP-poäng, träffsäkerhet per frågetyp och din streak samlas på ett ställe.' },
];

const ALL_QUESTION_TYPES: QuestionType[] = [...SECTION_QUESTION_TYPES.verbal, ...SECTION_QUESTION_TYPES.kvant];

// Always dark, regardless of the light/dark preference set on /konto — the
// marketing page isn't part of the themeable app.
export default function LandingPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-[#05070c] text-white">
      {/* drifting ambient glow blobs */}
      <div className="animate-drift-a pointer-events-none absolute top-[-220px] left-1/2 h-[620px] w-[620px] rounded-full bg-[#1d4ed8] opacity-30 blur-[150px]" />
      <div className="animate-drift-b pointer-events-none absolute top-[20%] right-[-200px] h-[460px] w-[460px] rounded-full bg-[#0ea5e9] opacity-20 blur-[150px]" />
      <div className="animate-drift-c pointer-events-none absolute bottom-[-200px] left-[-120px] h-[480px] w-[480px] rounded-full bg-[#60a5fa] opacity-[0.16] blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#05070c_100%)]" />

      {/* header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-12">
        <div className="flex h-[38px] items-center gap-2.5">
          <span className="text-base font-semibold tracking-tight">HP Pro</span>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/50 sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white">
              Logga ut
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white">
            Logga in
          </Link>
        )}
      </header>

      {/* hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-24 text-center sm:px-12">
        <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight break-words sm:text-7xl">
          Maxa ditt
          <br />
          <span className="bg-gradient-to-r from-[#93c5fd] via-[#60a5fa] to-[#3b82f6] bg-clip-text text-transparent">
            högskoleprovsresultat
          </span>
        </h1>

        <p className="mt-6 max-w-md text-base text-white/60 sm:text-lg">
          Riktiga provfrågor, en i taget, med direkt facit. Inget krångel — bara du och nästa fråga.
        </p>

        <Link
          href="/ova"
          className="mt-10 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] px-8 py-4 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(59,130,246,0.6)] transition-transform hover:scale-[1.03]">
          Börja öva gratis →
        </Link>

        <div className="mt-24 grid w-full max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#05070c] p-6 text-left">
              <p className="text-sm font-semibold text-white">{f.title}</p>
              <p className="mt-1.5 text-sm text-white/50">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 w-full max-w-3xl">
          <p className="text-center text-sm font-semibold tracking-wide text-white/50 uppercase">Hur det fungerar</p>
          <div className="mt-8 grid grid-cols-1 gap-8 text-left sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <p className="text-sm font-semibold text-[#60a5fa]">{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-2 text-base font-semibold text-white">{step.title}</p>
                <p className="mt-1.5 text-sm text-white/50">{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 w-full max-w-3xl">
          <p className="text-center text-sm font-semibold tracking-wide text-white/50 uppercase">8 delprov, precis som på riktiga provet</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ALL_QUESTION_TYPES.map((type) => (
              <div key={type} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-lg font-bold text-[#60a5fa]">{type}</p>
                <p className="mt-1 text-xs text-white/50">{QUESTION_TYPE_LABELS[type]}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-24 flex flex-col items-center gap-6 text-center">
          <p className="max-w-md text-2xl font-semibold text-white sm:text-3xl">Redo att sätta din HP-poäng?</p>
          <Link
            href="/ova"
            className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] px-8 py-4 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(59,130,246,0.6)] transition-transform hover:scale-[1.03]">
            Börja öva gratis →
          </Link>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-xs text-white/40 sm:px-12">
        <p className="text-center">HP Pro — Maxa ditt högskoleprovsresultat</p>
        <div className="mt-6 flex justify-center gap-16 sm:gap-24">
          <div className="flex flex-col gap-1.5">
            <p className="font-semibold text-white/70">Kontakt</p>
            <a href="mailto:info@hppro.se" className="hover:text-white">
              info@hppro.se
            </a>
          </div>
          <div className="flex flex-col gap-1.5">
            <Link href="/integritetspolicy" className="hover:text-white">
              Integritetspolicy
            </Link>
            <Link href="/villkor" className="hover:text-white">
              Användarvillkor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

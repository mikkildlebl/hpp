import Link from 'next/link';

const FEATURES: { title: string; body: string }[] = [
  { title: 'Riktiga bråk & exponenter', body: 'Formler renderas som formler, inte platt text.' },
  { title: 'Rättat mot facit', body: 'Varje svar kontrollerat mot det officiella facit.' },
  { title: 'En fråga i taget', body: 'Inget klockrace. Ditt tempo, din session.' },
];

export default function LandingPage() {
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
        <Link
          href="/ova"
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white">
          Börja öva
        </Link>
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
      </main>

      <footer className="relative z-10 border-t border-white/10 px-6 py-6 text-center text-xs text-white/40 sm:px-12">
        HP Pro — oberoende övningsverktyg för högskoleprovet.
      </footer>
    </div>
  );
}

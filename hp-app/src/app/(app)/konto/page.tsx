'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth';
import { Theme, useTheme } from '@/lib/colorMode';
import { useExtraTime } from '@/lib/extraTime';

const THEME_LABELS: Record<Theme, string> = {
  dark: 'Mörkt',
  light: 'Ljust',
};

export default function KontoPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { extraTime, setExtraTime } = useExtraTime();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-12 sm:px-12">
      <div>
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">Konto</h1>
        <p className="mt-4 text-base text-text/60">Din inloggning och dina uppgifter.</p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-3xl border border-text/10 bg-gradient-to-br from-card to-background p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold tracking-wide text-text/40 uppercase">Inloggad som</p>
          <p className="mt-1 text-base text-text">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-text/15 px-5 py-2.5 text-sm font-medium text-text/80 transition-colors hover:border-text/30 hover:text-text">
          Logga ut
        </button>
      </div>

      <div className="rounded-3xl border border-text/10 bg-gradient-to-br from-card to-background p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-text/40 uppercase">Utseende</p>
        <div className="mt-4 flex gap-2">
          {(Object.keys(THEME_LABELS) as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                theme === t ? 'bg-[#3b82f6]/15 text-text' : 'border border-text/15 text-text/70 hover:border-text/30 hover:text-text'
              }`}>
              {THEME_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-text/10 bg-gradient-to-br from-card to-background p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-text/40 uppercase">Extra tid</p>
            <p className="mt-1 text-sm text-text/60">80 min för ett halvt prov, 160 min för ett helt prov.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={extraTime}
            onClick={() => setExtraTime(!extraTime)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${extraTime ? 'bg-[#3b82f6]' : 'bg-text/15'}`}>
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${extraTime ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </div>
    </main>
  );
}

'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth';

export default function KontoPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-12 sm:px-12">
      <div>
        <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">Konto</h1>
        <p className="mt-4 text-base text-white/60">Din inloggning och dina uppgifter.</p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d1526] to-[#05070c] p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">Inloggad som</p>
          <p className="mt-1 text-base text-white">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white">
          Logga ut
        </button>
      </div>
    </main>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth';

// Always dark, same as the landing page — not part of the themeable app.
export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace('/ova');
  }, [loading, user, router]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#05070c] px-6 text-white">
      <div className="animate-drift-a pointer-events-none absolute top-[-220px] left-1/2 h-[620px] w-[620px] rounded-full bg-[#1d4ed8] opacity-30 blur-[150px]" />
      <div className="animate-drift-b pointer-events-none absolute top-[20%] right-[-200px] h-[460px] w-[460px] rounded-full bg-[#0ea5e9] opacity-20 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#05070c_100%)]" />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Logga in</h1>
          <p className="mt-3 text-sm text-white/60">Spara dina provresultat och din progress mellan sessioner.</p>
        </div>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-semibold text-[#05070c] shadow-[0_0_40px_-8px_rgba(255,255,255,0.25)] transition-transform hover:scale-[1.02]">
          <GoogleIcon />
          Fortsätt med Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.87 2.69-6.64z" />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96A8.996 8.996 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"
      />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.34C4.66 5.16 6.65 3.58 9 3.58z" />
    </svg>
  );
}

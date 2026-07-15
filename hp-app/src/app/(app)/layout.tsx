'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import { MobileTabBar } from '@/components/MobileTabBar';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/colorMode';

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <div className="flex flex-1 flex-col bg-background" />;
  }

  return (
    <div className="relative flex flex-1 overflow-hidden bg-background text-text">
      {theme === 'dark' && (
        <>
          <div className="animate-drift-a pointer-events-none absolute top-[-220px] left-1/2 h-[620px] w-[620px] rounded-full bg-[#1d4ed8] opacity-30 blur-[150px]" />
          <div className="animate-drift-b pointer-events-none absolute top-[20%] right-[-200px] h-[460px] w-[460px] rounded-full bg-[#0ea5e9] opacity-20 blur-[150px]" />
          <div className="animate-drift-c pointer-events-none absolute bottom-[-200px] left-[-120px] h-[480px] w-[480px] rounded-full bg-[#60a5fa] opacity-[0.16] blur-[150px]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,#05070c_100%)]" />
        </>
      )}

      <Sidebar />

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        <header className="flex items-center px-6 py-6 md:hidden">
          <Link href="/" className="text-base font-semibold tracking-tight text-text">
            HP Pro
          </Link>
        </header>
        {children}
        <footer className="border-t border-text/10 px-6 py-6 text-center text-xs text-text/40 sm:px-12">
          HP Pro — oberoende övningsverktyg för högskoleprovet.
        </footer>
      </div>

      <MobileTabBar />
    </div>
  );
}

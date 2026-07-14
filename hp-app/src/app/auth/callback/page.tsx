'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(() => router.replace('/ova'));
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-[#05070c] text-sm text-white/60">
      <p>Loggar in…</p>
    </div>
  );
}

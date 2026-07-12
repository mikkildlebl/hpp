'use client';

import { useRouter } from 'next/navigation';

import { ScoreSummary } from '@/components/ScoreSummary';
import { SessionShell } from '@/components/SessionShell';
import { useSession } from '@/lib/SessionContext';

export default function SummaryPage() {
  const router = useRouter();
  const { score } = useSession();

  return (
    <SessionShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-12">
        <ScoreSummary correct={score.correct} total={score.total} />
        <button
          type="button"
          onClick={() => router.replace('/ova')}
          className="rounded-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] px-8 py-4 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(59,130,246,0.6)] transition-transform hover:scale-[1.02]">
          Tillbaka till start
        </button>
      </div>
    </SessionShell>
  );
}

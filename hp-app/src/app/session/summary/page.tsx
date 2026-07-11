'use client';

import { useRouter } from 'next/navigation';

import { ScoreSummary } from '@/components/ScoreSummary';
import { useSession } from '@/lib/SessionContext';

export default function SummaryPage() {
  const router = useRouter();
  const { score } = useSession();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <ScoreSummary correct={score.correct} total={score.total} />
      <button
        type="button"
        onClick={() => router.replace('/ova')}
        className="rounded-lg bg-[#3c87f7] px-8 py-4 text-sm font-bold text-white">
        Tillbaka till start
      </button>
    </div>
  );
}

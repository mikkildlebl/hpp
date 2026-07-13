'use client';

import { useParams, useSearchParams } from 'next/navigation';

import { TestSession } from '@/components/session/TestSession';
import { TestSection } from '@/lib/types';

export default function TestSessionPage() {
  const { section } = useParams<{ section: string }>();
  const searchParams = useSearchParams();
  const timed = searchParams.get('timer') === '1';

  return <TestSession section={section as TestSection} timed={timed} />;
}

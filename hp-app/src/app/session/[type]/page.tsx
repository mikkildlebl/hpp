'use client';

import { useParams } from 'next/navigation';

import { DtkSession } from '@/components/session/DtkSession';
import { IndividualSession } from '@/components/session/IndividualSession';
import { LasSession } from '@/components/session/LasSession';
import { QuestionType } from '@/lib/types';

export default function SessionPage() {
  const { type } = useParams<{ type: string }>();
  const questionType = type as QuestionType;

  if (questionType === 'LAS') {
    return <LasSession />;
  }
  if (questionType === 'DTK') {
    return <DtkSession />;
  }
  return <IndividualSession type={questionType} />;
}

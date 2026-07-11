'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchQuestionTypeCounts } from '@/lib/questions';
import { QUESTION_TYPE_LABELS, QuestionType, SECTION_QUESTION_TYPES, SectionType } from '@/lib/types';

const SECTION_LABELS: Record<SectionType, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
};

export default function OvaPage() {
  const [counts, setCounts] = useState<Record<QuestionType, number> | null>(null);

  useEffect(() => {
    fetchQuestionTypeCounts().then(setCounts);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-5xl leading-[52px] font-semibold">Högskoleprovet</h1>
      <p className="text-text-secondary">Öva på en fråga i taget, se resultatet direkt.</p>

      {(Object.keys(SECTION_QUESTION_TYPES) as SectionType[]).map((section) => (
        <div key={section} className="flex flex-col gap-2">
          <h2 className="text-[32px] leading-[44px] font-semibold">{SECTION_LABELS[section]}</h2>
          {SECTION_QUESTION_TYPES[section].map((type) => (
            <Link key={type} href={`/session/${type}`}>
              <div className="flex items-center gap-2 rounded-lg bg-background-element p-4">
                <span className="text-sm font-bold">{type}</span>
                <span className="flex-1">{QUESTION_TYPE_LABELS[type]}</span>
                <span className="text-sm text-text-secondary">{counts ? `${counts[type]} frågor` : '…'}</span>
              </div>
            </Link>
          ))}
        </div>
      ))}

      <Link href="/glossary">
        <div className="flex items-center gap-2 rounded-lg bg-background-element p-4">
          <span className="text-sm font-bold">Ordbank</span>
          <span className="flex-1">Prefix &amp; suffix</span>
        </div>
      </Link>
    </div>
  );
}

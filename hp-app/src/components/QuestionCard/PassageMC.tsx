'use client';

import { useEffect, useState } from 'react';

import { OptionList } from '@/components/OptionList';
import { fetchPassage } from '@/lib/questions';
import { formatPassage, FormattedPassage } from '@/lib/text';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

export function PassageMC({ question, selected, submitted, onSelect }: Props) {
  const [passage, setPassage] = useState<FormattedPassage | null>(null);
  const [loading, setLoading] = useState(Boolean(question.passage_id));

  useEffect(() => {
    let cancelled = false;
    if (!question.passage_id) {
      setPassage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPassage(question.passage_id).then((result) => {
      if (!cancelled) {
        setPassage(result?.content ? formatPassage(result.content) : null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [question.passage_id]);

  return (
    <div className="flex flex-col gap-6">
      {loading && <p className="text-sm">Laddar text…</p>}
      {passage && (
        <div className="rounded-lg border border-option-border p-4">
          {passage.title && <p className="text-sm font-bold">{passage.title}</p>}
          {passage.paragraphs.map((paragraph, i) => (
            <p key={i} className="mt-2">
              {paragraph}
            </p>
          ))}
        </div>
      )}
      <p className="text-[32px] leading-[44px] font-semibold">{question.question_text}</p>
      {question.possibly_truncated && (
        <p className="text-sm text-text-secondary">Obs: källdatan för ett eller flera svarsalternativ kan vara avklippt.</p>
      )}
      <OptionList
        options={question.options}
        selected={selected}
        submitted={submitted}
        correctAnswer={question.correct_answer}
        onSelect={onSelect}
      />
    </div>
  );
}

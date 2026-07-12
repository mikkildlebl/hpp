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
      {loading && <p className="text-sm text-white/50">Laddar text…</p>}
      {passage && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
          {passage.title && <p className="text-sm font-semibold text-white/70">{passage.title}</p>}
          {passage.paragraphs.map((paragraph, i) => (
            <p key={i} className="mt-2 text-white/85">
              {paragraph}
            </p>
          ))}
        </div>
      )}
      <p className="text-2xl leading-8 font-semibold text-white">{question.question_text}</p>
      {question.possibly_truncated && (
        <p className="text-sm text-white/50">Obs: källdatan för ett eller flera svarsalternativ kan vara avklippt.</p>
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

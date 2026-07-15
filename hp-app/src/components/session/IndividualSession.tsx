'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { QuestionCard } from '@/components/QuestionCard';
import { LoadingState, SessionProgress, SessionShell, SubmitButton } from '@/components/SessionShell';
import { useSession } from '@/lib/SessionContext';
import { fetchQuestionsByType } from '@/lib/questions';
import { QuestionType } from '@/lib/types';

const SESSION_LENGTH = 10;

export function IndividualSession({ type }: { type: QuestionType }) {
  const router = useRouter();
  const { questions, answers, startSession, answerQuestion, score } = useSession();
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchQuestionsByType(type, SESSION_LENGTH).then((qs) => {
      startSession(qs);
      setIndex(0);
      setSelected(null);
      setSubmitted(false);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (loading) {
    return (
      <SessionShell>
        <LoadingState label="Laddar frågor…" />
      </SessionShell>
    );
  }

  if (questions.length === 0) {
    return (
      <SessionShell>
        <LoadingState label="Inga frågor hittades för denna typ." />
      </SessionShell>
    );
  }

  const question = questions[index];
  const isLast = index === questions.length - 1;
  // Diagram questions get the wider container that DTK gets elsewhere -
  // 640px squeezes a full exam-page scan down to nearly unreadable.
  const containerMaxWidth = question.diagram_path ? 'max-w-4xl' : 'max-w-[640px]';

  const handleSubmit = () => {
    if (!selected) return;
    answerQuestion(question.id, selected);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/session/summary');
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <SessionShell>
      <div className={`mx-auto flex w-full ${containerMaxWidth} flex-1 flex-col gap-6 px-6 py-8 sm:px-12`}>
        <SessionProgress current={index + 1} total={questions.length} correct={score.correct} />

        <div className="rounded-2xl border border-text/10 bg-text/[0.02] p-6">
          <QuestionCard
            question={question}
            selected={submitted ? (answers[question.id] ?? null) : selected}
            submitted={submitted}
            onSelect={setSelected}
          />
        </div>

        <SubmitButton
          disabled={!selected && !submitted}
          onClick={submitted ? handleNext : handleSubmit}
          label={submitted ? (isLast ? 'Se resultat' : 'Nästa fråga') : 'Svara'}
        />
      </div>
    </SessionShell>
  );
}

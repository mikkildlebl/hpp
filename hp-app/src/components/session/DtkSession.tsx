'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DiagramImage } from '@/components/DiagramImage';
import { OptionList } from '@/components/OptionList';
import { LoadingState, SessionProgress, SessionShell, SubmitButton } from '@/components/SessionShell';
import { fetchDtkPageGroups } from '@/lib/questions';
import { useGroupSession } from '@/lib/useGroupSession';
import { useMinWidth } from '@/lib/use-min-width';
import { DtkGroup } from '@/lib/types';

// DTK pages often carry several questions about the same diagram, and the
// unmodified full-page image reads far better shown once, large, alongside all
// of them than repeated small per question. Side-by-side on wide screens (the
// image fills the available height); stacked on narrow ones where a split would
// leave both halves too cramped to use.
const DTK_GROUP_COUNT = 5;
const DTK_ROW_BREAKPOINT = 700;
const DTK_DEFAULT_ASPECT_RATIO = 0.72;

export function DtkSession() {
  const router = useRouter();
  const useSideBySide = useMinWidth(DTK_ROW_BREAKPOINT);
  const [aspectRatio, setAspectRatio] = useState(DTK_DEFAULT_ASPECT_RATIO);
  const { groups, group, index, isLast, selections, submitted, allSelected, answers, score, select, submit, advance } =
    useGroupSession<DtkGroup>(() => fetchDtkPageGroups(DTK_GROUP_COUNT));

  if (!groups) {
    return (
      <SessionShell>
        <LoadingState label="Laddar diagram…" />
      </SessionShell>
    );
  }

  if (groups.length === 0) {
    return (
      <SessionShell>
        <LoadingState label="Inga diagram hittades." />
      </SessionShell>
    );
  }

  const handleNext = () => advance(() => router.replace('/session/summary'));

  const image = (
    <DiagramImage
      src={group!.diagramUrl}
      className={useSideBySide ? 'max-h-[calc(100vh-9rem)] w-auto' : 'w-full'}
      aspectRatio={aspectRatio}
      onAspectRatioChange={setAspectRatio}
    />
  );

  const questionsList = (
    <>
      {group!.questions.map((question, i) => (
        <div key={question.id} className="flex flex-col gap-2 rounded-2xl border border-text/10 bg-text/[0.02] p-4">
          <p className="text-sm font-bold text-text">
            {i + 1}. {question.question_text}
          </p>
          <OptionList
            compact
            options={question.options}
            selected={submitted ? (answers[question.id] ?? null) : (selections[question.id] ?? null)}
            submitted={submitted}
            correctAnswer={question.correct_answer}
            onSelect={(label) => select(question.id, label)}
          />
        </div>
      ))}
      <SubmitButton
        disabled={!allSelected && !submitted}
        onClick={submitted ? handleNext : submit}
        label={submitted ? (isLast ? 'Se resultat' : 'Nästa diagram') : 'Svara'}
      />
    </>
  );

  return (
    <SessionShell>
      <div className="flex w-full max-w-full flex-1 flex-col gap-4 px-6 py-8 sm:px-12">
        <SessionProgress current={index + 1} total={groups.length} correct={score.correct} />
        {useSideBySide ? (
          <div className="flex flex-1 flex-row gap-6">
            {image}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-2">{questionsList}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {image}
            {questionsList}
          </div>
        )}
      </div>
    </SessionShell>
  );
}

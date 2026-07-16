'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

import { DiagramImage } from '@/components/DiagramImage';
import { OptionList } from '@/components/OptionList';
import { QuestionCard } from '@/components/QuestionCard';
import { LoadingState, SessionProgress, SessionShell, SubmitButton } from '@/components/SessionShell';
import { Timer } from '@/components/Timer';
import { useExtraTime } from '@/lib/extraTime';
import { buildHpResult, saveTestResult } from '@/lib/hpScore';
import { fetchTestUnits } from '@/lib/questions';
import { useSession } from '@/lib/SessionContext';
import { getTestDurationSeconds, TestSection, TestUnit } from '@/lib/types';
import { useCountdown } from '@/lib/useCountdown';
import { useGroupSession } from '@/lib/useGroupSession';
import { useMinWidth } from '@/lib/use-min-width';

// Shares layout with LasSession/DtkSession for their respective unit kinds,
// but walks a single mixed sequence of individual questions, LAS passages and
// DTK diagrams - the shape of a real timed test - instead of one type at a time.
const TWO_COLUMN_BREAKPOINT = 640;
const DTK_ROW_BREAKPOINT = 700;
const DTK_DEFAULT_ASPECT_RATIO = 0.72;

export function TestSession({ section, timed }: { section: TestSection; timed: boolean }) {
  const router = useRouter();
  const useTwoColumns = useMinWidth(TWO_COLUMN_BREAKPOINT);
  const useSideBySide = useMinWidth(DTK_ROW_BREAKPOINT);
  const [aspectRatio, setAspectRatio] = useState(DTK_DEFAULT_ASPECT_RATIO);

  const { questions } = useSession();
  const { extraTime } = useExtraTime();
  const { groups, group, index, isLast, selections, submitted, allSelected, answers, score, select, submit, advance } =
    useGroupSession<TestUnit>(() => fetchTestUnits(section));

  const finish = async () => {
    await saveTestResult(buildHpResult(section, questions, answers));
    router.replace('/session/summary');
  };
  const { secondsLeft, paused, togglePause } = useCountdown(timed ? getTestDurationSeconds(section, extraTime) : null, finish);

  if (!groups) {
    return (
      <SessionShell>
        <LoadingState label="Laddar prov…" />
      </SessionShell>
    );
  }

  if (groups.length === 0) {
    return (
      <SessionShell>
        <LoadingState label="Inga frågor hittades." />
      </SessionShell>
    );
  }

  const handleNext = () => advance(finish);
  const unit = group!;

  let body: ReactNode;

  if (unit.kind === 'question') {
    body = (
      <div className="rounded-2xl border border-text/10 bg-text/[0.02] p-6">
        <QuestionCard
          question={unit.question}
          selected={submitted ? (answers[unit.question.id] ?? null) : (selections[unit.question.id] ?? null)}
          submitted={submitted}
          onSelect={(label) => select(unit.question.id, label)}
        />
      </div>
    );
  } else if (unit.kind === 'las') {
    const { group: passage } = unit;
    const columns = useTwoColumns
      ? [passage.paragraphs.slice(0, Math.ceil(passage.paragraphs.length / 2)), passage.paragraphs.slice(Math.ceil(passage.paragraphs.length / 2))]
      : [passage.paragraphs];

    body = (
      <>
        <div className="rounded-2xl border border-text/10 bg-text/[0.02] p-6">
          <h2 className="text-2xl leading-tight font-semibold text-text sm:text-[32px] sm:leading-[44px]">{passage.title}</h2>
          <div className="mt-4 rounded-2xl border border-text/10 bg-text/[0.03] p-4 text-text/85">
            <div className={useTwoColumns ? 'flex flex-row gap-6' : undefined}>
              {columns.map((column, ci) => (
                <div key={ci} className={useTwoColumns ? 'flex-1' : undefined}>
                  {column.map((paragraph, i) => (
                    <p key={i} className="mb-2">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {passage.questions.map((question, i) => (
          <div key={question.id} className="flex flex-col gap-3 rounded-2xl border border-text/10 bg-text/[0.02] p-6">
            <h3 className="text-lg leading-snug font-semibold text-text sm:text-xl">
              {i + 1}. {question.question_text}
            </h3>
            <OptionList
              options={question.options}
              selected={submitted ? (answers[question.id] ?? null) : (selections[question.id] ?? null)}
              submitted={submitted}
              correctAnswer={question.correct_answer}
              onSelect={(label) => select(question.id, label)}
            />
          </div>
        ))}
      </>
    );
  } else {
    const { group: dtk } = unit;
    const image = (
      <DiagramImage
        src={dtk.diagramUrl}
        className={useSideBySide ? 'max-h-[calc(100vh-9rem)] w-auto' : 'w-full'}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
      />
    );

    const questionsList = (
      <>
        {dtk.questions.map((question, i) => (
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
      </>
    );

    body = useSideBySide ? (
      <div className="flex flex-1 flex-row gap-6">
        {image}
        <div className="min-w-0 flex-1 flex-col gap-4 overflow-y-auto pb-2 flex">{questionsList}</div>
      </div>
    ) : (
      <div className="flex flex-col gap-6">
        {image}
        {questionsList}
      </div>
    );
  }

  // DTK diagrams need the same full-width room the dedicated DTK session gives
  // them (unlike single questions and LAS passages) - reusing the max-w-4xl
  // container for every kind here left the diagram's own height-driven width
  // free to eat almost all the row, squeezing the answer options unreadably
  // thin next to it.
  const containerMaxWidth = unit.kind === 'dtk' ? 'max-w-full' : 'max-w-4xl';

  return (
    <SessionShell
      right={timed && secondsLeft !== null ? <Timer secondsLeft={secondsLeft} paused={paused} onClick={togglePause} /> : undefined}>
      <div className={`mx-auto flex w-full ${containerMaxWidth} flex-1 flex-col gap-6 px-6 py-8 sm:px-12`}>
        <SessionProgress
          current={groups.slice(0, index + 1).reduce((sum, g) => sum + g.questions.length, 0)}
          total={questions.length}
          correct={score.correct}
        />

        {body}

        <SubmitButton
          disabled={!allSelected && !submitted}
          onClick={submitted ? handleNext : submit}
          label={submitted ? (isLast ? 'Se resultat' : 'Nästa') : 'Svara'}
        />
      </div>
    </SessionShell>
  );
}

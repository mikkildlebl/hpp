'use client';

import { useRouter } from 'next/navigation';

import { OptionList } from '@/components/OptionList';
import { LoadingState, SessionProgress, SessionShell, SubmitButton } from '@/components/SessionShell';
import { fetchLasPassageGroups } from '@/lib/questions';
import { useGroupSession } from '@/lib/useGroupSession';
import { useMinWidth } from '@/lib/use-min-width';
import { PassageGroup } from '@/lib/types';

// LAS texts each carry several questions in the real exam, so this groups by
// passage: the text is shown once, followed by every question that belongs to
// it, instead of shuffling individual questions across unrelated texts.
const LAS_PASSAGE_COUNT = 5;
const TWO_COLUMN_BREAKPOINT = 640;

export function LasSession() {
  const router = useRouter();
  const useTwoColumns = useMinWidth(TWO_COLUMN_BREAKPOINT);
  const { groups, group, index, isLast, selections, submitted, allSelected, answers, score, select, submit, advance } =
    useGroupSession<PassageGroup>(() => fetchLasPassageGroups(LAS_PASSAGE_COUNT));

  if (!groups) {
    return (
      <SessionShell>
        <LoadingState label="Laddar texter…" />
      </SessionShell>
    );
  }

  if (groups.length === 0) {
    return (
      <SessionShell>
        <LoadingState label="Inga texter hittades." />
      </SessionShell>
    );
  }

  const handleNext = () => advance(() => router.replace('/session/summary'));

  const columns = useTwoColumns
    ? [group!.paragraphs.slice(0, Math.ceil(group!.paragraphs.length / 2)), group!.paragraphs.slice(Math.ceil(group!.paragraphs.length / 2))]
    : [group!.paragraphs];

  return (
    <SessionShell>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 sm:px-12">
        <SessionProgress current={index + 1} total={groups.length} correct={score.correct} />

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-2xl leading-tight font-semibold text-white sm:text-[32px] sm:leading-[44px]">{group!.title}</h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/85">
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

        {group!.questions.map((question, i) => (
          <div key={question.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-lg leading-snug font-semibold text-white sm:text-xl">
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

        <SubmitButton
          disabled={!allSelected && !submitted}
          onClick={submitted ? handleNext : submit}
          label={submitted ? (isLast ? 'Se resultat' : 'Nästa text') : 'Svara'}
        />
      </div>
    </SessionShell>
  );
}

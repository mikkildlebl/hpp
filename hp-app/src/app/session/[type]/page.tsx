'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OptionList } from '@/components/OptionList';
import { QuestionCard } from '@/components/QuestionCard';
import { SessionProgress, SessionShell, SubmitButton } from '@/components/SessionShell';
import { useSession } from '@/lib/SessionContext';
import { useMinWidth } from '@/lib/use-min-width';
import { fetchDtkPageGroups, fetchLasPassageGroups, fetchQuestionsByType } from '@/lib/questions';
import { DtkGroup, PassageGroup, QuestionType } from '@/lib/types';

const SESSION_LENGTH = 10;
const LAS_PASSAGE_COUNT = 5;
const DTK_GROUP_COUNT = 5;

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-white/50">{label}</p>
    </div>
  );
}

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

function IndividualSession({ type }: { type: QuestionType }) {
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
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 px-6 py-8 sm:px-12">
        <SessionProgress current={index + 1} total={questions.length} correct={score.correct} />

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
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

// LAS texts each carry several questions in the real exam, so this groups by
// passage: the text is shown once, followed by every question that belongs to
// it, instead of shuffling individual questions across unrelated texts.
const TWO_COLUMN_BREAKPOINT = 640;

function LasSession() {
  const router = useRouter();
  const { startSession, answerQuestion, answers, score } = useSession();
  const [groups, setGroups] = useState<PassageGroup[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const useTwoColumns = useMinWidth(TWO_COLUMN_BREAKPOINT);

  useEffect(() => {
    fetchLasPassageGroups(LAS_PASSAGE_COUNT).then((gs) => {
      startSession(gs.flatMap((g) => g.questions));
      setGroups(gs);
      setIndex(0);
      setSelections({});
      setSubmitted(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const group = groups[index];
  const isLast = index === groups.length - 1;
  const allSelected = group.questions.every((q) => selections[q.id]);

  const handleSubmit = () => {
    if (!allSelected) return;
    group.questions.forEach((q) => answerQuestion(q.id, selections[q.id]));
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/session/summary');
      return;
    }
    setIndex(index + 1);
    setSelections({});
    setSubmitted(false);
  };

  const columns = useTwoColumns
    ? [group.paragraphs.slice(0, Math.ceil(group.paragraphs.length / 2)), group.paragraphs.slice(Math.ceil(group.paragraphs.length / 2))]
    : [group.paragraphs];

  return (
    <SessionShell>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-8 sm:px-12">
        <SessionProgress current={index + 1} total={groups.length} correct={score.correct} />

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-2xl leading-tight font-semibold text-white sm:text-[32px] sm:leading-[44px]">{group.title}</h2>
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

        {group.questions.map((question, i) => (
          <div key={question.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-xl leading-snug font-semibold text-white sm:text-2xl">
              {i + 1}. {question.question_text}
            </h3>
            <OptionList
              options={question.options}
              selected={submitted ? (answers[question.id] ?? null) : (selections[question.id] ?? null)}
              submitted={submitted}
              correctAnswer={question.correct_answer}
              onSelect={(label) => setSelections((prev) => ({ ...prev, [question.id]: label }))}
            />
          </div>
        ))}

        <SubmitButton
          disabled={!allSelected && !submitted}
          onClick={submitted ? handleNext : handleSubmit}
          label={submitted ? (isLast ? 'Se resultat' : 'Nästa text') : 'Svara'}
        />
      </div>
    </SessionShell>
  );
}

// DTK pages often carry several questions about the same diagram, and the
// unmodified full-page image reads far better shown once, large, alongside all
// of them than repeated small per question. Side-by-side on wide screens (the
// image fills the available height); stacked on narrow ones where a split would
// leave both halves too cramped to use.
const DTK_ROW_BREAKPOINT = 700;
const DTK_DEFAULT_ASPECT_RATIO = 0.72;

function DtkSession() {
  const router = useRouter();
  const { startSession, answerQuestion, answers, score } = useSession();
  const [groups, setGroups] = useState<DtkGroup[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(DTK_DEFAULT_ASPECT_RATIO);
  const useSideBySide = useMinWidth(DTK_ROW_BREAKPOINT);

  useEffect(() => {
    fetchDtkPageGroups(DTK_GROUP_COUNT).then((gs) => {
      startSession(gs.flatMap((g) => g.questions));
      setGroups(gs);
      setIndex(0);
      setSelections({});
      setSubmitted(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const group = groups[index];
  const isLast = index === groups.length - 1;
  const allSelected = group.questions.every((q) => selections[q.id]);

  const handleSubmit = () => {
    if (!allSelected) return;
    group.questions.forEach((q) => answerQuestion(q.id, selections[q.id]));
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/session/summary');
      return;
    }
    setIndex(index + 1);
    setSelections({});
    setSubmitted(false);
  };

  const image = (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic aspect ratio measured from the loaded image itself
    <img
      src={group.diagramUrl}
      alt=""
      className={`rounded-2xl border border-white/10 bg-white/[0.03] ${useSideBySide ? 'max-h-[calc(100vh-12rem)] w-auto' : 'w-full'}`}
      style={{ aspectRatio, objectFit: 'contain' }}
      onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
    />
  );

  const questionsList = (
    <>
      {group.questions.map((question, i) => (
        <div key={question.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-sm font-bold text-white">
            {i + 1}. {question.question_text}
          </p>
          <OptionList
            compact
            options={question.options}
            selected={submitted ? (answers[question.id] ?? null) : (selections[question.id] ?? null)}
            submitted={submitted}
            correctAnswer={question.correct_answer}
            onSelect={(label) => setSelections((prev) => ({ ...prev, [question.id]: label }))}
          />
        </div>
      ))}
      <SubmitButton
        disabled={!allSelected && !submitted}
        onClick={submitted ? handleNext : handleSubmit}
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

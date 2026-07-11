'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { OptionList } from '@/components/OptionList';
import { QuestionCard } from '@/components/QuestionCard';
import { useSession } from '@/lib/SessionContext';
import { useMinWidth } from '@/lib/use-min-width';
import { fetchDtkPageGroups, fetchLasPassageGroups, fetchQuestionsByType } from '@/lib/questions';
import { DtkGroup, PassageGroup, QuestionType } from '@/lib/types';

const SESSION_LENGTH = 10;
const LAS_PASSAGE_COUNT = 5;
const DTK_GROUP_COUNT = 5;

function SubmitButton({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-[#3c87f7] p-4 text-center text-sm font-bold text-white disabled:opacity-40">
      {label}
    </button>
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
      <div className="flex flex-1 items-center justify-center p-6">
        <p>Laddar frågor…</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p>Inga frågor hittades för denna typ.</p>
      </div>
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
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 p-6">
      <p className="text-sm text-text-secondary">
        Fråga {index + 1} av {questions.length} · {score.correct} rätt hittills
      </p>

      <QuestionCard
        question={question}
        selected={submitted ? (answers[question.id] ?? null) : selected}
        submitted={submitted}
        onSelect={setSelected}
      />

      <SubmitButton
        disabled={!selected && !submitted}
        onClick={submitted ? handleNext : handleSubmit}
        label={submitted ? (isLast ? 'Se resultat' : 'Nästa fråga') : 'Svara'}
      />
    </div>
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
      <div className="flex flex-1 items-center justify-center p-6">
        <p>Laddar texter…</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p>Inga texter hittades.</p>
      </div>
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
    <div className="mx-auto flex w-full max-w-full flex-1 flex-col gap-6 p-6">
      <p className="text-sm text-text-secondary">
        Text {index + 1} av {groups.length} · {score.correct} rätt hittills
      </p>

      <h2 className="text-[32px] leading-[44px] font-semibold">{group.title}</h2>
      <div className="rounded-lg border border-option-border p-4">
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

      {group.questions.map((question, i) => (
        <div key={question.id} className="flex flex-col gap-2">
          <h3 className="text-[32px] leading-[44px] font-semibold">
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
      <div className="flex flex-1 items-center justify-center p-6">
        <p>Laddar diagram…</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p>Inga diagram hittades.</p>
      </div>
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
      className={`rounded-lg bg-background-element ${useSideBySide ? 'max-h-[calc(100vh-8rem)] w-auto' : 'w-full'}`}
      style={{ aspectRatio, objectFit: 'contain' }}
      onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
    />
  );

  const questionsList = (
    <>
      {group.questions.map((question, i) => (
        <div key={question.id} className="flex flex-col gap-1">
          <p className="text-sm font-bold">
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
    <div className="flex w-full max-w-full flex-1 flex-col gap-4 p-6">
      <p className="text-sm text-text-secondary">
        Diagram {index + 1} av {groups.length} · {score.correct} rätt hittills
      </p>
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
  );
}

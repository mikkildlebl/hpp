import { OptionList } from '@/components/OptionList';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

const QUANTITY_PATTERN = /^(.*?)Kvantitet I:\s*(.*?)\s*Kvantitet II:\s*(.*)$/s;

function parseQuantities(text: string): { intro: string; quantityI: string; quantityII: string } | null {
  const match = text.match(QUANTITY_PATTERN);
  if (!match) return null;
  const [, intro, quantityI, quantityII] = match;
  return { intro: intro.trim(), quantityI: quantityI.trim(), quantityII: quantityII.trim() };
}

export function KvaCompare({ question, selected, submitted, onSelect }: Props) {
  const parsed = parseQuantities(question.question_text);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-semibold tracking-wide text-text/50 uppercase">Jämför de två kvantiteterna</p>
      {parsed ? (
        <>
          {parsed.intro && (
            <div className="rounded-2xl border border-text/10 bg-text/[0.03] p-6 text-text">
              <p>{parsed.intro}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl border border-text/10 bg-text/[0.03] p-4">
              <p className="text-sm font-semibold tracking-wide text-text/50 uppercase">Kvantitet I</p>
              <p className="text-[22px] leading-7 font-semibold text-text">{parsed.quantityI}</p>
            </div>
            <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl border border-text/10 bg-text/[0.03] p-4">
              <p className="text-sm font-semibold tracking-wide text-text/50 uppercase">Kvantitet II</p>
              <p className="text-[22px] leading-7 font-semibold text-text">{parsed.quantityII}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-text/10 bg-text/[0.03] p-6">
          <p className="text-2xl leading-8 font-semibold text-text">{question.question_text}</p>
        </div>
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

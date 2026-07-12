import { OptionList } from '@/components/OptionList';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

export function NogSufficiency({ question, selected, submitted, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[32px] leading-[44px] font-semibold text-white">{question.question_text}</p>
      {question.nog_statements && (
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
          {question.nog_statements.map((statement, i) => (
            <p key={i}>{statement}</p>
          ))}
        </div>
      )}
      <p className="text-sm text-white/50">Räcker informationen i (1) och/eller (2) för att besvara frågan?</p>
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

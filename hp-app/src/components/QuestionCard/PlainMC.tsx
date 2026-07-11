import { MathText } from '@/components/MathText';
import { OptionList } from '@/components/OptionList';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function PlainMC({ question, selected, submitted, onSelect }: Props) {
  const text = question.question_type === 'ORD' ? capitalize(question.question_text) : question.question_text;

  return (
    <div className="flex flex-col gap-6">
      <MathText type="subtitle">{text}</MathText>
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

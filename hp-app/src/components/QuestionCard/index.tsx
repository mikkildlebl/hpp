import { Question } from '@/lib/types';

import { DiagramMC } from './DiagramMC';
import { KvaCompare } from './KvaCompare';
import { NogSufficiency } from './NogSufficiency';
import { PassageMC } from './PassageMC';
import { PlainMC } from './PlainMC';

export type QuestionCardProps = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

export function QuestionCard(props: QuestionCardProps) {
  const { question } = props;

  // graph-reading XYZ rows carry a diagram_path too, so check that before question_type.
  if (question.diagram_path) {
    return <DiagramMC {...props} />;
  }

  switch (question.question_type) {
    case 'LAS':
    case 'ELF':
      return <PassageMC {...props} />;
    case 'KVA':
      return <KvaCompare {...props} />;
    case 'NOG':
      return <NogSufficiency {...props} />;
    default:
      return <PlainMC {...props} />;
  }
}

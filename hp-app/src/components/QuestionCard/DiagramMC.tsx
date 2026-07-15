'use client';

import { useState } from 'react';

import { DiagramImage } from '@/components/DiagramImage';
import { MathText } from '@/components/MathText';
import { OptionList } from '@/components/OptionList';
import { resolveDiagramUrl } from '@/lib/storage';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

// Diagrams are portrait exam-page scans; this is a reasonable guess until the
// real image loads and reports its own ratio via onLoad. XYZ stems are
// cropped as wide, short strips instead, so they start from a wider guess.
const DEFAULT_ASPECT_RATIO = 0.72;
const DEFAULT_XYZ_ASPECT_RATIO = 4;

export function DiagramMC({ question, selected, submitted, onSelect }: Props) {
  const isXyz = question.question_type === 'XYZ';
  const [aspectRatio, setAspectRatio] = useState(isXyz ? DEFAULT_XYZ_ASPECT_RATIO : DEFAULT_ASPECT_RATIO);
  const diagramUrl = question.diagram_path ? resolveDiagramUrl(question.diagram_path) : null;

  return (
    <div className="flex flex-col gap-6">
      {diagramUrl && <DiagramImage src={diagramUrl} className="w-full" aspectRatio={aspectRatio} onAspectRatioChange={setAspectRatio} />}
      {question.question_text ? <MathText type="subtitle">{question.question_text}</MathText> : null}
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

'use client';

import { useState } from 'react';

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
      {diagramUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- dynamic aspect ratio measured from the loaded image itself
        <img
          src={diagramUrl}
          alt=""
          className="w-full rounded-lg bg-background-element"
          style={{ aspectRatio, objectFit: 'contain' }}
          loading="eager"
          onLoad={(e) => setAspectRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
        />
      )}
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

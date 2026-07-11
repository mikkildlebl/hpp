import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { MathText } from '@/components/MathText';
import { OptionList } from '@/components/OptionList';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
    <ThemedView style={styles.container}>
      {diagramUrl && (
        <Image
          source={{ uri: diagramUrl }}
          style={[styles.diagram, { aspectRatio }]}
          contentFit="contain"
          loading="eager"
          onLoad={(event) => setAspectRatio(event.source.width / event.source.height)}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  diagram: {
    width: '100%',
    borderRadius: Spacing.two,
    backgroundColor: '#F0F0F3',
  },
});

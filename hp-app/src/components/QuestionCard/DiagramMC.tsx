import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { OptionList } from '@/components/OptionList';
import { ThemedText } from '@/components/themed-text';
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

export function DiagramMC({ question, selected, submitted, onSelect }: Props) {
  return (
    <ThemedView style={styles.container}>
      {question.diagram_path && (
        <Image
          source={{ uri: resolveDiagramUrl(question.diagram_path) }}
          style={styles.diagram}
          contentFit="contain"
          loading="eager"
        />
      )}
      <ThemedText type="subtitle">{question.question_text}</ThemedText>
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
    height: 320,
    borderRadius: Spacing.two,
    backgroundColor: '#F0F0F3',
  },
});

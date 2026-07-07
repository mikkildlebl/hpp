import { StyleSheet } from 'react-native';

import { OptionList } from '@/components/OptionList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

export function PlainMC({ question, selected, submitted, onSelect }: Props) {
  return (
    <ThemedView style={styles.container}>
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
});

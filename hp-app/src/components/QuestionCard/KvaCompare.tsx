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

export function KvaCompare({ question, selected, submitted, onSelect }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Jämför de två kvantiteterna
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.compareBox}>
        <ThemedText type="subtitle">{question.question_text}</ThemedText>
      </ThemedView>
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
  compareBox: { padding: Spacing.four, borderRadius: Spacing.three },
});

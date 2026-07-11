import { StyleSheet } from 'react-native';

import { MathText } from '@/components/MathText';
import { OptionList } from '@/components/OptionList';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
    <ThemedView style={styles.container}>
      <MathText type="subtitle">{text}</MathText>
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

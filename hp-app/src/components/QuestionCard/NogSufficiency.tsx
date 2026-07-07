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

export function NogSufficiency({ question, selected, submitted, onSelect }: Props) {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">{question.question_text}</ThemedText>
      {question.nog_statements && (
        <ThemedView type="backgroundElement" style={styles.statementsBox}>
          {question.nog_statements.map((statement, i) => (
            <ThemedText key={i}>{statement}</ThemedText>
          ))}
        </ThemedView>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        Räcker informationen i (1) och/eller (2) för att besvara frågan?
      </ThemedText>
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
  statementsBox: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
});

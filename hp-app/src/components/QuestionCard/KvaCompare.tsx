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

const QUANTITY_PATTERN = /^(.*?)Kvantitet I:\s*(.*?)\s*Kvantitet II:\s*(.*)$/s;

function parseQuantities(text: string): { intro: string; quantityI: string; quantityII: string } | null {
  const match = text.match(QUANTITY_PATTERN);
  if (!match) return null;
  const [, intro, quantityI, quantityII] = match;
  return { intro: intro.trim(), quantityI: quantityI.trim(), quantityII: quantityII.trim() };
}

export function KvaCompare({ question, selected, submitted, onSelect }: Props) {
  const parsed = parseQuantities(question.question_text);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        Jämför de två kvantiteterna
      </ThemedText>
      {parsed ? (
        <>
          {parsed.intro && (
            <ThemedView type="backgroundElement" style={styles.introBox}>
              <ThemedText>{parsed.intro}</ThemedText>
            </ThemedView>
          )}
          <ThemedView style={styles.quantityRow}>
            <ThemedView type="backgroundElement" style={styles.quantityBox}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                KVANTITET I
              </ThemedText>
              <ThemedText type="subtitle" style={styles.quantityValue}>
                {parsed.quantityI}
              </ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.quantityBox}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                KVANTITET II
              </ThemedText>
              <ThemedText type="subtitle" style={styles.quantityValue}>
                {parsed.quantityII}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </>
      ) : (
        <ThemedView type="backgroundElement" style={styles.introBox}>
          <ThemedText type="subtitle">{question.question_text}</ThemedText>
        </ThemedView>
      )}
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
  introBox: { padding: Spacing.four, borderRadius: Spacing.three },
  quantityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  quantityBox: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  quantityValue: { fontSize: 22, lineHeight: 28 },
});

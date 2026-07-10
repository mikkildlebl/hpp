import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ParsedOption } from '@/lib/types';

type Props = {
  options: ParsedOption[];
  selected: string | null;
  submitted: boolean;
  correctAnswer: string;
  onSelect: (label: string) => void;
  compact?: boolean;
};

export function OptionList({ options, selected, submitted, correctAnswer, onSelect, compact }: Props) {
  return (
    <ThemedView style={styles.list}>
      {options.map((opt) => {
        const isSelected = selected === opt.label;
        const isCorrect = opt.label === correctAnswer;

        let stateStyle;
        if (submitted && isCorrect) stateStyle = styles.correct;
        else if (submitted && isSelected && !isCorrect) stateStyle = styles.incorrect;
        else if (isSelected) stateStyle = styles.selected;

        return (
          <Pressable
            key={opt.label}
            disabled={submitted}
            onPress={() => onSelect(opt.label)}
            style={[styles.option, compact && styles.optionCompact, stateStyle]}>
            <ThemedText type="smallBold" style={styles.label}>
              {opt.label}
            </ThemedText>
            <ThemedText type={compact ? 'small' : 'default'} style={styles.optionText}>
              {opt.text}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  option: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D3D9',
  },
  optionCompact: { padding: Spacing.two, gap: Spacing.one },
  selected: { borderColor: '#3c87f7', backgroundColor: '#EAF2FE' },
  correct: { borderColor: '#2E9E5B', backgroundColor: '#E4F7EC' },
  incorrect: { borderColor: '#D64545', backgroundColor: '#FBEAEA' },
  label: { width: 24 },
  optionText: { flex: 1 },
});

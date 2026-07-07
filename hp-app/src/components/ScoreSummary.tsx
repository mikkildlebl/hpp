import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = {
  correct: number;
  total: number;
};

export function ScoreSummary({ correct, total }: Props) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">
        {correct} / {total}
      </ThemedText>
      <ThemedText type="subtitle">{pct}% rätt</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: Spacing.two },
});

import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScoreSummary } from '@/components/ScoreSummary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/SessionContext';

export default function SummaryScreen() {
  const { score } = useSession();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScoreSummary correct={score.correct} total={score.total} />
        <Pressable style={styles.button} onPress={() => router.replace('/')}>
          <ThemedText type="smallBold" themeColor="background">
            Tillbaka till start
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.five, padding: Spacing.four },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
});

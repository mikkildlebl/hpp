import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuestionCard } from '@/components/QuestionCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/SessionContext';
import { fetchQuestionsByType } from '@/lib/questions';
import { QuestionType } from '@/lib/types';

const SESSION_LENGTH = 10;

export default function SessionScreen() {
  const { type } = useLocalSearchParams<{ type: QuestionType }>();
  const { questions, answers, startSession, answerQuestion, score } = useSession();
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchQuestionsByType(type, SESSION_LENGTH).then((qs) => {
      startSession(qs);
      setIndex(0);
      setSelected(null);
      setSubmitted(false);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText>Laddar frågor…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText>Inga frågor hittades för denna typ.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const question = questions[index];
  const isLast = index === questions.length - 1;

  const handleSubmit = () => {
    if (!selected) return;
    answerQuestion(question.id, selected);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/session/summary');
      return;
    }
    setIndex(index + 1);
    setSelected(null);
    setSubmitted(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="textSecondary">
          Fråga {index + 1} av {questions.length} · {score.correct} rätt hittills
        </ThemedText>

        <QuestionCard
          question={question}
          selected={submitted ? (answers[question.id] ?? null) : selected}
          submitted={submitted}
          onSelect={setSelected}
        />

        <Pressable
          style={[styles.button, !selected && !submitted && styles.buttonDisabled]}
          disabled={!selected && !submitted}
          onPress={submitted ? handleNext : handleSubmit}>
          <ThemedText type="smallBold" themeColor="background">
            {submitted ? (isLast ? 'Se resultat' : 'Nästa fråga') : 'Svara'}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.four, maxWidth: 640, alignSelf: 'center', width: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
});

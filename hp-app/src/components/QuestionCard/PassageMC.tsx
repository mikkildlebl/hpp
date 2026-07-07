import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { OptionList } from '@/components/OptionList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchPassage } from '@/lib/questions';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

export function PassageMC({ question, selected, submitted, onSelect }: Props) {
  const [passageText, setPassageText] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(question.passage_id));

  useEffect(() => {
    let cancelled = false;
    if (!question.passage_id) {
      setPassageText(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPassage(question.passage_id).then((passage) => {
      if (!cancelled) {
        setPassageText(passage?.content ?? null);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [question.passage_id]);

  return (
    <ThemedView style={styles.container}>
      {loading && <ThemedText type="small">Laddar text…</ThemedText>}
      {passageText && (
        <ScrollView style={styles.passageBox} contentContainerStyle={styles.passageContent}>
          <ThemedText>{passageText}</ThemedText>
        </ScrollView>
      )}
      <ThemedText type="subtitle">{question.question_text}</ThemedText>
      {question.possibly_truncated && (
        <ThemedText type="small" themeColor="textSecondary">
          Obs: källdatan för ett eller flera svarsalternativ kan vara avklippt.
        </ThemedText>
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
  passageBox: {
    maxHeight: 260,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D3D9',
  },
  passageContent: { padding: Spacing.three },
});

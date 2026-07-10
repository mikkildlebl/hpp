import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { OptionList } from '@/components/OptionList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchPassage } from '@/lib/questions';
import { formatPassage, FormattedPassage } from '@/lib/text';
import { Question } from '@/lib/types';

type Props = {
  question: Question;
  selected: string | null;
  submitted: boolean;
  onSelect: (label: string) => void;
};

export function PassageMC({ question, selected, submitted, onSelect }: Props) {
  const [passage, setPassage] = useState<FormattedPassage | null>(null);
  const [loading, setLoading] = useState(Boolean(question.passage_id));

  useEffect(() => {
    let cancelled = false;
    if (!question.passage_id) {
      setPassage(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchPassage(question.passage_id).then((result) => {
      if (!cancelled) {
        setPassage(result?.content ? formatPassage(result.content) : null);
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
      {passage && (
        <ThemedView style={styles.passageBox}>
          {passage.title && <ThemedText type="smallBold">{passage.title}</ThemedText>}
          {passage.paragraphs.map((paragraph, i) => (
            <ThemedText key={i} style={styles.paragraph}>
              {paragraph}
            </ThemedText>
          ))}
        </ThemedView>
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
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D3D9',
  },
  paragraph: { marginTop: Spacing.two },
});

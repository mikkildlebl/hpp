import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchQuestionTypeCounts } from '@/lib/questions';
import { QUESTION_TYPE_LABELS, QuestionType, SECTION_QUESTION_TYPES, SectionType } from '@/lib/types';

const SECTION_LABELS: Record<SectionType, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
};

export default function HomeScreen() {
  const [counts, setCounts] = useState<Record<QuestionType, number> | null>(null);

  useEffect(() => {
    fetchQuestionTypeCounts().then(setCounts);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="title">Högskoleprovet</ThemedText>
          <ThemedText type="default" themeColor="textSecondary">
            Öva på en fråga i taget, se resultatet direkt.
          </ThemedText>

          {(Object.keys(SECTION_QUESTION_TYPES) as SectionType[]).map((section) => (
            <ThemedView key={section} style={styles.section}>
              <ThemedText type="subtitle">{SECTION_LABELS[section]}</ThemedText>
              {SECTION_QUESTION_TYPES[section].map((type) => (
                <Link key={type} href={{ pathname: '/session/[type]', params: { type } }} asChild>
                  <ThemedView type="backgroundElement" style={styles.typeRow}>
                    <ThemedText type="smallBold">{type}</ThemedText>
                    <ThemedText style={styles.typeName}>{QUESTION_TYPE_LABELS[type]}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {counts ? `${counts[type]} frågor` : '…'}
                    </ThemedText>
                  </ThemedView>
                </Link>
              ))}
            </ThemedView>
          ))}

          <Link href="/glossary" asChild>
            <ThemedView type="backgroundElement" style={styles.typeRow}>
              <ThemedText type="smallBold">Ordbank</ThemedText>
              <ThemedText style={styles.typeName}>Prefix &amp; suffix</ThemedText>
            </ThemedView>
          </Link>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.four, gap: Spacing.four, maxWidth: 640, alignSelf: 'center', width: '100%' },
  section: { gap: Spacing.two },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  typeName: { flex: 1 },
});

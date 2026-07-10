import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OptionList } from '@/components/OptionList';
import { QuestionCard } from '@/components/QuestionCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/lib/SessionContext';
import { fetchDtkPageGroups, fetchLasPassageGroups, fetchQuestionsByType } from '@/lib/questions';
import { DtkGroup, PassageGroup, QuestionType } from '@/lib/types';

const SESSION_LENGTH = 10;
const LAS_PASSAGE_COUNT = 5;
const DTK_GROUP_COUNT = 5;

export default function SessionScreen() {
  const { type } = useLocalSearchParams<{ type: QuestionType }>();

  if (type === 'LAS') {
    return <LasSession />;
  }
  if (type === 'DTK') {
    return <DtkSession />;
  }
  return <IndividualSession type={type} />;
}

function IndividualSession({ type }: { type: QuestionType }) {
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// LAS texts each carry several questions in the real exam, so this groups by
// passage: the text is shown once, followed by every question that belongs to
// it, instead of shuffling individual questions across unrelated texts.
const TWO_COLUMN_BREAKPOINT = 640;

function LasSession() {
  const { startSession, answerQuestion, answers, score } = useSession();
  const [groups, setGroups] = useState<PassageGroup[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const useTwoColumns = windowWidth >= TWO_COLUMN_BREAKPOINT;

  useEffect(() => {
    fetchLasPassageGroups(LAS_PASSAGE_COUNT).then((gs) => {
      startSession(gs.flatMap((g) => g.questions));
      setGroups(gs);
      setIndex(0);
      setSelections({});
      setSubmitted(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!groups) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText>Laddar texter…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (groups.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText>Inga texter hittades.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const group = groups[index];
  const isLast = index === groups.length - 1;
  const allSelected = group.questions.every((q) => selections[q.id]);

  const handleSubmit = () => {
    if (!allSelected) return;
    group.questions.forEach((q) => answerQuestion(q.id, selections[q.id]));
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/session/summary');
      return;
    }
    setIndex(index + 1);
    setSelections({});
    setSubmitted(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, styles.lasSafeArea]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedText type="small" themeColor="textSecondary">
            Text {index + 1} av {groups.length} · {score.correct} rätt hittills
          </ThemedText>

          <ThemedText type="subtitle">{group.title}</ThemedText>
          <ThemedView style={styles.passageBox}>
            <ThemedView style={useTwoColumns && styles.passageColumns}>
              {(useTwoColumns
                ? [
                    group.paragraphs.slice(0, Math.ceil(group.paragraphs.length / 2)),
                    group.paragraphs.slice(Math.ceil(group.paragraphs.length / 2)),
                  ]
                : [group.paragraphs]
              ).map((column, ci) => (
                <ThemedView key={ci} style={useTwoColumns && styles.passageColumn}>
                  {column.map((paragraph, i) => (
                    <ThemedText key={i} style={styles.paragraph}>
                      {paragraph}
                    </ThemedText>
                  ))}
                </ThemedView>
              ))}
            </ThemedView>
          </ThemedView>

          {group.questions.map((question, i) => (
            <ThemedView key={question.id} style={styles.questionBlock}>
              <ThemedText type="subtitle">
                {i + 1}. {question.question_text}
              </ThemedText>
              <OptionList
                options={question.options}
                selected={submitted ? (answers[question.id] ?? null) : (selections[question.id] ?? null)}
                submitted={submitted}
                correctAnswer={question.correct_answer}
                onSelect={(label) => setSelections((prev) => ({ ...prev, [question.id]: label }))}
              />
            </ThemedView>
          ))}

          <Pressable
            style={[styles.button, !allSelected && !submitted && styles.buttonDisabled]}
            disabled={!allSelected && !submitted}
            onPress={submitted ? handleNext : handleSubmit}>
            <ThemedText type="smallBold" themeColor="background">
              {submitted ? (isLast ? 'Se resultat' : 'Nästa text') : 'Svara'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// DTK pages often carry several questions about the same diagram, and the
// unmodified full-page image reads far better shown once, large, alongside all
// of them than repeated small per question. Side-by-side on wide screens (the
// image fills the available height); stacked on narrow ones where a split would
// leave both halves too cramped to use.
const DTK_ROW_BREAKPOINT = 700;
const DTK_DEFAULT_ASPECT_RATIO = 0.72;

function DtkSession() {
  const { startSession, answerQuestion, answers, score } = useSession();
  const [groups, setGroups] = useState<DtkGroup[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(DTK_DEFAULT_ASPECT_RATIO);
  const { width: windowWidth } = useWindowDimensions();
  const useSideBySide = windowWidth >= DTK_ROW_BREAKPOINT;

  useEffect(() => {
    fetchDtkPageGroups(DTK_GROUP_COUNT).then((gs) => {
      startSession(gs.flatMap((g) => g.questions));
      setGroups(gs);
      setIndex(0);
      setSelections({});
      setSubmitted(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!groups) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText>Laddar diagram…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (groups.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.center}>
          <ThemedText>Inga diagram hittades.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const group = groups[index];
  const isLast = index === groups.length - 1;
  const allSelected = group.questions.every((q) => selections[q.id]);

  const handleSubmit = () => {
    if (!allSelected) return;
    group.questions.forEach((q) => answerQuestion(q.id, selections[q.id]));
    setSubmitted(true);
  };

  const handleNext = () => {
    if (isLast) {
      router.replace('/session/summary');
      return;
    }
    setIndex(index + 1);
    setSelections({});
    setSubmitted(false);
  };

  const image = (
    <Image
      source={{ uri: group.diagramUrl }}
      style={[useSideBySide ? styles.dtkImageTall : styles.dtkImageWide, { aspectRatio }]}
      contentFit="contain"
      onLoad={(event) => setAspectRatio(event.source.width / event.source.height)}
    />
  );

  const questionsList = (
    <>
      {group.questions.map((question, i) => (
        <ThemedView key={question.id} style={styles.questionBlockCompact}>
          <ThemedText type="smallBold">
            {i + 1}. {question.question_text}
          </ThemedText>
          <OptionList
            compact
            options={question.options}
            selected={submitted ? (answers[question.id] ?? null) : (selections[question.id] ?? null)}
            submitted={submitted}
            correctAnswer={question.correct_answer}
            onSelect={(label) => setSelections((prev) => ({ ...prev, [question.id]: label }))}
          />
        </ThemedView>
      ))}
      <Pressable
        style={[styles.button, !allSelected && !submitted && styles.buttonDisabled]}
        disabled={!allSelected && !submitted}
        onPress={submitted ? handleNext : handleSubmit}>
        <ThemedText type="smallBold" themeColor="background">
          {submitted ? (isLast ? 'Se resultat' : 'Nästa diagram') : 'Svara'}
        </ThemedText>
      </Pressable>
    </>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={[styles.safeArea, styles.dtkSafeArea]}>
        <ThemedText type="small" themeColor="textSecondary">
          Diagram {index + 1} av {groups.length} · {score.correct} rätt hittills
        </ThemedText>
        {useSideBySide ? (
          <ThemedView style={styles.dtkRow}>
            <ThemedView style={styles.dtkImageColumn}>{image}</ThemedView>
            <ScrollView style={styles.dtkQuestionsColumn} contentContainerStyle={styles.dtkQuestionsContent}>
              {questionsList}
            </ScrollView>
          </ThemedView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {image}
            {questionsList}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, maxWidth: 640, alignSelf: 'center', width: '100%' },
  lasSafeArea: { maxWidth: '100%' },
  scrollContent: { padding: Spacing.four, gap: Spacing.four },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  passageBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D3D9',
  },
  passageColumns: { flexDirection: 'row', gap: Spacing.four },
  passageColumn: { flex: 1 },
  dtkSafeArea: { maxWidth: '100%', padding: Spacing.four, gap: Spacing.three },
  dtkRow: { flex: 1, flexDirection: 'row', gap: Spacing.four },
  questionBlockCompact: { gap: Spacing.one },
  dtkImageColumn: { height: '100%' },
  dtkImageTall: { height: '100%', borderRadius: Spacing.two, backgroundColor: '#F0F0F3' },
  dtkImageWide: { width: '100%', borderRadius: Spacing.two, backgroundColor: '#F0F0F3' },
  dtkQuestionsColumn: { flex: 1 },
  dtkQuestionsContent: { gap: Spacing.three, paddingBottom: Spacing.two },
  paragraph: { marginBottom: Spacing.two },
  questionBlock: { gap: Spacing.two },
  button: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
});

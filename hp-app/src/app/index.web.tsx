import { Link, Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MathText } from '@/components/MathText';
import { OptionList } from '@/components/OptionList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchQuestionTypeCounts } from '@/lib/questions';
import { ParsedOption, QUESTION_TYPE_LABELS, QuestionType, SECTION_QUESTION_TYPES, SectionType } from '@/lib/types';

const PAGE_MAX_WIDTH = 1040;

const SECTION_LABELS: Record<SectionType, string> = {
  verbal: 'Verbal',
  kvant: 'Kvantitativ',
};

const HERO_QUESTION = 'För de positiva talen A, b och h gäller sambandet A = bh/2. Vad är h?';
const HERO_OPTIONS: ParsedOption[] = [
  { label: 'A', text: 'h = 2Ab' },
  { label: 'B', text: 'h = 2A/b' },
  { label: 'C', text: 'h = Ab/2' },
  { label: 'D', text: 'h = b/2A' },
];

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: '∑',
    title: 'Riktiga bråk och exponenter',
    body: 'Formler visas som formler — bråkstreck, upphöjt läge och parenteser på rätt plats, inte som platt text.',
  },
  {
    icon: '✓',
    title: 'Rättat mot facit',
    body: 'Varje svar är kontrollerat mot det officiella facit som hör till just det provdatumet — inte gissat i efterhand.',
  },
  {
    icon: '⋮⋮',
    title: 'Ett helt pass eller en enda deltyp',
    body: 'Kör ett fullt provpass i tidspress, eller nöt en enskild deltyp — som XYZ eller DTK — tills du sitter still på den.',
  },
];

const STEPS: { title: string; body: string }[] = [
  { title: 'Välj del', body: 'XYZ, DTK eller någon av de andra sex — bestäm vad du vill träna på just nu.' },
  { title: 'Svara', body: 'En fråga i taget, i ditt eget tempo. Inget klockrace om du inte själv vill sätta press.' },
  { title: 'Se resultat direkt', body: 'Rätt eller fel, plus facit, så fort du svarat — inte efter att du bläddrat klart hela häftet.' },
];

const FIRST_TYPE: QuestionType = 'ORD';

export default function LandingScreen() {
  const theme = useTheme();
  const [counts, setCounts] = useState<Record<QuestionType, number> | null>(null);

  useEffect(() => {
    fetchQuestionTypeCounts().then(setCounts);
  }, []);

  const totalQuestions = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : null;

  const goToDelprov = () => {
    router.push('/ova');
  };

  const startPracticing = () => {
    router.push({ pathname: '/session/[type]', params: { type: FIRST_TYPE } });
  };

  return (
    <ThemedView style={styles.page}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={styles.scrollContent}>
        {/* ---------- header ---------- */}
        <ThemedView style={[styles.header, { borderBottomColor: theme.backgroundSelected }]}>
          <View style={[styles.wrap, styles.headerRow]}>
            <View style={styles.brand}>
              <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={styles.brandMarkText}>
                  HP
                </ThemedText>
              </View>
              <ThemedText type="smallBold">HP Pro</ThemedText>
            </View>
            <Pressable onPress={goToDelprov} style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={styles.btnPrimaryText}>
                Börja öva
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {/* ---------- hero ---------- */}
        <View style={[styles.wrap, styles.hero]}>
          <View style={styles.heroCopy}>
            <View style={[styles.eyebrow, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="small" style={[styles.eyebrowText, { color: theme.accent }]}>
                Högskoleprovet · Kvantitativ &amp; verbal del
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Öva högskoleprovet, fråga för fråga.
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.heroLead}>
              {totalQuestions ? `${totalQuestions} ` : 'Tusentals '}frågor ur riktiga prov, rättade mot facit och skrivna med riktiga
              bråk och exponenter — inte inskannad text som spårat ur.
            </ThemedText>
            <View style={styles.heroActions}>
              <Pressable onPress={goToDelprov} style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={styles.btnPrimaryText}>
                  Börja öva gratis
                </ThemedText>
              </Pressable>
              <Pressable onPress={startPracticing} style={[styles.btn, styles.btnGhost, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Hoppa in direkt</ThemedText>
              </Pressable>
            </View>
          </View>

          <ThemedView type="backgroundElement" style={styles.examCard}>
            <View style={[styles.examCardHead, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="small" style={[styles.examCardTag, { color: theme.accent }]}>
                XYZ · Provpass 1
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Fråga 7 av 24
              </ThemedText>
            </View>
            <View style={styles.examCardBody}>
              <MathText type="default">{HERO_QUESTION}</MathText>
              <View style={styles.examCardOptions}>
                <OptionList options={HERO_OPTIONS} selected="B" submitted correctAnswer="B" onSelect={() => {}} compact />
              </View>
            </View>
          </ThemedView>
        </View>

        {/* ---------- provets delar ---------- */}
        <View style={styles.wrap}>
          <View style={styles.sectionHead}>
            <ThemedText type="subtitle">Provets alla delar</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.sectionLead}>
              Högskoleprovet har åtta deltyper fördelat på en verbal och en kvantitativ del. Öva dem var för sig eller
              blanda fritt — varje deltyp har sin egen frågebank.
            </ThemedText>
          </View>

          {(Object.keys(SECTION_QUESTION_TYPES) as SectionType[]).map((section) => (
            <View key={section} style={styles.subSection}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.subSectionLabel}>
                {SECTION_LABELS[section].toUpperCase()}
              </ThemedText>
              <View style={styles.partsGrid}>
                {SECTION_QUESTION_TYPES[section].map((type) => (
                  <Link key={type} href={{ pathname: '/session/[type]', params: { type } }} asChild>
                    <Pressable style={({ hovered }: { hovered?: boolean }) => [
                      styles.part,
                      { backgroundColor: hovered ? theme.accentSoft : theme.backgroundElement },
                    ]}>
                      <ThemedText type="smallBold" style={{ color: theme.accent }}>
                        {type.toUpperCase()}
                      </ThemedText>
                      <ThemedText type="default" style={styles.partName}>
                        {QUESTION_TYPE_LABELS[type]}
                      </ThemedText>
                      <ThemedText type="title" style={styles.partCount}>
                        {counts ? counts[type] : '–'}
                        <ThemedText type="small" themeColor="textSecondary">
                          {' '}
                          frågor
                        </ThemedText>
                      </ThemedText>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* ---------- funktioner ---------- */}
        <View style={styles.wrap}>
          <View style={styles.sectionHead}>
            <ThemedText type="subtitle">Byggt för att faktiskt gå att räkna på</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.sectionLead}>
              Detaljerna som skiljer riktig provträning från en pdf du bläddrar igenom.
            </ThemedText>
          </View>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature) => (
              <ThemedView key={feature.title} type="backgroundElement" style={styles.feature}>
                <View style={[styles.featureIcon, { backgroundColor: theme.accentSoft }]}>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {feature.icon}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.featureTitle}>
                  {feature.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.featureBody}>
                  {feature.body}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        </View>

        {/* ---------- så funkar det ---------- */}
        <View style={styles.wrap}>
          <View style={styles.sectionHead}>
            <ThemedText type="subtitle">Så funkar det</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.sectionLead}>
              Tre steg, ingen inloggning som krångel.
            </ThemedText>
          </View>
          <View style={styles.howGrid}>
            {STEPS.map((step, i) => (
              <View key={step.title} style={styles.howStep}>
                <View style={[styles.stepNo, { backgroundColor: theme.accent }]}>
                  <ThemedText type="smallBold" style={styles.stepNoText}>
                    {i + 1}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.howTitle}>
                  {step.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.featureBody}>
                  {step.body}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* ---------- cta band ---------- */}
        <View style={styles.wrap}>
          <View style={[styles.ctaBand, { backgroundColor: theme.accentSoft }]}>
            <ThemedText type="subtitle" style={styles.ctaTitle}>
              Nästa provomgång väntar inte. Börja där du är.
            </ThemedText>
            <Pressable onPress={goToDelprov} style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={styles.btnPrimaryText}>
                Börja öva gratis
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* ---------- footer ---------- */}
        <View style={[styles.wrap, styles.footer, { borderTopColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary">
            HP Pro — oberoende övningsverktyg för högskoleprovet.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  wrap: { width: '100%', maxWidth: PAGE_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: Spacing.four },

  // header
  header: { borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 68 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  brandMark: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#ffffff', fontSize: 12 },

  // buttons
  btn: { borderRadius: 999, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: {},
  btnPrimaryText: { color: '#ffffff' },
  btnGhost: {},

  // hero
  hero: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.six, paddingTop: 64, paddingBottom: 72, alignItems: 'center' },
  heroCopy: { flex: 1, minWidth: 320, gap: Spacing.three },
  eyebrow: { alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  eyebrowText: { fontWeight: '700' },
  heroTitle: { fontSize: 44, lineHeight: 50 },
  heroLead: { maxWidth: 480, fontSize: 17, lineHeight: 26 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },

  // exam card
  examCard: { width: 380, maxWidth: '100%', borderRadius: 28, overflow: 'hidden' },
  examCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20 },
  examCardTag: { fontWeight: '700' },
  examCardBody: { padding: 20, gap: Spacing.three },
  examCardOptions: { gap: Spacing.two },

  // sections
  sectionHead: { maxWidth: 640, marginBottom: Spacing.four, gap: Spacing.two },
  sectionLead: { fontSize: 16, lineHeight: 24 },
  subSection: { marginTop: Spacing.four, gap: Spacing.three },
  subSectionLabel: { letterSpacing: 1 },

  // parts grid
  partsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  part: { flexBasis: 220, flexGrow: 1, borderRadius: 18, padding: Spacing.three, gap: Spacing.one },
  partName: { fontWeight: '600' },
  partCount: { marginTop: Spacing.two, fontSize: 22, lineHeight: 26 },

  // features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  feature: { flexBasis: 280, flexGrow: 1, borderRadius: 28, padding: Spacing.four, gap: Spacing.one },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  featureTitle: { fontSize: 17 },
  featureBody: { lineHeight: 22, marginTop: 4 },

  // how it works
  howGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four },
  howStep: { flexBasis: 260, flexGrow: 1, gap: Spacing.one },
  stepNo: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  stepNoText: { color: '#ffffff' },
  howTitle: { fontSize: 17 },

  // cta band
  ctaBand: {
    borderRadius: 28,
    padding: Spacing.five,
    marginVertical: Spacing.six,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  ctaTitle: { flex: 1, minWidth: 260, fontSize: 26, lineHeight: 32 },

  // footer
  footer: { paddingVertical: Spacing.four, borderTopWidth: 1 },
});

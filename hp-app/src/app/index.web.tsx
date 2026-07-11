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

const PAGE_MAX_WIDTH = 1080;

// Soft elevated-card shadow (RN shadow* props map to CSS box-shadow on web).
const CARD_SHADOW = {
  shadowColor: '#14203A',
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.12,
  shadowRadius: 40,
  elevation: 8,
};

// Decorative blurred glow circles (web-only CSS filter, not part of RN's StyleSheet types).
const GLOW_BLUR = { filter: 'blur(60px)' } as unknown as { filter: string };

// Darker gradient stop per accent color (web-only CSS backgroundImage).
const CTA_GRADIENT_DARK: Record<string, string> = {
  '#6290C3': '#3A5E8C',
  '#8DB0E0': '#4C74A6',
};

const SECTION_LABELS: Record<SectionType, string> = {
  verbal: 'Verbal del',
  kvant: 'Kvantitativ del',
};

const NAV_LINKS: { label: string; id: string }[] = [
  { label: 'Delprov', id: 'delprov' },
  { label: 'Så funkar det', id: 'funkar' },
  { label: 'Funktioner', id: 'funktioner' },
  { label: 'FAQ', id: 'faq' },
];

const HERO_QUESTION = 'För de positiva talen A, b och h gäller sambandet A = bh/2. Vad är h?';
const HERO_OPTIONS: ParsedOption[] = [
  { label: 'A', text: 'h = 2Ab' },
  { label: 'B', text: 'h = 2A/b' },
  { label: 'C', text: 'h = Ab/2' },
  { label: 'D', text: 'h = b/2A' },
];

const STATS: { value: string; label: string }[] = [
  { value: '8', label: 'deltyper' },
  { value: '100%', label: 'rättat mot facit' },
  { value: '0 kr', label: 'för att komma igång' },
];

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: '∑',
    title: 'Riktiga bråk & exponenter',
    body: 'Matten renderas som riktiga bråk och exponenter — precis som i provhäftet, inte som platt text som spårat ur.',
  },
  {
    icon: '✓',
    title: 'Rättat mot facit',
    body: 'Varje svarsalternativ är kontrollerat mot det officiella facit som hör till just det provdatumet. Ingen gissning.',
  },
  {
    icon: '⋮⋮',
    title: 'Fullt prov eller delprov',
    body: 'Kör ett helt provpass på tid för provkänsla, eller nöt ett enskilt delmoment — som XYZ eller DTK — till du behärskar det.',
  },
  {
    icon: '↺',
    title: 'Direkt feedback',
    body: 'Se om du hade rätt direkt efter varje fråga, med rätt svar tydligt markerat — inget bläddrande till ett facit-häfte.',
  },
];

const STEPS: { title: string; body: string }[] = [
  { title: 'Välj delprov eller fullt prov', body: 'Bestäm om du vill nöta en enskild deltyp i fem minuter eller köra ett helt provpass.' },
  { title: 'Räkna, resonera, svara', body: 'Frågorna presenteras en i taget, i ditt eget tempo — inget klockrace om du inte själv vill sätta press.' },
  { title: 'Få direkt rättning', body: 'Rätt eller fel, plus facit, visas i samma sekund du svarat — inte efter att du bläddrat klart hela häftet.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Är frågorna riktiga högskoleprovsfrågor?',
    a: 'Ja. Alla frågor är hämtade från tidigare högskoleprov, och varje svarsalternativ är kontrollerat mot respektive provs officiella facit.',
  },
  {
    q: 'Kostar det något?',
    a: 'Nej. Alla åtta deltyper är öppna att öva på direkt, utan konto och utan betalning.',
  },
  {
    q: 'Behöver jag skapa ett konto?',
    a: 'Nej, du kan börja öva direkt. Ingen inloggning krävs för att komma igång.',
  },
  {
    q: 'Kan jag öva en enda deltyp, som XYZ eller DTK?',
    a: 'Ja. Varje deltyp har sin egen frågebank som du kan köra separat, i valfri ordning och valfritt antal gånger.',
  },
];

const FIRST_TYPE: QuestionType = 'ORD';

export default function LandingScreen() {
  const theme = useTheme();
  const [counts, setCounts] = useState<Record<QuestionType, number> | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  // The page content scrolls inside RN Web's <ScrollView> div, not document.body,
  // so a plain href="#id" anchor updates the URL hash but never actually scrolls.
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <View style={styles.navLinks}>
              {NAV_LINKS.map((link) => (
                <Pressable key={link.id} onPress={() => scrollToSection(link.id)}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {link.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <Pressable onPress={goToDelprov} style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={styles.btnPrimaryText}>
                Börja öva →
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {/* ---------- hero ---------- */}
        <View style={[styles.wrap, styles.hero]}>
          <View style={styles.heroCopy}>
            <View style={[styles.eyebrow, { backgroundColor: theme.accentSoft }]}>
              <View style={[styles.eyebrowDot, { backgroundColor: theme.accent }]} />
              <ThemedText type="small" style={[styles.eyebrowText, { color: theme.accent }]}>
                Högskoleprovet · Kvantitativ &amp; verbal del
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              Sluta bläddra i pdf:er.{'\n'}
              <ThemedText type="title" style={[styles.heroTitle, { color: theme.accent }]}>
                Börja räkna på riktiga frågor.
              </ThemedText>
            </ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.heroLead}>
              {totalQuestions ? `${totalQuestions} ` : 'Tusentals '}riktiga högskoleprovsfrågor, kontrollerade rad för rad mot
              officiella facit. Öva delprov för delprov eller sätt dig ner för ett helt prov.
            </ThemedText>
            <View style={styles.heroActions}>
              <Pressable onPress={goToDelprov} style={[styles.btn, styles.btnPrimary, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={styles.btnPrimaryText}>
                  Börja öva gratis →
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => scrollToSection('delprov')}
                style={[styles.btn, styles.btnGhost, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold">Se alla delprov</ThemedText>
              </Pressable>
            </View>
            <View style={styles.heroStats}>
              {STATS.map((stat, i) => (
                <View key={stat.label} style={styles.heroStatWrap}>
                  {i > 0 && <View style={[styles.heroStatDivider, { backgroundColor: theme.backgroundSelected }]} />}
                  <View style={styles.heroStat}>
                    <ThemedText type="subtitle" style={styles.heroStatValue}>
                      {stat.value}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {stat.label}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.examCardWrap}>
            <View style={[styles.glow, styles.glowTopRight, { backgroundColor: theme.accent }, GLOW_BLUR]} />
            <View style={[styles.glow, styles.glowBottomLeft, { backgroundColor: theme.accent }, GLOW_BLUR]} />
            <ThemedView type="backgroundElement" style={styles.examCard}>
            <View style={[styles.examCardHead, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="small" style={[styles.examCardTag, { color: theme.accent }]}>
                XYZ · Fråga 7/24
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                00:42
              </ThemedText>
            </View>
            <View style={styles.examCardBody}>
              <MathText type="default">{HERO_QUESTION}</MathText>
              <View style={styles.examCardOptions}>
                <OptionList options={HERO_OPTIONS} selected="B" submitted correctAnswer="B" onSelect={() => {}} compact />
              </View>
              <View style={[styles.examCardFoot, { borderTopColor: theme.backgroundSelected }]}>
                <ThemedText type="small" style={{ color: theme.good }}>
                  ✓ Rätt svar · facit-kontrollerat
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Kvantitativ del
                </ThemedText>
              </View>
            </View>
            </ThemedView>
          </View>
        </View>

        {/* ---------- provets delar ---------- */}
        <View id="delprov" style={[styles.wrap, styles.sectionBand]}>
          <View style={styles.sectionHead}>
            <ThemedText type="smallBold" style={[styles.eyebrowLabel, { color: theme.accent }]}>
              ALLA DELPROV
            </ThemedText>
            <ThemedText type="subtitle">Öva på precis det du behöver</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.sectionLead}>
              Åtta delprov, tusentals frågor — hoppa in i ett delmoment i taget eller kör allt på tid.
            </ThemedText>
          </View>

          {(Object.keys(SECTION_QUESTION_TYPES) as SectionType[]).map((section) => (
            <View key={section} style={styles.subSection}>
              <View style={styles.subSectionHead}>
                <ThemedText type="smallBold">{SECTION_LABELS[section]}</ThemedText>
                <View style={[styles.subSectionBadge, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    {SECTION_QUESTION_TYPES[section].length} delprov
                  </ThemedText>
                </View>
              </View>
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
        <View id="funktioner" style={[styles.wrap, styles.sectionBand]}>
          <View style={styles.sectionHead}>
            <ThemedText type="smallBold" style={[styles.eyebrowLabel, { color: theme.accent }]}>
              BYGGT FÖR RIKTIG ÖVNING
            </ThemedText>
            <ThemedText type="subtitle">Detaljerna som gör skillnad</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.sectionLead}>
              Ingen skärmdump-provkänsla. HP Pro är byggt som ett riktigt provverktyg, från grunden.
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
        <View id="funkar" style={[styles.wrap, styles.sectionBand]}>
          <View style={[styles.sectionHead, styles.sectionHeadCenter]}>
            <ThemedText type="smallBold" style={[styles.eyebrowLabel, { color: theme.accent }]}>
              SÅ FUNKAR DET
            </ThemedText>
            <ThemedText type="subtitle">Från noll till provredo på tre steg</ThemedText>
          </View>
          <View style={styles.howGrid}>
            {STEPS.map((step, i) => (
              <View key={step.title} style={styles.howStep}>
                <View style={styles.howStepHead}>
                  <View style={[styles.stepNo, { backgroundColor: theme.accent }]}>
                    <ThemedText type="smallBold" style={styles.stepNoText}>
                      {i + 1}
                    </ThemedText>
                  </View>
                  {i < STEPS.length - 1 && <View style={[styles.stepConnector, { backgroundColor: theme.backgroundSelected }]} />}
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

        {/* ---------- frågor & svar ---------- */}
        <View id="faq" style={[styles.wrap, styles.sectionBand, styles.faqSection]}>
          <View style={[styles.sectionHead, styles.sectionHeadCenter]}>
            <ThemedText type="smallBold" style={[styles.eyebrowLabel, { color: theme.accent }]}>
              VANLIGA FRÅGOR
            </ThemedText>
            <ThemedText type="subtitle">Bra att veta innan du börjar</ThemedText>
          </View>
          <View style={styles.faqList}>
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <ThemedView key={item.q} type="backgroundElement" style={styles.faqItem}>
                  <Pressable onPress={() => setOpenFaq(isOpen ? null : i)} style={styles.faqTrigger}>
                    <ThemedText type="smallBold" style={styles.faqQuestion}>
                      {item.q}
                    </ThemedText>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={[styles.faqChevron, isOpen && styles.faqChevronOpen]}>
                      ⌄
                    </ThemedText>
                  </Pressable>
                  {isOpen && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.faqAnswer}>
                      {item.a}
                    </ThemedText>
                  )}
                </ThemedView>
              );
            })}
          </View>
        </View>

        {/* ---------- cta band ---------- */}
        <View style={styles.wrap}>
          <View
            style={[
              styles.ctaBand,
              {
                backgroundImage: `linear-gradient(135deg, ${theme.accent}, ${CTA_GRADIENT_DARK[theme.accent] ?? theme.accent})`,
              } as unknown as { backgroundImage: string },
            ]}>
            <View style={[styles.glow, styles.ctaGlowTopLeft, { backgroundColor: '#ffffff' }, GLOW_BLUR]} />
            <View style={[styles.glow, styles.ctaGlowBottomRight, { backgroundColor: '#ffffff' }, GLOW_BLUR]} />
            <ThemedText type="subtitle" style={styles.ctaTitle}>
              Nästa provtillfälle kommer snabbare än du tror.
            </ThemedText>
            <ThemedText type="default" style={styles.ctaLead}>
              Börja plocka poäng redan idag — helt gratis, helt utan pdf-bläddring.
            </ThemedText>
            <Pressable onPress={goToDelprov} style={[styles.btn, styles.btnLight]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Börja öva nu →
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* ---------- footer ---------- */}
        <View style={[styles.wrap, styles.footer, { borderTopColor: theme.backgroundSelected }]}>
          <View style={styles.footerGrid}>
            <View style={styles.footerBrandCol}>
              <View style={styles.brand}>
                <View style={[styles.brandMark, { backgroundColor: theme.accent }]}>
                  <ThemedText type="smallBold" style={styles.brandMarkText}>
                    HP
                  </ThemedText>
                </View>
                <ThemedText type="smallBold">HP Pro</ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.footerTagline}>
                Övningsverktyget för högskoleprovet, byggt med riktiga frågor och officiellt facit.
              </ThemedText>
            </View>
            <View style={styles.footerCol}>
              <ThemedText type="smallBold" style={styles.footerColTitle}>
                Delprov
              </ThemedText>
              {(['ORD', 'XYZ', 'DTK', 'LAS'] as QuestionType[]).map((type) => (
                <Link key={type} href={{ pathname: '/session/[type]', params: { type } }} asChild>
                  <Pressable>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.footerLink}>
                      {QUESTION_TYPE_LABELS[type]} ({type})
                    </ThemedText>
                  </Pressable>
                </Link>
              ))}
            </View>
            <View style={styles.footerCol}>
              <ThemedText type="smallBold" style={styles.footerColTitle}>
                Produkt
              </ThemedText>
              {NAV_LINKS.map((link) => (
                <Pressable key={link.id} onPress={() => scrollToSection(link.id)}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.footerLink}>
                    {link.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.footerBottom, { borderTopColor: theme.backgroundSelected }]}>
            <ThemedText type="small" themeColor="textSecondary">
              Oberoende övningsverktyg för högskoleprovet — ej affilierat med UHR eller Universitets- och högskolerådet.
            </ThemedText>
          </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 68, gap: Spacing.four },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  brandMark: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#ffffff', fontSize: 12 },
  navLinks: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: Spacing.four, display: 'flex' as const },
  navLink: { textDecorationLine: 'none' },

  // buttons
  btn: { borderRadius: 999, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: {},
  btnPrimaryText: { color: '#ffffff' },
  btnGhost: {},
  btnLight: { backgroundColor: '#ffffff', marginTop: Spacing.two },

  // hero
  hero: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.six, paddingTop: 64, paddingBottom: 72, alignItems: 'center' },
  heroCopy: { flex: 1, minWidth: 320, gap: Spacing.three },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3 },
  eyebrowText: { fontWeight: '700' },
  eyebrowLabel: { letterSpacing: 1, marginBottom: 4 },
  heroTitle: { fontSize: 44, lineHeight: 50 },
  heroLead: { maxWidth: 480, fontSize: 17, lineHeight: 26 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four, marginTop: Spacing.four },
  heroStatWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  heroStatDivider: { width: 1, height: 32 },
  heroStat: { gap: 2 },
  heroStatValue: { fontSize: 26, lineHeight: 30 },

  // exam card
  examCardWrap: { width: 380, maxWidth: '100%', position: 'relative' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, opacity: 0.16 },
  glowTopRight: { top: -40, right: -24 },
  glowBottomLeft: { bottom: -56, left: -40 },
  examCard: { width: 380, maxWidth: '100%', borderRadius: 28, overflow: 'hidden', ...CARD_SHADOW },
  examCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 20 },
  examCardTag: { fontWeight: '700' },
  examCardBody: { padding: 20, gap: Spacing.three },
  examCardOptions: { gap: Spacing.two },
  examCardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.three, borderTopWidth: 1 },

  // sections
  sectionBand: { paddingVertical: Spacing.six },
  sectionHead: { maxWidth: 640, marginBottom: Spacing.four, gap: Spacing.one },
  sectionHeadCenter: { alignSelf: 'center', alignItems: 'center' },
  sectionLead: { fontSize: 16, lineHeight: 24, marginTop: 4 },
  subSection: { marginTop: Spacing.four, gap: Spacing.three },
  subSectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  subSectionBadge: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },

  // parts grid
  partsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  part: { flexBasis: 220, flexGrow: 1, borderRadius: 18, padding: Spacing.three, gap: Spacing.one },
  partName: { fontWeight: '600' },
  partCount: { marginTop: Spacing.two, fontSize: 22, lineHeight: 26 },

  // features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  feature: { flexBasis: 260, flexGrow: 1, borderRadius: 28, padding: Spacing.four, gap: Spacing.one, ...CARD_SHADOW, shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  featureIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  featureTitle: { fontSize: 17 },
  featureBody: { lineHeight: 22, marginTop: 4 },

  // how it works
  howGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four },
  howStep: { flexBasis: 260, flexGrow: 1, gap: Spacing.one },
  howStepHead: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.two },
  stepNo: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { color: '#ffffff' },
  stepConnector: { flex: 1, height: 2, marginLeft: Spacing.two },
  howTitle: { fontSize: 17 },

  // faq
  faqSection: { maxWidth: 760 },
  faqList: { gap: Spacing.two, width: '100%' },
  faqItem: { borderRadius: 18, padding: Spacing.four, gap: Spacing.two, ...CARD_SHADOW, shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  faqTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  faqQuestion: { fontSize: 16, flex: 1 },
  faqChevron: { fontSize: 18 },
  faqChevronOpen: { transform: [{ rotate: '180deg' }] },
  faqAnswer: { lineHeight: 22 },

  // cta band
  ctaBand: {
    borderRadius: 28,
    padding: Spacing.five,
    marginVertical: Spacing.six,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  ctaGlowTopLeft: { top: -60, left: -50 },
  ctaGlowBottomRight: { bottom: -70, right: -30 },
  ctaTitle: { color: '#ffffff', textAlign: 'center', maxWidth: 480 },
  ctaLead: { color: '#EAF0F8', textAlign: 'center', marginTop: Spacing.two, maxWidth: 400 },

  // footer
  footer: { paddingTop: Spacing.six, borderTopWidth: 1 },
  footerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.five, paddingBottom: Spacing.five },
  footerBrandCol: { flexBasis: 260, flexGrow: 1, gap: Spacing.two },
  footerTagline: { lineHeight: 20, maxWidth: 280 },
  footerCol: { flexBasis: 160, flexGrow: 1, gap: Spacing.two },
  footerColTitle: { marginBottom: 4 },
  footerLink: { paddingVertical: 2 },
  footerBottom: { paddingVertical: Spacing.four, borderTopWidth: 1 },
});

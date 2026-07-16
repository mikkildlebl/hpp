import passagesData from '@/assets/data/passages.json';

import { supabase } from './supabase';
import { resolveDiagramUrl } from './storage';
import { cleanText, formatPassage, translateMathSymbols } from './text';
import {
  DtkGroup,
  GlossaryEntry,
  Passage,
  PassageGroup,
  Question,
  QuestionType,
  SECTION_QUESTION_TYPES,
  SectionType,
  TestSection,
  TestUnit,
} from './types';

const PASSAGE_TEXTS: Record<string, string> = passagesData;

// Same A-E labels the answer key uses, per type - matches what the exam booklet
// actually offers so synthesized placeholder labels line up with correct_answer.
const OPTION_LABELS: Partial<Record<QuestionType, string>> = { ORD: 'ABCDE', NOG: 'ABCDE' };
const DEFAULT_OPTION_LABELS = 'ABCD';

// A handful of "graph_question" rows (pick-the-matching-graph) never had text
// options captured during extraction - the choices are the graphs themselves,
// already shown in the diagram image, so this just adds the missing buttons.
function withPlaceholderOptions(question: Question): Question {
  if (question.options.length > 0 || !question.graph_question) return question;
  const labels = OPTION_LABELS[question.question_type] ?? DEFAULT_OPTION_LABELS;
  return { ...question, options: [...labels].map((label) => ({ label, text: '' })) };
}

function cleanQuestionText(question: Question): Question {
  const clean = question.section_type === 'kvant' ? (s: string) => translateMathSymbols(cleanText(s)) : cleanText;
  return {
    ...question,
    question_text: clean(question.question_text),
    options: question.options.map((opt) => ({ ...opt, text: clean(opt.text) })),
  };
}

// A small number of source rows have irrecoverably garbled option text (e.g. a
// map-region question whose options came through as literally "A) B", "C) D")
// - the option letter parsed fine but its label text is nonsense, sometimes not
// even including the letter the answer key points to. Filtered out rather than
// shown broken, since there's no way to reconstruct the real option text.
const GARBLED_OPTION_TEXT = /^[A-E]\s*\|?\s*$/;

// A few math-heavy (XYZ) rows have the next question's stem bled into the last
// option (formulas don't survive OCR cleanly, and the following question number
// looks enough like part of the expression that the import-time cleanup left it
// in place) - e.g. an option reading "...12. Vad är värdet av x?" is two
// questions mashed together, not a real answer choice.
const BLEED_THROUGH_TEXT = /.{6,}\s\d{1,2}\.\s+[A-Za-zÅÄÖåäö(].{15,}/;

// Some kvant formulas didn't just lose their symbols but had their 2D layout
// (fractions, exponents, multi-line equations) linearized in the wrong reading
// order during extraction - three or more bare number tokens in a row with no
// connecting words is a reliable sign of that (verified against every verbal
// question in the bank: zero false positives). Not fixable without the source
// PDF's layout, so these are excluded rather than shown as scrambled nonsense.
const SCRAMBLED_FORMULA = /(?:\b\d+[a-zA-Z]?\b\s+){3,}/;

function isScrambled(question: Question): boolean {
  if (question.section_type !== 'kvant') return false;
  if (SCRAMBLED_FORMULA.test(question.question_text)) return true;
  return question.options.some((opt) => SCRAMBLED_FORMULA.test(opt.text));
}

function isUsable(question: Question): boolean {
  if (question.options.some((opt) => GARBLED_OPTION_TEXT.test(opt.text))) return false;
  if (question.options.some((opt) => BLEED_THROUGH_TEXT.test(opt.text))) return false;
  if (question.question_type === 'NOG' && question.nog_statements?.length !== 2) return false;
  if (isScrambled(question)) return false;
  return true;
}

function sanitizeQuestions(questions: Question[]): Question[] {
  return questions.map(withPlaceholderOptions).map(cleanQuestionText).filter(isUsable);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function fetchQuestionsByType(type: QuestionType, count = 10): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('question_type', type)
    .eq('excluded_incomplete', false);
  if (error) throw error;
  return shuffle(sanitizeQuestions((data ?? []) as Question[])).slice(0, count);
}

export async function fetchQuestionsBySection(section: SectionType, count = 10): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('section_type', section)
    .eq('excluded_incomplete', false);
  if (error) throw error;
  return shuffle(sanitizeQuestions((data ?? []) as Question[])).slice(0, count);
}

export async function fetchQuestionTypeCounts(): Promise<Record<QuestionType, number>> {
  const types = Object.values(SECTION_QUESTION_TYPES).flat();
  const entries = await Promise.all(
    types.map(async (type) => {
      const { count, error } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('question_type', type)
        .eq('excluded_incomplete', false);
      if (error) throw error;
      return [type, count ?? 0] as const;
    })
  );
  return Object.fromEntries(entries) as Record<QuestionType, number>;
}

// Sourced from the hp-ovning text extraction (better OCR/column handling than
// the Supabase-imported copy), bundled locally so no network round-trip is needed.
export async function fetchPassage(id: string): Promise<Passage | null> {
  const content = PASSAGE_TEXTS[id];
  return content ? { id, content } : null;
}

function sortByQuestionNumber(questions: Question[]): Question[] {
  return questions.slice().sort((a, b) => a.question_number - b.question_number);
}

async function fetchLasPassageMap(): Promise<Map<string, Question[]>> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('question_type', 'LAS')
    .eq('excluded_incomplete', false);
  if (error) throw error;
  const questions = sanitizeQuestions((data ?? []) as Question[]);

  const byPassage = new Map<string, Question[]>();
  for (const question of questions) {
    if (!question.passage_id) continue;
    const group = byPassage.get(question.passage_id) ?? [];
    group.push(question);
    byPassage.set(question.passage_id, group);
  }
  return byPassage;
}

async function buildPassageGroup(passageId: string, groupQuestions: Question[]): Promise<PassageGroup> {
  const passage = await fetchPassage(passageId);
  const sorted = sortByQuestionNumber(groupQuestions);
  const { source_exam, provpass } = sorted[0];
  const { title, paragraphs } = formatPassage(passage?.content ?? '');
  return {
    title: title ?? `${source_exam} · Provpass ${provpass}`,
    paragraphs,
    questions: sorted,
  };
}

// Groups LAS questions by the text they belong to, so a reading passage is
// shown once together with every question that references it (matching how
// the real exam presents a text followed by its full set of questions).
export async function fetchLasPassageGroups(passageCount = 5): Promise<PassageGroup[]> {
  const byPassage = await fetchLasPassageMap();
  const passageIds = shuffle([...byPassage.keys()]).slice(0, passageCount);
  return Promise.all(passageIds.map((passageId) => buildPassageGroup(passageId, byPassage.get(passageId)!)));
}

// Same passage grouping, but selects however many passages are needed to
// reach an exact question total (trimming the last passage's questions if it
// would overshoot) - used for test simulations, which need each subtest to
// contribute a fixed number of questions rather than a fixed number of texts.
async function fetchLasPassageGroupsByQuestionCount(targetCount: number): Promise<PassageGroup[]> {
  const byPassage = await fetchLasPassageMap();
  const passageIds = shuffle([...byPassage.keys()]);

  const selected: { passageId: string; questions: Question[] }[] = [];
  let total = 0;
  for (const passageId of passageIds) {
    if (total >= targetCount) break;
    const questions = sortByQuestionNumber(byPassage.get(passageId)!).slice(0, targetCount - total);
    selected.push({ passageId, questions });
    total += questions.length;
  }

  return Promise.all(selected.map(({ passageId, questions }) => buildPassageGroup(passageId, questions)));
}

async function fetchDtkDiagramMap(): Promise<Map<string, Question[]>> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('question_type', 'DTK')
    .eq('excluded_incomplete', false);
  if (error) throw error;
  const questions = sanitizeQuestions((data ?? []) as Question[]);

  const byDiagram = new Map<string, Question[]>();
  for (const question of questions) {
    if (!question.diagram_path) continue;
    const group = byDiagram.get(question.diagram_path) ?? [];
    group.push(question);
    byDiagram.set(question.diagram_path, group);
  }
  return byDiagram;
}

// Groups DTK questions by the diagram page they belong to, so the (unmodified,
// full-page) image is shown once, at full size, alongside every question that
// refers to it, rather than repeating a small copy of it per question.
export async function fetchDtkPageGroups(groupCount = 5): Promise<DtkGroup[]> {
  const byDiagram = await fetchDtkDiagramMap();
  const diagramPaths = shuffle([...byDiagram.keys()]).slice(0, groupCount);

  return diagramPaths.map((diagramPath) => ({
    diagramUrl: resolveDiagramUrl(diagramPath),
    questions: sortByQuestionNumber(byDiagram.get(diagramPath)!),
  }));
}

// Same diagram grouping, but selects however many diagrams are needed to
// reach an exact question total (trimming the last diagram's questions if it
// would overshoot) - used for test simulations, see fetchLasPassageGroupsByQuestionCount.
async function fetchDtkPageGroupsByQuestionCount(targetCount: number): Promise<DtkGroup[]> {
  const byDiagram = await fetchDtkDiagramMap();
  const diagramPaths = shuffle([...byDiagram.keys()]);

  const selected: DtkGroup[] = [];
  let total = 0;
  for (const diagramPath of diagramPaths) {
    if (total >= targetCount) break;
    const questions = sortByQuestionNumber(byDiagram.get(diagramPath)!).slice(0, targetCount - total);
    selected.push({ diagramUrl: resolveDiagramUrl(diagramPath), questions });
    total += questions.length;
  }
  return selected;
}

// Every subtest (ORD, LAS, MEK, ELF, XYZ, KVA, NOG, DTK) contributes exactly
// 10 questions, matching the real exam: 4 subtests per section = 40 questions
// for a half test (single section), 8 subtests = 80 for a full test.
const TEST_SUBTEST_QUESTION_COUNT = 10;

async function fetchSectionTestUnits(section: SectionType): Promise<TestUnit[]> {
  const units: TestUnit[] = [];
  for (const type of SECTION_QUESTION_TYPES[section]) {
    if (type === 'LAS') {
      const groups = await fetchLasPassageGroupsByQuestionCount(TEST_SUBTEST_QUESTION_COUNT);
      units.push(...groups.map((group): TestUnit => ({ kind: 'las', questions: group.questions, group })));
    } else if (type === 'DTK') {
      const groups = await fetchDtkPageGroupsByQuestionCount(TEST_SUBTEST_QUESTION_COUNT);
      units.push(...groups.map((group): TestUnit => ({ kind: 'dtk', questions: group.questions, group })));
    } else {
      const questions = await fetchQuestionsByType(type, TEST_SUBTEST_QUESTION_COUNT);
      units.push(...questions.map((question): TestUnit => ({ kind: 'question', questions: [question], question })));
    }
  }
  return units;
}

// Builds the ordered sequence of units (questions plus LAS/DTK groups) for a
// timed test simulation - one section, or verbal followed by kvant for a full
// mock exam.
export async function fetchTestUnits(section: TestSection): Promise<TestUnit[]> {
  if (section === 'full') {
    const [verbal, kvant] = await Promise.all([fetchSectionTestUnits('verbal'), fetchSectionTestUnits('kvant')]);
    return [...verbal, ...kvant];
  }
  return fetchSectionTestUnits(section);
}

export async function fetchGlossary(): Promise<GlossaryEntry[]> {
  const { data, error } = await supabase.from('prefix_suffix').select('*').order('word');
  if (error) throw error;
  return (data ?? []) as GlossaryEntry[];
}

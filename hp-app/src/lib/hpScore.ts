import { Question, SectionType, TestSection } from './types';

const HP_SCALE_MAX = 2;
const HP_SCALE_STEP = 0.05;
const RESULT_STORAGE_KEY = 'hp-pro:last-test-result';

export type HpSubscore = { correct: number; total: number; score: number };

export type HpTestResult = {
  section: TestSection;
  verbal: HpSubscore | null;
  kvant: HpSubscore | null;
  totalScore: number;
  completedAt: string;
};

// The real Högskoleprov scale (0.00-2.00 in steps of 0.05) is equated per test
// sitting against an official norm table that Studera.nu publishes per exam
// date, not as a reusable formula - so this approximates it by linearly
// scaling the share answered correctly onto the same 0.00-2.00 range instead
// of reproducing that exact per-sitting table.
function toHpScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  const raw = (correct / total) * HP_SCALE_MAX;
  return Number((Math.round(raw / HP_SCALE_STEP) * HP_SCALE_STEP).toFixed(2));
}

function subscore(questions: Question[], answers: Record<string, string>, section: SectionType): HpSubscore | null {
  const subset = questions.filter((q) => q.section_type === section);
  if (subset.length === 0) return null;
  const correct = subset.filter((q) => answers[q.id] === q.correct_answer).length;
  return { correct, total: subset.length, score: toHpScore(correct, subset.length) };
}

// A full test scores each half (verbal, kvant) on its own 0.00-2.00 scale,
// same as the real exam, and averages them for the total; a single-section
// test just reports that half's own score as the total.
export function buildHpResult(section: TestSection, questions: Question[], answers: Record<string, string>): HpTestResult {
  const verbal = subscore(questions, answers, 'verbal');
  const kvant = subscore(questions, answers, 'kvant');
  const scores = [verbal?.score, kvant?.score].filter((s): s is number => s !== undefined && s !== null);
  const totalScore = scores.length > 0 ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0;
  return { section, verbal, kvant, totalScore, completedAt: new Date().toISOString() };
}

export function saveTestResult(result: HpTestResult): void {
  localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function loadLatestTestResult(): HpTestResult | null {
  const raw = localStorage.getItem(RESULT_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HpTestResult;
  } catch {
    return null;
  }
}

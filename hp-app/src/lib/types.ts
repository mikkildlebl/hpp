export type SectionType = 'verbal' | 'kvant';

export type QuestionType = 'ORD' | 'LAS' | 'MEK' | 'ELF' | 'XYZ' | 'KVA' | 'NOG' | 'DTK';

export type ParsedOption = {
  label: string;
  text: string;
  image?: string;
};

export type SourceRef = {
  exam: string;
  provpass: number;
  variant: string | null;
};

export type Question = {
  id: string;
  source_exam: string;
  provpass: number;
  variant: string | null;
  section_type: SectionType;
  question_type: QuestionType;
  question_number: number;
  question_text: string;
  options: ParsedOption[];
  options_raw: string[];
  correct_answer: string;
  passage_id: string | null;
  diagram_path: string | null;
  graph_question: boolean;
  nog_statements: [string, string] | null;
  all_sources: SourceRef[];
  needs_review: boolean;
  excluded_incomplete: boolean;
  possibly_truncated: boolean;
};

export type Passage = {
  id: string;
  content: string;
};

export type PassageGroup = {
  title: string;
  paragraphs: string[];
  questions: Question[];
};

export type DtkGroup = {
  diagramUrl: string;
  questions: Question[];
};

export type GlossaryEntry = {
  id: string;
  type: 'prefix' | 'suffix';
  word: string;
  meaning: string;
  examples: string;
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  ORD: 'Ordförståelse',
  LAS: 'Läsförståelse',
  MEK: 'Meningskomplettering',
  ELF: 'Engelska läsförståelse',
  XYZ: 'Matematisk problemlösning',
  KVA: 'Kvantitativa jämförelser',
  NOG: 'Kvantitativa resonemang',
  DTK: 'Diagram, tabeller och kartor',
};

export const SECTION_QUESTION_TYPES: Record<SectionType, QuestionType[]> = {
  verbal: ['ORD', 'LAS', 'MEK', 'ELF'],
  kvant: ['XYZ', 'KVA', 'NOG', 'DTK'],
};

// A test simulation covers one section timed like the real exam (55 min) or
// both back to back for a full mock exam (110 min).
export type TestSection = SectionType | 'full';

export const TEST_DURATIONS_SECONDS: Record<TestSection, number> = {
  verbal: 55 * 60,
  kvant: 55 * 60,
  full: 110 * 60,
};

// LAS and DTK questions come grouped (one passage/diagram, several questions);
// every other type stands alone. A test simulation mixes both shapes in a
// single ordered sequence, so each entry carries its own render hint alongside
// the flat question list useGroupSession needs for scoring.
export type TestUnit =
  | { kind: 'question'; questions: [Question]; question: Question }
  | { kind: 'las'; questions: Question[]; group: PassageGroup }
  | { kind: 'dtk'; questions: Question[]; group: DtkGroup };

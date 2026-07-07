import { supabase } from './supabase';
import { GlossaryEntry, Passage, Question, QuestionType, SECTION_QUESTION_TYPES, SectionType } from './types';

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
  return shuffle((data ?? []) as Question[]).slice(0, count);
}

export async function fetchQuestionsBySection(section: SectionType, count = 10): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('section_type', section)
    .eq('excluded_incomplete', false);
  if (error) throw error;
  return shuffle((data ?? []) as Question[]).slice(0, count);
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

export async function fetchPassage(id: string): Promise<Passage | null> {
  const { data, error } = await supabase.from('passages').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Passage | null;
}

export async function fetchGlossary(): Promise<GlossaryEntry[]> {
  const { data, error } = await supabase.from('prefix_suffix').select('*').order('word');
  if (error) throw error;
  return (data ?? []) as GlossaryEntry[];
}

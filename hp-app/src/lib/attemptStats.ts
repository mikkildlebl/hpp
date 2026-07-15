import { supabase } from './supabase';
import { QuestionType } from './types';

export type QuestionTypeStat = { type: QuestionType; correct: number; total: number };

export async function fetchQuestionTypeStats(): Promise<QuestionTypeStat[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.from('question_attempts').select('is_correct, questions(question_type)').eq('user_id', user.id);
  if (error) throw error;

  const counts: Partial<Record<QuestionType, { correct: number; total: number }>> = {};
  for (const row of data ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped client can't infer embed cardinality (object vs array)
    const joined = row.questions as any;
    const type: QuestionType | undefined = Array.isArray(joined) ? joined[0]?.question_type : joined?.question_type;
    if (!type) continue;
    const bucket = (counts[type] ??= { correct: 0, total: 0 });
    bucket.total += 1;
    if (row.is_correct) bucket.correct += 1;
  }

  return (Object.entries(counts) as [QuestionType, { correct: number; total: number }][]).map(([type, stat]) => ({ type, ...stat }));
}

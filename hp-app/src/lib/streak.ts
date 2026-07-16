import { supabase } from './supabase';

function dateKey(date: Date): string {
  return date.toLocaleDateString('sv-SE');
}

// A day counts toward the streak if the user answered any practice/test
// question (question_attempts, shared by individual practice, LAS/DTK and
// test simulations) or touched the glossary (glossary_progress). Counts
// backward from today; if nothing happened yet today, yesterday still keeps
// the streak alive since today isn't over.
export async function fetchStreak(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const [attempts, glossary] = await Promise.all([
    supabase.from('question_attempts').select('created_at').eq('user_id', user.id),
    supabase.from('glossary_progress').select('updated_at').eq('user_id', user.id),
  ]);
  if (attempts.error) throw attempts.error;
  if (glossary.error) throw glossary.error;

  const activeDays = new Set<string>();
  for (const row of attempts.data ?? []) activeDays.add(dateKey(new Date(row.created_at)));
  for (const row of glossary.data ?? []) activeDays.add(dateKey(new Date(row.updated_at)));

  const cursor = new Date();
  if (!activeDays.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(dateKey(cursor))) return 0;
  }

  let streak = 0;
  while (activeDays.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

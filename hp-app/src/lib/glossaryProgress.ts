import { supabase } from './supabase';

export async function fetchGlossaryProgress(): Promise<Record<string, boolean>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase.from('glossary_progress').select('entry_id, known').eq('user_id', user.id);
  if (error) throw error;

  const progress: Record<string, boolean> = {};
  for (const row of data ?? []) {
    progress[row.entry_id] = row.known;
  }
  return progress;
}

export async function saveGlossaryProgress(entryId: string, known: boolean): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('glossary_progress')
    .upsert({ user_id: user.id, entry_id: entryId, known, updated_at: new Date().toISOString() }, { onConflict: 'user_id,entry_id' });
}

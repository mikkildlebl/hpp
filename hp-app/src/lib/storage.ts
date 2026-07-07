import { supabase } from './supabase';

const DIAGRAM_BUCKET = 'hp-diagrams';

export function resolveDiagramUrl(diagramPath: string): string {
  const { data } = supabase.storage.from(DIAGRAM_BUCKET).getPublicUrl(diagramPath);
  return data.publicUrl;
}

'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchGlossary } from '@/lib/questions';
import { GlossaryEntry } from '@/lib/types';

export default function GlossaryPage() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlossary().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.word.toLowerCase().includes(q) || e.meaning.toLowerCase().includes(q));
  }, [entries, query]);

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-4 p-6">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Sök prefix eller suffix…"
        className="rounded-lg border border-option-border p-4"
      />
      {loading ? (
        <p>Laddar…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <div key={item.id} className="flex flex-col gap-0.5 rounded-lg bg-background-element p-4">
              <p className="text-sm font-bold">
                {item.word} <span className="text-sm font-medium text-text-secondary">({item.type})</span>
              </p>
              <p>{item.meaning}</p>
              <p className="text-sm text-text-secondary">{item.examples}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

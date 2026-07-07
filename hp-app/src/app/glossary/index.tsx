import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchGlossary } from '@/lib/questions';
import { GlossaryEntry } from '@/lib/types';

export default function GlossaryScreen() {
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
    return entries.filter(
      (e) => e.word.toLowerCase().includes(q) || e.meaning.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Sök prefix eller suffix…"
          style={styles.search}
        />
        {loading ? (
          <ThemedText>Laddar…</ThemedText>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.entry}>
                <ThemedText type="smallBold">
                  {item.word} <ThemedText type="small" themeColor="textSecondary">({item.type})</ThemedText>
                </ThemedText>
                <ThemedText>{item.meaning}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.examples}
                </ThemedText>
              </ThemedView>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.four, gap: Spacing.three, maxWidth: 640, alignSelf: 'center', width: '100%' },
  search: {
    borderWidth: 1,
    borderColor: '#D0D3D9',
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  list: { gap: Spacing.two },
  entry: { padding: Spacing.three, borderRadius: Spacing.two, gap: Spacing.half },
});

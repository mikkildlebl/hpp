import { Image } from 'expo-image';
import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { MathText } from '@/components/MathText';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { resolveDiagramUrl } from '@/lib/storage';
import { ParsedOption } from '@/lib/types';

type Props = {
  options: ParsedOption[];
  selected: string | null;
  submitted: boolean;
  correctAnswer: string;
  onSelect: (label: string) => void;
  compact?: boolean;
};

const MIN_IMAGE_HEIGHT = 28;
const MAX_IMAGE_HEIGHT = 160;

// Option crops vary a lot in shape (a one-line formula is very wide/short, a
// graph is closer to square), so size from the image's own aspect ratio
// against the row's actual width rather than a fixed box that either
// shrinks formulas to near-invisibility or crops graphs off.
function OptionImage({ uri }: { uri: string }) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const height = aspectRatio && width ? Math.min(MAX_IMAGE_HEIGHT, Math.max(MIN_IMAGE_HEIGHT, width / aspectRatio)) : MIN_IMAGE_HEIGHT;

  return (
    <View style={styles.optionImageWrap} onLayout={onLayout}>
      <Image
        source={{ uri }}
        style={{ width: '100%', height }}
        contentFit="contain"
        onLoad={(event) => setAspectRatio(event.source.width / event.source.height)}
      />
    </View>
  );
}

export function OptionList({ options, selected, submitted, correctAnswer, onSelect, compact }: Props) {
  return (
    <ThemedView style={styles.list}>
      {options.map((opt) => {
        const isSelected = selected === opt.label;
        const isCorrect = opt.label === correctAnswer;

        let stateStyle;
        if (submitted && isCorrect) stateStyle = styles.correct;
        else if (submitted && isSelected && !isCorrect) stateStyle = styles.incorrect;
        else if (isSelected) stateStyle = styles.selected;

        return (
          <Pressable
            key={opt.label}
            disabled={submitted}
            onPress={() => onSelect(opt.label)}
            style={[styles.option, compact && styles.optionCompact, stateStyle]}>
            <ThemedText type="smallBold" style={styles.label}>
              {opt.label}
            </ThemedText>
            {opt.image ? (
              <OptionImage uri={resolveDiagramUrl(opt.image)} />
            ) : (
              <View style={styles.optionText}>
                <MathText type={compact ? 'small' : 'default'}>{opt.text}</MathText>
              </View>
            )}
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#D0D3D9',
  },
  optionCompact: { padding: Spacing.two, gap: Spacing.one },
  selected: { borderColor: '#3c87f7', backgroundColor: '#EAF2FE' },
  correct: { borderColor: '#2E9E5B', backgroundColor: '#E4F7EC' },
  incorrect: { borderColor: '#D64545', backgroundColor: '#FBEAEA' },
  label: { width: 24 },
  optionText: { flex: 1 },
  optionImageWrap: { flex: 1 },
});

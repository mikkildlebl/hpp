const SOFT_HYPHEN = String.fromCharCode(0x00ad);

// Passages spanning multiple exam-booklet pages have the booklet's running
// header ("Uppgifter", sometimes with the sub-test name after it, e.g.
// "Uppgifter DELPROV – FÖRSTÅELSE") bled into the text at every page break by
// the OCR/extraction step - even splitting a hyphenated word in two. The header
// is always capitalized; real uses of the word ("föräldrars uppgifter") are not,
// so matching only the capitalized form avoids touching genuine prose.
const PAGE_HEADER_PATTERN =
  /\s*\bUppgifter\b(?:\s+(?:DELPROV|LÄS|MEK|ELF|VERBAL|KVANTITATIV)\b)?(?:\s*[–-]\s*[A-ZÅÄÖ]+)?\s*/g;

// A handful of ELF passages have the question stem accidentally duplicated onto
// the front of the passage text (e.g. "What is the main focus in this text? ...").
// Detectable because, unlike the title (never punctuated), it ends in "?".
const LEADING_QUESTION_STEM_PATTERN =
  /^((?:What|How|Why|Which|Where|When|Who|According to|Vad|Hur|Varför|Vilken|Vilket|Vilka|Var|När|Vem|Enligt)\b[^?]{0,180}\?)\s+/i;

function stripArtifacts(text: string): string {
  return text.replace(LEADING_QUESTION_STEM_PATTERN, '').replace(PAGE_HEADER_PATTERN, ' ');
}

// Source passages carry hyphens from justified line-wraps in the original PDFs:
// invisible soft hyphens (U+00AD), and plain "-" hyphens left where a word broke
// across a line (e.g. "förklaring- ar" -> "förklaringar"). A real dash used as
// punctuation is always followed by a capital (new clause/sentence), so requiring
// a lowercase continuation tells a line-wrap break from real punctuation.
function stripHyphenation(text: string): string {
  return text
    .split(SOFT_HYPHEN)
    .join('')
    .replace(/(\p{L})-\s+([a-zåäö])/gu, '$1$2');
}

// The source has no separator between a text's title and its body - both just
// run together (e.g. "Risk för bias En oönskad tendens till..."). Since both the
// title and the sentence that follows start with a capital letter, the shortest
// run of words up to the next "space + capital" is a good guess at the title,
// as long as it's short (a real title, not just the sentence's first clause).
const TITLE_PATTERN = /^([A-ZÅÄÖ][^.!?\n]{2,64}?)\s+(?=[”“»]?[A-ZÅÄÖ])/;
const MAX_TITLE_WORDS = 8;

// No paragraph breaks survive extraction either, so the body reads as one
// unbroken block; splitting it into sentences and grouping a few per paragraph
// makes a long passage actually scannable.
const SENTENCE_PATTERN = /[^.!?]+[.!?»]+[”»]?/g;
const SENTENCES_PER_PARAGRAPH = 3;

export type FormattedPassage = {
  title: string | null;
  paragraphs: string[];
};

// Same OCR/extraction artifacts (hyphen line-breaks, page-header bleed-through)
// show up in question text and answer options too, not just reading passages -
// this is the shared cleanup used everywhere short text is displayed.
export function cleanText(raw: string): string {
  return stripHyphenation(stripArtifacts(raw))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatPassage(raw: string): FormattedPassage {
  const cleaned = cleanText(raw);

  const titleMatch = cleaned.match(TITLE_PATTERN);
  const title =
    titleMatch && titleMatch[1].trim().split(/\s+/).length <= MAX_TITLE_WORDS ? titleMatch[1].trim() : null;
  const body = title ? cleaned.slice(titleMatch![0].length).trim() : cleaned;

  const sentences = body.match(SENTENCE_PATTERN) ?? [body];
  const paragraphs: string[] = [];
  for (let i = 0; i < sentences.length; i += SENTENCES_PER_PARAGRAPH) {
    paragraphs.push(
      sentences
        .slice(i, i + SENTENCES_PER_PARAGRAPH)
        .join(' ')
        .trim()
    );
  }

  return { title, paragraphs: paragraphs.length ? paragraphs : [body] };
}

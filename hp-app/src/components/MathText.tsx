import { Fragment, ReactNode } from 'react';

import { THEME_COLOR_VAR, ThemeColorName } from '@/lib/theme';

// Renders plain-text math notation ("h = 2A/b", "x^(10/7)") as an actual
// superscript exponent and a stacked fraction, instead of showing the raw
// "^" and "/" characters. The source data encodes structure with those two
// characters specifically so this stays a plain string end-to-end (easy to
// store, search, diff) until it reaches the screen.

type MathSeg = { kind: 'text'; text: string } | { kind: 'sup'; children: MathSeg[] } | { kind: 'frac'; num: MathSeg[]; den: MathSeg[] };

function findTopLevel(str: string, ch: string): number {
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ch && depth === 0) return i;
  }
  return -1;
}

function stripOuterParens(s: string): string {
  if (s.length < 2 || s[0] !== '(' || s[s.length - 1] !== ')') return s;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0 && i !== s.length - 1) return s; // closes before the end - not a single wrapping pair
    }
  }
  return s.slice(1, -1);
}

// A numerator/denominator (or exponent) is only trusted as math if it's
// short and made of math-ish characters - guards against a stray "/" inside
// ordinary prose (a date, a URL-like fragment) being mistaken for a fraction.
const MATH_ATOM_RE = /^[\p{L}0-9+\-·.,\s]+$/u;

function isMathAtom(s: string): boolean {
  return s.length > 0 && s.length <= 24 && MATH_ATOM_RE.test(s);
}

function parseFraction(raw: string): MathSeg[] {
  const idx = findTopLevel(raw, '/');
  if (idx > 0 && idx < raw.length - 1) {
    const numRaw = stripOuterParens(raw.slice(0, idx));
    const denRaw = stripOuterParens(raw.slice(idx + 1));
    if (isMathAtom(numRaw) && isMathAtom(denRaw)) {
      return [{ kind: 'frac', num: parseFraction(numRaw), den: parseFraction(denRaw) }];
    }
  }
  return [{ kind: 'text', text: raw }];
}

function parseWord(word: string): MathSeg[] {
  if (!word) return [];
  const caretIdx = findTopLevel(word, '^');
  if (caretIdx === -1) return parseFraction(word);

  const base = word.slice(0, caretIdx);
  const rest = word.slice(caretIdx + 1);
  let expRaw: string;
  let trailing: string;
  if (rest[0] === '(') {
    let depth = 0;
    let end = rest.length;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '(') depth++;
      else if (rest[i] === ')') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    expRaw = rest.slice(1, end);
    trailing = rest.slice(end + 1);
  } else {
    expRaw = rest.slice(0, 1);
    trailing = rest.slice(1);
  }

  const segs: MathSeg[] = [];
  if (base) segs.push({ kind: 'text', text: base });
  segs.push({ kind: 'sup', children: parseFraction(expRaw) });
  segs.push(...parseWord(trailing));
  return segs;
}

function parseMathText(text: string): MathSeg[] {
  const parts = text.split(/(\s+)/);
  const segs: MathSeg[] = [];
  for (const part of parts) {
    if (part === '') continue;
    segs.push(...(/^\s+$/.test(part) ? [{ kind: 'text', text: part } as const] : parseWord(part)));
  }
  return segs;
}

type RowProps = { segs: MathSeg[]; scale: number; color: string; fontSize: number; lineHeight: number; fontWeight: TextStyleWeight };
type TextStyleWeight = 400 | 500 | 600 | 700;

function flatText(segs: MathSeg[]): string {
  return segs.map((s) => (s.kind === 'text' ? s.text : '')).join('');
}

function MathRow({ segs, scale, color, fontSize, lineHeight, fontWeight }: RowProps) {
  const size = fontSize * scale;
  const nodes: ReactNode[] = [];
  let buffer: MathSeg[] = [];

  const flush = (key: string) => {
    if (!buffer.length) return;
    nodes.push(
      <span key={key} style={{ color, fontSize: size, lineHeight: `${lineHeight * scale}px`, fontWeight }}>
        {buffer.map((seg, i) => {
          if (seg.kind === 'text') return <Fragment key={i}>{seg.text}</Fragment>;
          if (seg.kind !== 'sup') return null;
          // a plain-text-only superscript (no nested fraction) can stay inline as nested text
          return (
            <span key={i} className="relative text-[11px]" style={{ top: -size * 0.32 }}>
              {flatText(seg.children)}
            </span>
          );
        })}
      </span>
    );
    buffer = [];
  };

  segs.forEach((seg, i) => {
    if (seg.kind === 'frac') {
      flush(`t${i}`);
      nodes.push(<Fraction key={`f${i}`} seg={seg} scale={scale} color={color} fontSize={fontSize} lineHeight={lineHeight} fontWeight={fontWeight} />);
    } else if (seg.kind === 'sup' && seg.children.some((c) => c.kind === 'frac')) {
      // an exponent that itself contains a fraction (e.g. x^(5/7)) can't be
      // nested text - render it as its own small raised block instead.
      flush(`t${i}`);
      nodes.push(
        <span key={`s${i}`} className="relative inline-flex items-center" style={{ top: -size * 0.32 }}>
          <MathRow segs={seg.children} scale={scale * 0.72} color={color} fontSize={fontSize} lineHeight={lineHeight} fontWeight={fontWeight} />
        </span>
      );
    } else {
      buffer.push(seg);
    }
  });
  flush('tend');

  return <>{nodes}</>;
}

function Fraction({ seg, scale, color, fontSize, lineHeight, fontWeight }: { seg: Extract<MathSeg, { kind: 'frac' }> } & Omit<RowProps, 'segs'>) {
  const nextScale = scale * 0.8;
  return (
    <span className="mx-0.5 inline-flex flex-col items-center">
      <span className="inline-flex items-center">
        <MathRow segs={seg.num} scale={nextScale} color={color} fontSize={fontSize} lineHeight={lineHeight} fontWeight={fontWeight} />
      </span>
      <span className="my-px block h-px w-full" style={{ backgroundColor: color }} />
      <span className="inline-flex items-center">
        <MathRow segs={seg.den} scale={nextScale} color={color} fontSize={fontSize} lineHeight={lineHeight} fontWeight={fontWeight} />
      </span>
    </span>
  );
}

export type MathTextProps = {
  children: string | null | undefined;
  type?: 'default' | 'subtitle' | 'small' | 'smallBold';
  themeColor?: ThemeColorName;
  className?: string;
};

const TYPE_STYLES: Record<NonNullable<MathTextProps['type']>, { fontSize: number; lineHeight: number; fontWeight: TextStyleWeight }> = {
  default: { fontSize: 16, lineHeight: 24, fontWeight: 500 },
  subtitle: { fontSize: 24, lineHeight: 32, fontWeight: 600 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: 500 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: 700 },
};

export function MathText({ children, type = 'default', themeColor, className }: MathTextProps) {
  const color = THEME_COLOR_VAR[themeColor ?? 'text'];
  const text = children ?? '';
  if (!text) return null;

  const { fontSize, lineHeight, fontWeight } = TYPE_STYLES[type];
  const segs = parseMathText(text);

  return (
    <div className={`inline-flex flex-wrap items-center ${className ?? ''}`}>
      <MathRow segs={segs} scale={1} color={color} fontSize={fontSize} lineHeight={lineHeight} fontWeight={fontWeight} />
    </div>
  );
}

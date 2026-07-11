"""Re-extract XYZ (kvantitativa samband) questions from source PDFs.

The existing hp_questions.json XYZ rows were built by a naive linear text
dump of the PDF, which does not survive fraction layouts (numerator/bar/
denominator stacked vertically) or bold-vs-plain distinctions between the
question stem and its context sentence. This script re-derives XYZ rows
from scratch using PyMuPDF span positions + fill-rect fraction bars, and
cross-checks the correct answer against the facit PDFs.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

PDF_DIR = Path(r"C:\Users\Mikael\Desktop\hpsourcepdfs")
ROOT = Path(__file__).resolve().parent.parent
QUESTIONS_FILE = ROOT / "hp_questions.json"

SECTION_HEADERS = {"ORD", "LAS", "MEK", "ELF", "XYZ", "KVA", "NOG", "DTK"}

# The source PDFs render math operators through custom embedded symbol fonts
# with no real ToUnicode mapping - text extraction returns an arbitrary
# placeholder character (the actual glyph shape was identified by rendering
# each one to an image and looking at it). Mapping these to the real Unicode
# symbol is what makes text reconstruction viable instead of just crops.
# Older exams' PDFs embed the same symbol fonts under a slightly different
# name (no "a": "MMNegate" instead of "MMaNegate", etc) - both spellings map
# to the same glyph set, confirmed by rendering samples of each.
SYMBOL_FONT_MAP: dict[str, dict[str, str]] = {
    "MMaBinary": {"$": "·"},
    "MMBinary": {"$": "·"},
    "MMaNegate": {"!": "≠"},
    "MMNegate": {"!": "≠"},
    "MMaRelation": {"#": "≤", "$": "≥"},
    "MMRelation": {"#": "≤", "$": "≥"},
    "MMRelationBold": {"#": "≤", "$": "≥"},
    "MMaGreek": {"r": "π"},
    "MMGreek": {"r": "π"},
    "MMaEtc": {"c": "°", "Z": "◇", "[": "◇"},
    "MMEtc": {"c": "°", "Z": "◇", "[": "◇"},
}
# ---------------------------------------------------------------------------
# span / layout helpers
# ---------------------------------------------------------------------------

def is_bold(font: str) -> bool:
    return "Bold" in font


def map_symbol_font(font: str, text: str) -> str:
    for prefix, table in SYMBOL_FONT_MAP.items():
        if font.startswith(prefix):
            return "".join(table.get(ch, ch) for ch in text)
    return text


def get_spans(page):
    d = page.get_text("dict")
    spans = []
    for block in d["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"]
                if text.strip() == "" and text != " ":
                    continue
                font = span["font"]
                bbox = span["bbox"]
                size = span["size"]
                if font.startswith("MMaVariableA") and (bbox[3] - bbox[1]) > size * 1.8:
                    # MMaVariableA renders ordinary variable letters/digits
                    # correctly, but reuses those same letter codepoints for
                    # pieces of a large, multi-part parenthesis (stacked
                    # top/bottom glyphs stretching a bracket to an arbitrary
                    # height, e.g. wrapping (x^2)^(5/7)) - indistinguishable
                    # from a real letter by character code alone, but its
                    # bbox is 2-3x taller than the font's own size. Drop it;
                    # the "^(...)"/"(...)" synthesized during fraction and
                    # exponent merging supplies the grouping instead.
                    continue
                if font.startswith("MM"):
                    text = map_symbol_font(font, text)
                spans.append(
                    {
                        "text": text,
                        "bbox": bbox,
                        "font": font,
                        "bold": is_bold(font),
                        "italic": "Italic" in font,
                        "size": size,
                    }
                )
    return spans


def get_fraction_bars(page, region=None):
    bars = []
    for dr in page.get_drawings():
        if dr.get("type") != "f":
            continue
        r = dr["rect"]
        w, h = r.width, r.height
        if h > 2.5 or w < 3:
            continue
        if region and not (region[1] - 2 <= r.y0 <= region[3] + 2):
            continue
        bars.append(r)
    return bars


def merge_fractions(spans: list[dict], bars: list, row_anchors: list[float] | None = None) -> list[dict]:
    """Collapse spans that sit in a numerator/denominator stack around a
    fraction-bar rect into one synthetic token 'num/den'. The synthetic
    token's size is the smallest of its parts, so a fraction that's itself
    sitting in an exponent (e.g. x^(5/7)) still reads as "small" to
    merge_exponents.

    row_anchors (sorted y0s of the question label + every option marker)
    bound each bar's numerator/denominator search to its own row: fraction
    rows sit close enough together (~29pt) that a fixed pixel distance from
    the bar alone can't tell "my own numerator" apart from "the next row's
    numerator", which sits only a little further away in the same x-column.
    """
    if not spans or not bars:
        return spans

    remaining = list(spans)
    tokens = []
    used = set()

    for bar in bars:
        bx0, bx1 = bar.x0 - 1.5, bar.x1 + 1.5
        by = (bar.y0 + bar.y1) / 2

        row_lo, row_hi = by - 18, by + 18
        if row_anchors:
            own_row = max((a for a in row_anchors if a <= by + 3), default=None)
            later_rows = [a for a in row_anchors if a > by + 3]
            next_row = min(later_rows, default=None)
            if own_row is not None:
                row_lo = max(row_lo, own_row - 12)
            if next_row is not None:
                row_hi = min(row_hi, next_row - 2)

        num, den = [], []
        for i, s in enumerate(remaining):
            if i in used:
                continue
            sx0, sy0, sx1, sy1 = s["bbox"]
            cx = (sx0 + sx1) / 2
            if not (bx0 <= cx <= bx1):
                continue
            if not (row_lo <= sy0 and sy1 <= row_hi):
                continue
            # Numerator vs denominator by which side of the bar the span's
            # own vertical center falls on - stable regardless of how tall
            # or short a particular glyph's bbox happens to be (a fixed
            # distance-from-bar cutoff can flip on a sub-pixel margin for a
            # span that straddles close to the bar).
            center = (sy0 + sy1) / 2
            if center <= by:
                num.append((i, s))
            else:
                den.append((i, s))
        if not num and not den:
            continue
        num.sort(key=lambda t: t[1]["bbox"][0])
        den.sort(key=lambda t: t[1]["bbox"][0])
        for i, _ in num + den:
            used.add(i)
        num_text = "".join(s["text"] for _, s in num).strip()
        den_text = "".join(s["text"] for _, s in den).strip()
        x0 = min([s["bbox"][0] for _, s in num + den] or [bar.x0])
        x1 = max([s["bbox"][2] for _, s in num + den] or [bar.x1])
        y0 = min([s["bbox"][1] for _, s in num + den] or [bar.y0])
        y1 = max([s["bbox"][3] for _, s in num + den] or [bar.y1])
        min_size = min([s["size"] for _, s in num + den], default=11)
        text = f"({num_text})/({den_text})" if ("+" in num_text or "-" in num_text or " " in num_text.strip()) else f"{num_text}/{den_text}"
        tokens.append(
            {
                "text": text,
                "bbox": (x0, y0, x1, y1),
                "font": "FRACTION",
                "bold": False,
                "italic": False,
                "size": min_size,
                # The bar's own y sits much closer to a "normal line" position
                # than the numerator/denominator extremes do - use it (not
                # bbox y0) whenever something needs to know which row this
                # fraction visually belongs to.
                "anchor_y": by,
            }
        )

    for i, s in enumerate(remaining):
        if i not in used:
            tokens.append(s)
    tokens.sort(key=lambda t: (round(t["bbox"][1] / 3), t["bbox"][0]))
    return tokens


def _cluster_lines(spans: list[dict], tolerance: float = 5) -> list[list[dict]]:
    """Group spans into visual lines. Uses y-RANGE overlap rather than just
    y0 proximity: a merged fraction's bbox spans numerator-to-denominator
    (much taller than one text line), so its y0 alone doesn't line up with
    the baseline text it's inline with - but its range still overlaps that
    baseline's range, which a pure y0 comparison would miss."""
    spans = sorted(spans, key=lambda s: (s["bbox"][1], s["bbox"][0]))
    lines = []
    cur = [spans[0]]
    cur_y0, cur_y1 = spans[0]["bbox"][1], spans[0]["bbox"][3]
    for s in spans[1:]:
        sy0, sy1 = s["bbox"][1], s["bbox"][3]
        overlaps = sy0 <= cur_y1 - tolerance / 2 or abs(sy0 - cur_y0) <= tolerance
        if overlaps:
            cur.append(s)
            cur_y0, cur_y1 = min(cur_y0, sy0), max(cur_y1, sy1)
        else:
            lines.append(cur)
            cur = [s]
            cur_y0, cur_y1 = sy0, sy1
    lines.append(cur)
    return lines


def _join_line(line: list[dict]) -> str:
    line = sorted(line, key=lambda s: s["bbox"][0])
    parts = []
    prev_end = None
    for s in line:
        t = s["text"]
        if prev_end is not None and s["bbox"][0] - prev_end > 1.5 and not t.startswith(" ") and parts and not parts[-1].endswith(" "):
            parts.append(" ")
        parts.append(t)
        prev_end = s["bbox"][2]
    return "".join(parts)


def merge_exponents(tokens: list[dict]) -> list[dict]:
    """Attach small, raised tokens (superscript exponents - including a
    small merged fraction, for x^(5/7)-style nesting) to the token they sit
    on top of. Non-superscript small tokens (rare) are left alone."""
    if len(tokens) < 2:
        return tokens
    sizes = [t["size"] for t in tokens if t["text"].strip()]
    if not sizes:
        return tokens
    body_size = max(sizes)  # exponents are always smaller than the body text
    tokens = sorted(tokens, key=lambda t: t["bbox"][0])

    result = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        is_small = tok["size"] < body_size * 0.85
        # A small bbox alone isn't enough - a multiplication dot or similar
        # symbol can have a naturally compact bbox while still sitting
        # vertically centered on the baseline (comparing bottom edges alone
        # falsely flags it "raised" just because it's short). Compare
        # vertical centers instead: a true superscript's center sits
        # noticeably higher than the token it's attached to.
        if result:
            tok_c = (tok["bbox"][1] + tok["bbox"][3]) / 2
            base_c = (result[-1]["bbox"][1] + result[-1]["bbox"][3]) / 2
            is_raised = tok_c < base_c - 2
        else:
            is_raised = False
        if not (is_small and is_raised) or not result:
            result.append(tok)
            i += 1
            continue
        base = result[-1]
        # gather this and any immediately-following small tokens as one
        # exponent group (they may be at slightly different y - e.g. a
        # base's own "2" plus a nested fraction group next to it)
        group = [tok]
        j = i + 1
        while j < len(tokens) and tokens[j]["size"] < body_size * 0.85 and tokens[j]["bbox"][1] < base["bbox"][3]:
            group.append(tokens[j])
            j += 1
        # A merged fraction token is always a complete unit on its own; two
        # of those (or a plain digit next to one) sitting in the same
        # exponent group means two stacked exponent levels on the same base
        # (e.g. (x^2)^(5/7)) - join those with a multiplication dot so it
        # reads as the mathematically equivalent combined exponent
        # x^(2·5/7), rather than silently concatenating into "25/7". Plain
        # same-size character pieces of one run (e.g. "1","2" of "12") still
        # just concatenate, same as normal text.
        group = sorted(group, key=lambda t: t["bbox"][0])
        exp_text = ""
        prev = None
        for g in group:
            if prev is not None:
                is_frac_boundary = prev.get("font") == "FRACTION" or g.get("font") == "FRACTION"
                gap = g["bbox"][0] - prev["bbox"][2]
                if is_frac_boundary or gap > 2:
                    exp_text += "·"
            exp_text += g["text"]
            prev = g
        exp_text = exp_text.strip()
        if len(exp_text) == 1 and exp_text.isdigit():
            base["text"] = base["text"] + f"^{exp_text}"
        else:
            base["text"] = base["text"] + f"^({exp_text})"
        base["bbox"] = (base["bbox"][0], base["bbox"][1], max(base["bbox"][2], group[-1]["bbox"][2]), base["bbox"][3])
        i = j
    return result


def reconstruct_text(spans: list[dict], page) -> str:
    """Full reading-order reconstruction: merge fraction bars, merge
    exponents, then join into lines in visual order. Symbol-font mapping
    already happened in get_spans."""
    if not spans:
        return ""
    # Only consider bars close to this span set's own vertical extent - a
    # far-away bar (e.g. from the next option row) can otherwise "vacuum up"
    # every span above it in the same x-column as its numerator, since
    # merge_fractions has no other distance limit.
    y0 = min(s["bbox"][1] for s in spans) - 2
    y1 = max(s["bbox"][3] for s in spans) + 2
    bars = [b for b in get_fraction_bars(page) if y0 <= b.y0 <= y1]
    tokens = merge_fractions(spans, bars)
    tokens = merge_exponents(tokens)
    if not tokens:
        return ""
    lines = _cluster_lines(tokens)
    out_lines = [_join_line(l) for l in lines]
    return " ".join(l.strip() for l in out_lines if l.strip())


NUM_LABEL_RE = re.compile(r"^(\d{1,2})\.\s*$|^(\d{1,2})\.")
OPTION_LETTERS = "ABCD"


SECTION_HEADER_RE = re.compile(r"\b(ORD|LAS|MEK|ELF|XYZ|KVA|NOG|DTK)\b")


def page_header(page) -> str | None:
    hdr = None
    best_y = None
    for s in get_spans(page):
        if not s["bold"]:
            continue
        m = SECTION_HEADER_RE.search(s["text"].strip().upper())
        if m and (best_y is None or s["bbox"][1] < best_y):
            hdr = m.group(1)
            best_y = s["bbox"][1]
    return hdr


def find_question_labels(spans: list[dict]) -> list[tuple[int, float]]:
    """Bold '<n>.' labels in the left margin -> [(number, y0), ...] sorted by y."""
    labels = []
    for s in spans:
        t = s["text"].strip()
        if s["bold"] and s["bbox"][0] < 115:
            m = re.match(r"(\d{1,2})\.(?:\s|$)", t)
            if m:
                labels.append((int(m.group(1)), s["bbox"][1]))
    labels.sort(key=lambda x: x[1])
    return labels


def find_option_markers(spans: list[dict], y0: float, y1: float) -> list[tuple[str, float]]:
    """Spans that are exactly a bare option letter (A/B/C/D, possibly with a
    trailing tab/space already stripped) inside [y0, y1), in expected order."""
    candidates = []
    for s in spans:
        if not (y0 <= s["bbox"][1] < y1):
            continue
        t = s["text"].strip()
        m = re.match(r"^([A-D])(?:\s|$)", t)
        if m and s["bbox"][0] < 130:
            candidates.append((m.group(1), s["bbox"][1], s["bbox"][0]))
    candidates.sort(key=lambda x: x[1])
    markers = []
    expected_idx = 0
    for letter, y, x in candidates:
        if expected_idx < len(OPTION_LETTERS) and letter == OPTION_LETTERS[expected_idx]:
            markers.append((letter, y))
            expected_idx += 1
    return markers


CROP_X0 = 55
CROP_PAD = 1


def crop_region(page, x0, y0, x1, y1, zoom=3.0):
    page_w = page.rect.width
    r = fitz.Rect(max(0, x0), max(0, y0 - CROP_PAD), min(page_w, x1), min(page.rect.height, y1 + CROP_PAD))
    pix = page.get_pixmap(clip=r, matrix=fitz.Matrix(zoom, zoom))
    return pix.tobytes("png")


FOOTER_TEXT_RE = re.compile(r"^\s*[–—-]\s*\d{1,3}\s*[–—-]\s*$|forts[aä]tt p[aå] n[aä]sta sida", re.IGNORECASE)
DECIMAL_COMMA_RE = re.compile(r"(\d) (\d),")
DECIMAL_COMMA_PREFIX_RE = re.compile(r",(\d) (\d)")
# A handful of rare layouts (multi-level fraction nesting, unusual spacing)
# still slip past fraction/exponent merging with a telltale empty numerator
# or denominator ("/7", "6/", "()x/", "//"). Rather than ship visibly broken
# text for the ~1% of questions this happens to, fall back to a cropped
# image for that specific field.
MALFORMED_TEXT_RE = re.compile(r"/\s|^\s*/|//|\(\)/|/\(\)|/$")
# A detached exponent - the digit that should have merged into "base^exp"
# instead sitting on its own after a word/unit ("10 2" instead of "10^2",
# "liter 6" instead of "10^6 liter") - is the next most common residual
# failure. Two runs of digits separated only by whitespace, or a bare
# trailing digit/short run right after the sentence's own "?", are both
# telltale signs of that (a legitimate sentence doesn't end in a stray
# number, and a legitimate option is never just two separate number groups).
TRAILING_STRAY_RE = re.compile(r"\?[,.]?\s+[\d+=\-]+\s*$")
# Excludes a 3-digit trailing group: Swedish numbers use a space as the
# thousands separator ("1 200", "97 200"), which would otherwise look
# identical to a detached 1-2 digit exponent.
DETACHED_NUMBER_RE = re.compile(r"(?<![\d.,/^(])\d+\s+\d{1,2}\s*$")
STRAY_OPERATOR_RE = re.compile(r"[=+\-]\s*$")


def looks_malformed(text: str) -> bool:
    if not text:
        return False
    if MALFORMED_TEXT_RE.search(text):
        return True
    if TRAILING_STRAY_RE.search(text):
        return True
    if DETACHED_NUMBER_RE.search(text):
        return True
    if STRAY_OPERATOR_RE.search(text):
        return True
    return False


def extract_question_block(spans: list[dict], page, y0: float, y1: float, footer_y: float) -> dict:
    """spans already filtered to [y0, y1). Returns crop boxes, not text."""
    has_next_question = y1 < footer_y
    y1 = min(y1, footer_y)
    # A small headroom above y0: the stem's own first line can carry an
    # inline fraction (e.g. "A = bh/2") whose numerator rises ~10-14pt above
    # the question-number label itself, which would otherwise fall outside
    # [y0, y1) and get silently dropped. Symmetrically, trim a few pt off
    # the far end when y1 is a genuine next-question label (not just the
    # page footer): that next question's own first line can just as easily
    # rise a couple pt above its own label, which would otherwise bleed into
    # this question's last option instead.
    end_trim = 8 if has_next_question else 0
    block_spans = [
        s
        for s in spans
        if y0 - 12 <= s["bbox"][1] < y1 - end_trim and not FOOTER_TEXT_RE.match(s["text"].strip())
    ]
    markers = find_option_markers(block_spans, y0, y1)

    page_w = page.rect.width
    content_x1 = page_w - 45

    all_drawing_rects = [dr["rect"] for dr in page.get_drawings() if dr["rect"].width > 0 and dr["rect"].height > 0]
    fraction_bars = get_fraction_bars(page)

    def content_ceiling(prev_y: float, next_y: float) -> float:
        """Upper bound for the search window ending before `next_y`. A plain
        option can butt right up against the next marker; a fraction option
        needs headroom above its own bar for the numerator, so only pull the
        boundary up when a bar (and the numerator sitting on it) is actually
        there."""
        candidates = [b for b in fraction_bars if prev_y < b.y0 < next_y and (next_y - b.y0) < (b.y0 - prev_y)]
        if not candidates:
            return next_y - 1
        nearest_bar = min(candidates, key=lambda b: next_y - b.y0)
        numerator_top = min(
            (s["bbox"][1] for s in block_spans if prev_y < s["bbox"][1] < nearest_bar.y0 and s["bbox"][3] <= nearest_bar.y1 + 1),
            default=nearest_bar.y0 - 12,
        )
        return min(numerator_top - 1, next_y - 1)

    def tighten(box, fallback_anchor=None):
        bx0, by0, bx1, by1 = box
        min_x0 = None
        max_x1 = None
        max_y1 = None
        for s in block_spans:
            sx0, sy0, sx1, sy1 = s["bbox"]
            if by0 - 1 <= sy0 < by1 and sx0 < bx1:
                min_x0 = sx0 if min_x0 is None else min(min_x0, sx0)
                max_x1 = sx1 if max_x1 is None else max(max_x1, sx1)
                max_y1 = sy1 if max_y1 is None else max(max_y1, sy1)
        for r in all_drawing_rects:
            if by0 - 1 <= r.y0 < by1 and r.x0 < bx1 and r.y1 <= by1 + 60:
                min_x0 = r.x0 if min_x0 is None else min(min_x0, r.x0)
                max_x1 = r.x1 if max_x1 is None else max(max_x1, r.x1)
                max_y1 = r.y1 if max_y1 is None else max(max_y1, r.y1)
        if max_y1 is None:
            if fallback_anchor is None:
                return box
            fx, fy = fallback_anchor
            return (fx - 5, fy - 5, min(bx1, fx + 150), min(by1, fy + 22))
        return (max(bx0, min_x0 - 5), by0, min(bx1, max_x1 + 15), min(by1, max_y1 + 4))

    if markers:
        stem_spans = [s for s in block_spans if s["bbox"][1] < markers[0][1]]
        stem_last_line_y0 = max((s["bbox"][1] for s in stem_spans), default=y0)
        stem_end = content_ceiling(stem_last_line_y0, markers[0][1])
    else:
        stem_end = y1

    stem_box = tighten((CROP_X0, y0, content_x1, stem_end), fallback_anchor=(85, y0))

    # Chain each option's top edge to the previous one's actual tightened
    # bottom edge (not the marker-y midpoint) - packed single-line options
    # can sit close enough together that the midpoint cuts through the
    # previous row's descenders, bleeding a sliver of it into the next crop.
    prev_bottom = stem_box[3]

    options = []
    for i, (letter, my) in enumerate(markers):
        region_y0 = prev_bottom
        region_y1 = content_ceiling(my, markers[i + 1][1]) if i + 1 < len(markers) else min(y1, my + 210)
        marker_x = next((s["bbox"][0] for s in block_spans if abs(s["bbox"][1] - my) < 0.5 and s["text"].strip().startswith(letter)), CROP_X0)
        box = tighten((CROP_X0, region_y0, content_x1, region_y1), fallback_anchor=(marker_x, my))
        prev_bottom = box[3]
        # Guard against a runaway crop (e.g. the last option on a page
        # picking up unrelated content below it): an XYZ option is never
        # taller than a small coordinate-plane graph in practice.
        bx0, by0, bx1, by1 = box
        if by1 - by0 > 200:
            by1 = by0 + 200
        if bx1 - bx0 > 420:
            bx1 = bx0 + 420
        options.append({"label": letter, "box": (bx0, by0, bx1, by1)})

    # --- text path -----------------------------------------------------
    # Fraction bars get merged ONCE, globally, before anything is split by
    # region: a fraction's numerator commonly rises 5-10pt above its own
    # option marker, so if fraction-merging (or span assignment) ran
    # per-region using approximate boundaries, a tall fraction can straddle
    # two regions and get corrupted or duplicated. Merging first and then
    # assigning the resulting tokens (anchored at the bar's own y) to a zone
    # sidesteps that ambiguity entirely.
    #
    # Zone ranges reuse the stem/option boxes already tightened above for
    # image-cropping, rather than a fresh marker-midpoint split: those boxes
    # already account for things a naive midpoint doesn't - most importantly
    # a stem containing a real diagram (a graph, a table), which can push
    # the stem's actual trailing text (e.g. the formula below the diagram)
    # well past the midpoint between the label and option A's marker.
    zone_ranges = [("__stem__", stem_box[1], stem_box[3])] + [
        (o["label"], o["box"][1], o["box"][3]) for o in options
    ]

    def zone_of(tok: dict) -> str | None:
        # Zones chain with zero gap between them, so a token needs a small
        # position tolerance to still land in its own zone when it rises a
        # few pt above that zone's tightened top edge (a fraction/exponent
        # commonly does). But checking tolerant ranges in a fixed zone order
        # means an earlier zone's tolerance can "shadow" a token that
        # actually belongs, with no tolerance needed, inside a later zone's
        # own un-padded range. Try the exact (untolerant) match across every
        # zone first; only fall back to tolerance if nothing claims it
        # outright.
        anchor_y = tok.get("anchor_y", tok["bbox"][1])
        for name, lo, hi in zone_ranges:
            if lo <= anchor_y < hi:
                return name
        for name, lo, hi in zone_ranges:
            if lo - 3 <= anchor_y < hi + 3:
                return name
        if not zone_ranges:
            return None
        nearest = min(zone_ranges, key=lambda z: min(abs(anchor_y - z[1]), abs(anchor_y - z[2])))
        distance = min(abs(anchor_y - nearest[1]), abs(anchor_y - nearest[2]))
        # A token this far from every zone isn't a stray gap - it's
        # something with nowhere to go (e.g. the next question's own first
        # line bled into this block's span slice). Drop it rather than
        # force-assign it to whichever zone happens to be least-far-away.
        return nearest[0] if distance < 20 else None

    all_bars = get_fraction_bars(page)
    row_anchors = [y0] + [my for _, my in markers]
    merged = merge_fractions(block_spans, all_bars, row_anchors)

    zones: dict[str, list[dict]] = {name: [] for name, _, _ in zone_ranges}
    for tok in merged:
        zone = zone_of(tok)
        if zone is not None:
            zones[zone].append(tok)

    def zone_text(tokens: list[dict], strip_prefix_re=None) -> str:
        if strip_prefix_re and tokens:
            # Find the label/marker token by its text (not by sort position -
            # a fraction with a tall, rising numerator can have a smaller
            # bbox y0 than the label it visually follows).
            label_i = next((i for i, t in enumerate(tokens) if strip_prefix_re.match(t["text"])), None)
            if label_i is not None:
                label = tokens[label_i]
                stripped = strip_prefix_re.sub("", label["text"], count=1)
                tokens = tokens[:label_i] + tokens[label_i + 1 :]
                if stripped:
                    tokens.append({**label, "text": stripped})
        tokens = merge_exponents(tokens)
        if not tokens:
            return ""
        lines = _cluster_lines(tokens)
        text = " ".join(_join_line(l).strip() for l in lines if _join_line(l).strip())
        # A decimal comma sometimes has a mismatched logical/visual order in
        # the source PDF - either drawn as its own overlay glyph appended
        # after a digit run with a blank space reserved for it ("4 7" + ","
        # -> "4 7,"), or placed first in the same span's text despite
        # rendering visually between the digits (",4 7"). Either way, move
        # it back where it visually belongs.
        text = DECIMAL_COMMA_RE.sub(r"\1,\2", text)
        text = DECIMAL_COMMA_PREFIX_RE.sub(r"\1,\2", text)
        return text

    stem_text = zone_text(zones["__stem__"], strip_prefix_re=re.compile(r"^\d{1,2}\.\s*")).strip()
    sbx0, sby0, sbx1, sby1 = stem_box
    # A fraction bar is a hairline (<2.5pt tall); anything noticeably bigger
    # inside the stem is a real figure (coordinate grid, table, ...) that
    # has to stay a diagram - text can't carry that.
    stem_has_diagram = any(
        sby0 - 1 <= r.y0 < sby1 and r.x0 < sbx1 and (r.height > 3 or r.width > 20) for r in all_drawing_rects
    )

    for o in options:
        letter_re = re.compile(rf"^{o['label']}[\s\t]*")
        o["text"] = zone_text(zones[o["label"]], strip_prefix_re=letter_re).strip()
        # No text found in an option's own region despite it having visual
        # content (a fraction bar or a graph) means graphs/diagrams with no
        # extractable text - e.g. a "pick the matching line graph" option -
        # so keep it as an image instead of shipping an empty answer choice.
        bx0, by0, bx1, by1 = o["box"]
        has_drawing = any(by0 - 1 <= r.y0 < by1 and r.x0 < bx1 for r in all_drawing_rects)
        o["is_graph"] = not o["text"] and has_drawing

    return {
        "stem_box": stem_box,
        "stem_text": stem_text.strip(),
        "stem_has_diagram": stem_has_diagram,
        "options": options,
        "graph_question": len(markers) == 0,
    }


def extract_xyz_from_pdf(path: Path) -> list[dict]:
    doc = fitz.open(str(path))
    results = []

    page_data = []
    for i in range(doc.page_count):
        page = doc[i]
        hdr = page_header(page)
        spans = get_spans(page)
        page_data.append((page, hdr, spans))

    for i, (page, hdr, spans) in enumerate(page_data):
        if hdr != "XYZ":
            continue
        labels = find_question_labels(spans)
        if not labels:
            continue
        footer_y = page.rect.height - 60
        for j, (num, y) in enumerate(labels):
            y_start = y
            y_end = labels[j + 1][1] if j + 1 < len(labels) else 10_000
            block = extract_question_block(spans, page, y_start, y_end, footer_y)
            block["question_number"] = num
            block["page"] = i
            block["page_obj"] = page
            results.append(block)
    return results


FACIT_PROVPASS_RE = re.compile(r"Provpass\s+(\d)\D*?(?:ingår ej)?", re.S)
PP_HEADER_RE = re.compile(r"^Provpass\s+(\d)\b")


def _tokens_to_answers(tokens: list[str]) -> dict[int, str]:
    """Pairs up number/letter tokens as answer-key entries. Handles both the
    normal interleaved '1 A 2 B 3 C ...' layout and a layout where a whole
    run of numbers is printed first, followed by the matching run of
    letters (an extraction-order quirk seen in some facit PDFs)."""
    answers: dict[int, str] = {}
    expected = 1
    i2 = 0
    n = len(tokens)
    is_letter = lambda t: bool(re.fullmatch(r"[A-E]", t))
    while i2 < n:
        if tokens[i2] != str(expected):
            i2 += 1
            continue
        if i2 + 1 < n and is_letter(tokens[i2 + 1]):
            answers[expected] = tokens[i2 + 1]
            expected += 1
            i2 += 2
            continue
        # try a run of sequential numbers followed by an equal-length run of letters
        j = i2
        run = []
        val = expected
        while j < n and tokens[j] == str(val):
            run.append(val)
            j += 1
            val += 1
        if run and j + len(run) <= n and all(is_letter(tokens[j + k]) for k in range(len(run))):
            for k, num in enumerate(run):
                answers[num] = tokens[j + k]
            expected += len(run)
            i2 = j + len(run)
            continue
        i2 += 1
    return answers


def _parse_facit_sequential(doc) -> dict[int, dict[int, str]]:
    text = "\n".join(doc[i].get_text() for i in range(doc.page_count))
    markers = list(FACIT_PROVPASS_RE.finditer(text))
    result: dict[int, dict[int, str]] = {}
    for i, m in enumerate(markers):
        pp = int(m.group(1))
        start = m.end()
        end = markers[i + 1].start() if i + 1 < len(markers) else len(text)
        section = text[start:end]
        if "ingår ej" in text[m.start() : m.end() + 20]:
            continue
        tokens = re.findall(r"\d{1,2}|[A-E]", section)
        result.setdefault(pp, {}).update(_tokens_to_answers(tokens))
    return result


def _parse_facit_grid(doc) -> dict[int, dict[int, str]] | None:
    """Some facit PDFs lay out all provpasses as side-by-side columns on one
    page instead of sequential blocks. Detect that by 2+ 'Provpass N'
    headers sharing a y-position on the same page, then read each column
    via a clipped rect."""
    for page in doc:
        headers = []
        for s in get_spans(page):
            m = PP_HEADER_RE.match(s["text"].strip())
            if m:
                headers.append((int(m.group(1)), s["bbox"][0], s["bbox"][1], s["bbox"][3]))
        if len(headers) < 2:
            continue
        headers.sort(key=lambda h: h[2])
        # group by near-identical y0
        groups: list[list[tuple]] = []
        for h in headers:
            if groups and abs(h[2] - groups[-1][0][2]) < 5:
                groups[-1].append(h)
            else:
                groups.append([h])
        grid_group = next((g for g in groups if len(g) >= 2), None)
        if not grid_group:
            continue

        grid_group.sort(key=lambda h: h[1])
        xs = [h[1] for h in grid_group]
        page_w = page.rect.width
        bounds = [0.0] + [(xs[i] + xs[i + 1]) / 2 for i in range(len(xs) - 1)] + [page_w]
        y_top = max(h[3] for h in grid_group) + 2
        y_bottom = page.rect.height - 15

        result: dict[int, dict[int, str]] = {}
        for i, h in enumerate(grid_group):
            pp = h[0]
            rect = fitz.Rect(bounds[i], y_top, bounds[i + 1], y_bottom)
            col_text = page.get_text("text", clip=rect)
            tokens = re.findall(r"\d{1,2}|[A-E]", col_text)
            result.setdefault(pp, {}).update(_tokens_to_answers(tokens))
        return result
    return None


def parse_facit(path: Path) -> dict[int, dict[int, str]]:
    doc = fitz.open(str(path))
    grid = _parse_facit_grid(doc)
    if grid and any(len(v) >= 30 for v in grid.values()):
        return grid
    return _parse_facit_sequential(doc)


# ---------------------------------------------------------------------------
# driver
# ---------------------------------------------------------------------------

KVANT_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})_provpass-(\d)-kvant(?:-(v[12]))?\.pdf$")


def find_exams() -> list[str]:
    exams = set()
    for f in PDF_DIR.glob("*_facit*.pdf"):
        m = re.match(r"^(\d{4}-\d{2}-\d{2})_facit", f.name)
        if m:
            exams.add(m.group(1))
    return sorted(exams)


def find_kvant_files(exam: str) -> list[tuple[int, str | None, Path]]:
    """-> [(provpass_num, variant_or_None, path), ...]"""
    out = []
    for f in PDF_DIR.glob(f"{exam}_provpass-*-kvant*.pdf"):
        m = KVANT_RE.match(f.name)
        if not m:
            continue
        out.append((int(m.group(2)), m.group(3), f))
    return out


def find_facit_files(exam: str) -> dict[str | None, Path]:
    out = {}
    v1 = PDF_DIR / f"{exam}_facit-v1.pdf"
    v2 = PDF_DIR / f"{exam}_facit-v2.pdf"
    single = PDF_DIR / f"{exam}_facit.pdf"
    if v1.exists() and v2.exists():
        out["v1"] = v1
        out["v2"] = v2
    elif single.exists():
        out[None] = single
    return out


def process_exam(exam: str, img_dir: Path, log: list[str]) -> list[dict]:
    kvant_files = find_kvant_files(exam)
    facit_files = find_facit_files(exam)
    facit_cache: dict[Path, dict[int, dict[int, str]]] = {}

    def facit_for(variant: str | None) -> dict[int, dict[int, str]]:
        if variant in facit_files:
            path = facit_files[variant]
        elif None in facit_files:
            path = facit_files[None]
        elif "v1" in facit_files:
            path = facit_files["v1"]
        else:
            return {}
        if path not in facit_cache:
            facit_cache[path] = parse_facit(path)
        return facit_cache[path]

    rows = []
    for provpass, variant, pdf_path in sorted(kvant_files):
        facit = facit_for(variant)
        pp_answers = facit.get(provpass, {})
        if not pp_answers:
            log.append(f"! {exam} pp{provpass} {variant}: no facit answers found")
            continue

        questions = extract_xyz_from_pdf(pdf_path)
        for q in questions:
            qnum = q["question_number"]
            correct = pp_answers.get(qnum)
            if not correct:
                log.append(f"! {exam} pp{provpass} {variant} q{qnum}: no facit answer")
                continue

            page = q["page_obj"]
            suffix = f"_{variant}" if variant else ""
            base = f"{exam}_pp{provpass}{suffix}_xyz_q{qnum}"

            stem_text = q["stem_text"]
            diagram_path = None
            if q["stem_has_diagram"] or not stem_text or looks_malformed(stem_text):
                if looks_malformed(stem_text):
                    log.append(f"! {exam} pp{provpass} {variant} q{qnum}: malformed stem text, using image")
                stem_name = f"{base}_stem.png"
                (img_dir / stem_name).write_bytes(crop_region(page, *q["stem_box"]))
                diagram_path = f"diagrams/{stem_name}"
                stem_text = "" if looks_malformed(stem_text) else stem_text

            options = []
            any_graph = False
            for o in q["options"]:
                malformed = looks_malformed(o["text"])
                if malformed:
                    log.append(f"! {exam} pp{provpass} {variant} q{qnum}{o['label']}: malformed option text, using image")
                if o["is_graph"] or not o["text"] or malformed:
                    any_graph = True
                    opt_name = f"{base}_opt{o['label']}.png"
                    (img_dir / opt_name).write_bytes(crop_region(page, *o["box"]))
                    options.append({"label": o["label"], "text": "", "image": f"diagrams/{opt_name}"})
                else:
                    options.append({"label": o["label"], "text": o["text"]})

            rows.append(
                {
                    "source_exam": exam,
                    "provpass": provpass,
                    "variant": variant,
                    "section_type": "kvant",
                    "question_type": "XYZ",
                    "question_number": qnum,
                    "question_text": stem_text,
                    "diagram_path": diagram_path,
                    "options": options,
                    "correct_answer": correct,
                    "graph_question": any_graph,
                }
            )
    return rows


def main():
    img_dir = ROOT / "images"
    img_dir.mkdir(parents=True, exist_ok=True)
    exams = find_exams()
    log: list[str] = []
    all_rows = []
    for exam in exams:
        rows = process_exam(exam, img_dir, log)
        print(f"{exam}: {len(rows)} XYZ questions")
        all_rows.extend(rows)

    out_path = ROOT / "scripts" / "xyz_extracted.json"
    out_path.write_text(json.dumps(all_rows, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\nTotal: {len(all_rows)} rows -> {out_path}")
    if log:
        print(f"\n{len(log)} warnings:")
        for l in log:
            print(" ", l)


if __name__ == "__main__":
    main()

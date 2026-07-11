"""One-time batch import of the HP question bank into Supabase.

Reads hp_questions.json, prefix_suffix.json, texts/*.txt and images/*.png
from the repo root and upserts them into the passages/questions/prefix_suffix
tables (see supabase/schema.sql) plus the hp-diagrams storage bucket.

Safe to re-run: every step upserts on a stable natural key (id / filename
stem), so fixing a bug here and re-running just overwrites prior rows.

Usage:
    pip install -r scripts/requirements.txt
    cp scripts/.env.import.example scripts/.env.import   # then fill in real values
    python scripts/import_data.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from dotenv import dotenv_values
from supabase import Client, create_client

ROOT = Path(__file__).resolve().parent.parent
QUESTIONS_FILE = ROOT / "hp_questions.json"
GLOSSARY_FILE = ROOT / "prefix_suffix.json"
TEXTS_DIR = ROOT / "texts"
IMAGES_DIR = ROOT / "images"
DIAGRAM_BUCKET = "hp-diagrams"
BATCH_SIZE = 500

EXPECTED_LABELS = {
    "ORD": "ABCDE",
    "NOG": "ABCDE",
    "LAS": "ABCD",
    "MEK": "ABCD",
    "ELF": "ABCD",
    "XYZ": "ABCD",
    "KVA": "ABCD",
    "DTK": "ABCD",
}

# Tail junk that bleeds in from an adjacent page during OCR/scraping, e.g.
# "D) informationen ar otillrackligt 14. Kvantitet I: x ..." or a
# "continue on next page" footer. Truncate option text at the first match.
TAIL_JUNK_PATTERNS = [
    re.compile(r"\s\d{1,3}\.\s.*$", re.S),
    re.compile(r"(?i)forts[aä]tt p[aå] n[aä]sta sida.*$", re.S),
]

LABELED_OPTION_RE = re.compile(r"(?<![A-Za-z0-9])([A-E])\)\s*")
BARE_LABEL_OPTION_RE = re.compile(r"^([A-E])\s+(.*)$")


def load_env() -> dict:
    env_path = ROOT / "scripts" / ".env.import"
    if not env_path.exists():
        raise SystemExit(
            f"Missing {env_path}. Copy scripts/.env.import.example to scripts/.env.import "
            "and fill in your Supabase project URL + service_role key."
        )
    values = dotenv_values(env_path)
    if not values.get("SUPABASE_URL") or not values.get("SUPABASE_SERVICE_ROLE_KEY"):
        raise SystemExit("scripts/.env.import must set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
    return values


TRAILING_SEPARATOR_RE = re.compile(r"\s*\|\s*$")


def clean_tail_junk(text: str) -> str:
    for pattern in TAIL_JUNK_PATTERNS:
        match = pattern.search(text)
        if match and match.start() > 8:
            text = text[: match.start()]
    text = TRAILING_SEPARATOR_RE.sub("", text)
    return text.strip()


def parse_options(question_type: str, raw_options: list[str]) -> tuple[list[dict], bool]:
    """Returns (parsed [{label, text}], needs_review)."""
    if not raw_options:
        return [], False

    expected = EXPECTED_LABELS.get(question_type, "ABCD")

    if question_type == "ELF":
        parsed = []
        for opt in raw_options:
            m = BARE_LABEL_OPTION_RE.match(opt.strip())
            if m:
                parsed.append({"label": m.group(1), "text": clean_tail_junk(m.group(2))})
        seen = "".join(p["label"] for p in parsed)
        needs_review = len(raw_options) != len(expected) or seen != expected[: len(seen)]
        return parsed, needs_review

    joined = " | ".join(raw_options)
    matches = list(LABELED_OPTION_RE.finditer(joined))
    parsed_by_label: dict[str, str] = {}
    for i, m in enumerate(matches):
        label = m.group(1)
        if label in parsed_by_label:
            continue  # keep only the first occurrence of each label
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(joined)
        parsed_by_label[label] = clean_tail_junk(joined[start:end])

    parsed = [{"label": lbl, "text": parsed_by_label[lbl]} for lbl in expected if lbl in parsed_by_label]
    needs_review = len(raw_options) != len(expected) or set(parsed_by_label) != set(expected)
    return parsed, needs_review


def looks_truncated(options: list[dict]) -> bool:
    for opt in options:
        text = opt["text"].strip()
        if len(text) > 3 and not re.search(r"[.!?%\d]$", text):
            return True
    return False


def import_glossary(client: Client) -> int:
    data = json.loads(GLOSSARY_FILE.read_text(encoding="utf-8"))
    rows = [
        {
            "id": e["id"],
            "type": e["type"],
            "word": e["word"],
            "meaning": e["meaning"],
            "examples": e["examples"],
        }
        for e in data["prefix_suffix"]
    ]
    client.table("prefix_suffix").upsert(rows, on_conflict="id").execute()
    return len(rows)


def import_passages(client: Client) -> int:
    files = sorted(TEXTS_DIR.glob("*.txt"))
    rows = [{"id": f.stem, "content": f.read_text(encoding="utf-8")} for f in files]
    for i in range(0, len(rows), BATCH_SIZE):
        client.table("passages").upsert(rows[i : i + BATCH_SIZE], on_conflict="id").execute()
    return len(rows)


def upload_diagrams(client: Client) -> int:
    storage = client.storage.from_(DIAGRAM_BUCKET)
    files = sorted(IMAGES_DIR.glob("*.png"))
    for f in files:
        path = f"diagrams/{f.name}"
        try:
            storage.upload(
                path,
                f.read_bytes(),
                {"content-type": "image/png", "upsert": "true"},
            )
        except Exception as exc:  # noqa: BLE001 - log and continue, one bad upload shouldn't abort the batch
            print(f"  ! failed to upload {f.name}: {exc}")
    return len(files)


def build_question_row(raw: dict) -> tuple[dict, bool]:
    question_type = raw["question_type"]
    section_type = raw.get("section_type") or "verbal"  # backfill: only ELF-exempel rows lack this
    variant = raw.get("variant")
    all_sources = raw.get("all_sources") or [
        {"exam": raw["source_exam"], "provpass": raw["provpass"], "variant": variant}
    ]

    raw_options = raw.get("options", [])
    # XYZ rows are image-based (re-extracted straight from the source PDFs as
    # cropped stem/option PNGs - the source math fonts have no reliable
    # Unicode mapping for operators, so text reconstruction isn't trustworthy)
    # and already carry parsed {label, text, image} dicts, not raw strings.
    if question_type == "XYZ" and raw_options and isinstance(raw_options[0], dict):
        options, needs_review = raw_options, False
    else:
        options, needs_review = parse_options(question_type, raw_options)

    excluded_incomplete = question_type == "DTK" and len(raw_options) == 0
    possibly_truncated = question_type in ("LAS", "ELF") and looks_truncated(options)

    passage_file = raw.get("passage_file")
    diagram_image = raw.get("diagram_image")

    row = {
        "id": raw["id"],
        "source_exam": raw["source_exam"],
        "provpass": raw["provpass"],
        "variant": variant,
        "section_type": section_type,
        "question_type": question_type,
        "question_number": raw["question_number"],
        "question_text": raw["question_text"],
        "options": options,
        "options_raw": raw_options,
        "correct_answer": raw["correct_answer"],
        "passage_id": passage_file[:-4] if passage_file else None,  # strip ".txt"
        "diagram_path": f"diagrams/{diagram_image}" if diagram_image else None,
        "graph_question": bool(raw.get("graph_question", False)),
        "nog_statements": raw.get("nog_statements"),
        "all_sources": all_sources,
        "needs_review": needs_review,
        "excluded_incomplete": excluded_incomplete,
        "possibly_truncated": possibly_truncated,
    }
    return row, needs_review


def import_questions(client: Client) -> dict:
    data = json.loads(QUESTIONS_FILE.read_text(encoding="utf-8"))
    questions = data["questions"]

    rows = []
    stats = {"total": 0, "needs_review": 0, "excluded_incomplete": 0, "possibly_truncated": 0, "errors": 0}
    for raw in questions:
        try:
            row, needs_review = build_question_row(raw)
        except Exception as exc:  # noqa: BLE001 - skip the bad row, keep the batch going
            stats["errors"] += 1
            print(f"  ! failed to parse question {raw.get('id')}: {exc}")
            continue
        rows.append(row)
        stats["total"] += 1
        if needs_review:
            stats["needs_review"] += 1
        if row["excluded_incomplete"]:
            stats["excluded_incomplete"] += 1
        if row["possibly_truncated"]:
            stats["possibly_truncated"] += 1

    for i in range(0, len(rows), BATCH_SIZE):
        client.table("questions").upsert(rows[i : i + BATCH_SIZE], on_conflict="id").execute()

    return stats


def main() -> None:
    env = load_env()
    client = create_client(env["SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"])

    print("Importing glossary...")
    glossary_count = import_glossary(client)
    print(f"  {glossary_count} glossary entries")

    print("Importing passages...")
    passage_count = import_passages(client)
    print(f"  {passage_count} passages")

    print("Uploading diagrams...")
    diagram_count = upload_diagrams(client)
    print(f"  {diagram_count} diagram images")

    print("Importing questions...")
    stats = import_questions(client)
    print(f"  {stats['total']} questions imported ({stats['errors']} errors)")
    print(f"  needs_review: {stats['needs_review']}")
    print(f"  excluded_incomplete: {stats['excluded_incomplete']}")
    print(f"  possibly_truncated: {stats['possibly_truncated']}")


if __name__ == "__main__":
    main()

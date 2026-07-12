#!/usr/bin/env python3
"""Local-only editor for hp_questions.json.

Not part of the deployed hp-app site — this is a standalone tool you run on
your own machine to browse the question bank one question at a time and fix
typos, answers, options, etc. Changes are written straight back to
hp_questions.json (a timestamped backup is written on first save each run).

Usage:
    python scripts/question_editor.py [--port 8765]

Then open http://localhost:8765 in a browser.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import shutil
import threading
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
QUESTIONS_PATH = ROOT / "hp_questions.json"
IMAGES_DIR = ROOT / "images"
TEXTS_DIR = ROOT / "texts"
STATIC_DIR = Path(__file__).resolve().parent / "editor_static"

EDITABLE_FIELDS = {
    "question_text",
    "options",
    "correct_answer",
    "section_type",
    "question_type",
    "nog_statements",
    "question_number",
}

_lock = threading.Lock()
_backed_up_this_run = False


def load_data() -> dict:
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        return json.load(f)


def save_data(data: dict) -> None:
    global _backed_up_this_run
    with open(QUESTIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def backup_once() -> None:
    global _backed_up_this_run
    if _backed_up_this_run:
        return
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = QUESTIONS_PATH.with_name(f"hp_questions.editor-backup-{stamp}.json")
    shutil.copy2(QUESTIONS_PATH, backup_path)
    _backed_up_this_run = True
    print(f"[editor] wrote backup to {backup_path.name} before first save this session")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # quieter default logging
        print("[editor]", fmt % args)

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path, content_type: str | None = None):
        if not path.exists() or not path.is_file():
            self.send_error(404, "Not found")
            return
        content_type = content_type or mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/" or path == "/index.html":
            self._send_file(STATIC_DIR / "index.html", "text/html; charset=utf-8")
            return
        if path == "/app.js":
            self._send_file(STATIC_DIR / "app.js", "application/javascript; charset=utf-8")
            return
        if path == "/api/data":
            with _lock:
                data = load_data()
            self._send_json(data)
            return
        if path.startswith("/images/"):
            name = path[len("/images/") :]
            # diagram_image/option "image" paths are storage-bucket paths (see
            # scripts/import_data.py, which uploads to "diagrams/<file>"), but
            # the local images/ folder itself is flat.
            if name.startswith("diagrams/"):
                name = name[len("diagrams/") :]
            self._send_file(IMAGES_DIR / name)
            return
        if path.startswith("/texts/"):
            name = path[len("/texts/") :]
            self._send_file(TEXTS_DIR / name, "text/plain; charset=utf-8")
            return

        self.send_error(404, "Not found")

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/save":
            self.send_error(404, "Not found")
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self._send_json({"ok": False, "error": "invalid JSON body"}, status=400)
            return

        question_id = payload.get("id")
        fields = payload.get("fields", {})
        if not question_id or not isinstance(fields, dict):
            self._send_json({"ok": False, "error": "expected {id, fields}"}, status=400)
            return

        unknown = set(fields) - EDITABLE_FIELDS
        if unknown:
            self._send_json({"ok": False, "error": f"non-editable fields: {sorted(unknown)}"}, status=400)
            return

        with _lock:
            backup_once()
            data = load_data()
            match = next((q for q in data["questions"] if q["id"] == question_id), None)
            if match is None:
                self._send_json({"ok": False, "error": f"no question with id {question_id}"}, status=404)
                return
            match.update(fields)
            save_data(data)

        self._send_json({"ok": True, "question": match})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true", help="don't auto-open a browser tab")
    args = parser.parse_args()

    if not QUESTIONS_PATH.exists():
        raise SystemExit(f"hp_questions.json not found at {QUESTIONS_PATH}")

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    url = f"http://127.0.0.1:{args.port}"
    print(f"[editor] serving {QUESTIONS_PATH.name} at {url} (Ctrl+C to stop)")
    if not args.no_browser:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[editor] stopped")


if __name__ == "__main__":
    main()

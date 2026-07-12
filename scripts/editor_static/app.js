// Local-only editor client. Loads the full question set once, filters/
// navigates entirely in-memory, and POSTs only the edited fields for the
// current question back to /api/save.

let ALL_QUESTIONS = [];
let FILTERED = [];
let CURSOR = 0;
let CURRENT = null; // the (possibly edited) working copy of the question in view
let DIRTY = false;
let CURRENT_PASSAGE_TEXT = null; // fetched separately, fed into the live preview once loaded

const $ = (id) => document.getElementById(id);

const OPTION_LETTERS = 'ABCDEFGH';

// Every question type but XYZ stores options as raw "A) text" strings. XYZ
// stores them pre-parsed as {label, text, image?} objects (image ones are a
// cropped answer-choice graphic with no text). Handle both shapes uniformly.
function parseOption(raw) {
  if (raw && typeof raw === 'object') {
    return { label: raw.label || '', text: raw.text || '', image: raw.image || null };
  }
  const m = String(raw).match(/^([A-Z])\)\s?(.*)$/s);
  if (m) return { label: m[1], text: m[2], image: null };
  return { label: '', text: raw, image: null };
}

function isObjectOptionFormat(question) {
  const first = (question.options || [])[0];
  return question.question_type === 'XYZ' || (first && typeof first === 'object');
}

function formatOption(question, label, text, image) {
  if (isObjectOptionFormat(question)) {
    const opt = { label, text };
    if (image) opt.image = image;
    return opt;
  }
  return `${label}) ${text}`;
}

async function loadData() {
  const res = await fetch('/api/data');
  const data = await res.json();
  ALL_QUESTIONS = data.questions;
  buildFilters();
  applyFilters();
  loadJson.total = ALL_QUESTIONS.length;
}

function buildFilters() {
  const exams = [...new Set(ALL_QUESTIONS.map((q) => q.source_exam))].sort();
  const types = [...new Set(ALL_QUESTIONS.map((q) => q.question_type))].sort();

  const examSel = $('filter-exam');
  examSel.innerHTML = '<option value="">Alla prov</option>' + exams.map((e) => `<option value="${e}">${e}</option>`).join('');

  const typeSel = $('filter-type');
  typeSel.innerHTML = '<option value="">Alla frågetyper</option>' + types.map((t) => `<option value="${t}">${t}</option>`).join('');

  updateProvpassOptions();
}

function updateProvpassOptions() {
  const exam = $('filter-exam').value;
  const pool = exam ? ALL_QUESTIONS.filter((q) => q.source_exam === exam) : ALL_QUESTIONS;
  const provpasses = [...new Set(pool.map((q) => q.provpass))].sort((a, b) => a - b);
  const sel = $('filter-provpass');
  const prev = sel.value;
  sel.innerHTML = '<option value="">Alla provpass</option>' + provpasses.map((p) => `<option value="${p}">Provpass ${p}</option>`).join('');
  if (provpasses.map(String).includes(prev)) sel.value = prev;
}

function applyFilters({ keepCursor } = {}) {
  const exam = $('filter-exam').value;
  const provpass = $('filter-provpass').value;
  const type = $('filter-type').value;
  const search = $('filter-search').value.trim().toLowerCase();

  FILTERED = ALL_QUESTIONS.filter((q) => {
    if (exam && q.source_exam !== exam) return false;
    if (provpass && String(q.provpass) !== provpass) return false;
    if (type && q.question_type !== type) return false;
    if (search && !(q.question_text || '').toLowerCase().includes(search)) return false;
    return true;
  });

  if (!keepCursor) CURSOR = 0;
  if (CURSOR >= FILTERED.length) CURSOR = Math.max(0, FILTERED.length - 1);
  renderCurrent();
}

function confirmDiscardIfDirty() {
  if (!DIRTY) return true;
  return confirm('Osparade ändringar går förlorade. Fortsätt?');
}

function renderCurrent() {
  const q = FILTERED[CURSOR];
  CURRENT = q ? JSON.parse(JSON.stringify(q)) : null;
  DIRTY = false;
  setStatus('', '');

  $('nav-count').textContent = FILTERED.length ? `${CURSOR + 1} / ${FILTERED.length}` : '0 / 0';
  $('jump').value = FILTERED.length ? CURSOR + 1 : '';
  $('prev').disabled = CURSOR <= 0;
  $('next').disabled = CURSOR >= FILTERED.length - 1;
  $('save').disabled = !CURRENT;

  if (!CURRENT) {
    for (const el of document.querySelectorAll('#edit-panel input, #edit-panel textarea, #edit-panel select')) el.value = '';
    $('options-list').innerHTML = '';
    $('meta-source').textContent = 'Ingen fråga matchar filtret.';
    $('meta-id').textContent = '';
    $('diagram-field').style.display = 'none';
    $('passage-field').style.display = 'none';
    return;
  }

  $('f-question_type').value = CURRENT.question_type || '';
  $('f-section_type').value = CURRENT.section_type || 'verbal';
  $('f-question_number').value = CURRENT.question_number ?? '';
  $('f-question_text').value = CURRENT.question_text || '';
  $('f-correct_answer').value = CURRENT.correct_answer || '';

  renderOptions();

  const nog = CURRENT.nog_statements;
  $('nog-field').style.display = nog ? '' : 'none';
  $('f-nog-1').value = nog ? nog[0] : '';
  $('f-nog-2').value = nog ? nog[1] : '';

  $('meta-id').textContent = CURRENT.id;
  $('meta-source').innerHTML =
    `exam <code>${CURRENT.source_exam}</code> · provpass <code>${CURRENT.provpass}</code>` +
    (CURRENT.variant ? ` · variant <code>${CURRENT.variant}</code>` : '') +
    `<br/>${(CURRENT.all_sources || []).length} källa/källor`;

  if (CURRENT.diagram_image) {
    $('diagram-field').style.display = '';
    $('diagram-img').src = `/images/${CURRENT.diagram_image}`;
  } else {
    $('diagram-field').style.display = 'none';
  }

  CURRENT_PASSAGE_TEXT = null;
  if (CURRENT.passage_file) {
    $('passage-field').style.display = '';
    $('passage-box').textContent = 'Laddar…';
    fetch(`/texts/${CURRENT.passage_file}`)
      .then((r) => r.text())
      .then((t) => {
        $('passage-box').textContent = t;
        CURRENT_PASSAGE_TEXT = t;
        renderPreview();
      });
  } else {
    $('passage-field').style.display = 'none';
  }

  renderPreview();
}

// Mirrors the branching in hp-app/src/components/QuestionCard/index.tsx:
// diagram image takes priority, then LAS/ELF passage, then KVA/NOG special
// layouts, falling back to a plain question+options card.
function renderPreview() {
  const root = $('preview-root');
  if (!CURRENT) {
    root.innerHTML = '<p class="sp-empty">Ingen fråga.</p>';
    return;
  }

  const parts = [];

  if (CURRENT.diagram_image) {
    parts.push(`<img class="sp-img" src="/images/${CURRENT.diagram_image}" alt="" />`);
  } else if (CURRENT.passage_file) {
    parts.push(`<div class="sp-box">${escapeHtml(CURRENT_PASSAGE_TEXT ?? 'Laddar text…')}</div>`);
  }

  const kva = CURRENT.question_type === 'KVA' ? parseKva(CURRENT.question_text) : null;
  if (kva) {
    parts.push('<div class="sp-label">Jämför de två kvantiteterna</div>');
    if (kva.intro) parts.push(`<div class="sp-box">${escapeHtml(kva.intro)}</div>`);
    parts.push(`
      <div class="sp-kva-row">
        <div class="sp-kva-box"><div class="sp-label">Kvantitet I</div><div class="sp-kva-val">${escapeHtml(kva.quantityI)}</div></div>
        <div class="sp-kva-box"><div class="sp-label">Kvantitet II</div><div class="sp-kva-val">${escapeHtml(kva.quantityII)}</div></div>
      </div>
    `);
  } else if (CURRENT.question_text) {
    parts.push(`<div class="sp-q">${escapeHtml(CURRENT.question_text)}</div>`);
  }

  if (CURRENT.nog_statements) {
    parts.push(`<div class="sp-box">${CURRENT.nog_statements.map((s) => escapeHtml(s)).join('<br/>')}</div>`);
    parts.push('<div class="sp-label" style="text-transform:none;font-weight:400">Räcker informationen i (1) och/eller (2) för att besvara frågan?</div>');
  }

  parts.push(renderPreviewOptions());

  root.innerHTML = parts.join('\n');
}

function renderPreviewOptions() {
  const opts = CURRENT.options || [];
  if (!opts.length) return '<p class="sp-empty">Inga svarsalternativ.</p>';
  return opts
    .map((raw) => {
      const { label, text, image } = parseOption(raw);
      const isCorrect = label && label === CURRENT.correct_answer;
      const body = image ? `<img class="sp-opt-img" src="/images/${image}" alt="" />` : `<span>${escapeHtml(text)}</span>`;
      return `<div class="sp-opt${isCorrect ? ' correct' : ''}"><span class="sp-badge">${escapeHtml(label)}</span>${body}</div>`;
    })
    .join('\n');
}

const KVA_PATTERN = /^([\s\S]*?)Kvantitet I:\s*([\s\S]*?)\s*Kvantitet II:\s*([\s\S]*)$/;

function parseKva(text) {
  const m = (text || '').match(KVA_PATTERN);
  if (!m) return null;
  return { intro: m[1].trim(), quantityI: m[2].trim(), quantityII: m[3].trim() };
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderOptions() {
  const list = $('options-list');
  list.innerHTML = '';
  (CURRENT.options || []).forEach((raw, i) => {
    const { label, text, image } = parseOption(raw);
    const row = document.createElement('div');
    row.className = 'option-row';
    row.innerHTML = `
      <input class="opt-label" type="text" value="${escapeAttr(label)}" style="width:44px" maxlength="1" />
      <input class="opt-text" type="text" value="${escapeAttr(text)}" placeholder="${image ? '(bildalternativ, ingen text)' : ''}" />
      ${image ? `<img class="diagram" style="max-width:70px;max-height:36px;margin:0" src="/images/${image}" title="${escapeAttr(image)}" />` : ''}
      <button type="button" class="remove">✕</button>
    `;
    row.querySelector('.opt-label').addEventListener('input', () => onOptionEdited(i));
    row.querySelector('.opt-text').addEventListener('input', () => onOptionEdited(i));
    row.querySelector('.remove').addEventListener('click', () => {
      CURRENT.options.splice(i, 1);
      markDirty();
      renderOptions();
    });
    list.appendChild(row);
  });
}

function onOptionEdited(i) {
  const rows = document.querySelectorAll('.option-row');
  const row = rows[i];
  const label = row.querySelector('.opt-label').value.trim().toUpperCase();
  const text = row.querySelector('.opt-text').value;
  const { image } = parseOption(CURRENT.options[i]);
  CURRENT.options[i] = formatOption(CURRENT, label, text, image);
  markDirty();
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function markDirty() {
  DIRTY = true;
  setStatus('Osparat', 'dirty');
  renderPreview();
}

function setStatus(text, cls) {
  const el = $('status');
  el.textContent = text;
  el.className = cls || '';
}

function bindFieldWatchers() {
  const map = {
    'f-question_type': 'question_type',
    'f-section_type': 'section_type',
    'f-question_number': 'question_number',
    'f-question_text': 'question_text',
    'f-correct_answer': 'correct_answer',
  };
  for (const [id, field] of Object.entries(map)) {
    $(id).addEventListener('input', () => {
      if (!CURRENT) return;
      let v = $(id).value;
      if (field === 'question_number') v = v === '' ? null : Number(v);
      CURRENT[field] = v;
      markDirty();
    });
  }
  $('f-nog-1').addEventListener('input', () => {
    if (!CURRENT) return;
    CURRENT.nog_statements = [$('f-nog-1').value, $('f-nog-2').value];
    markDirty();
  });
  $('f-nog-2').addEventListener('input', () => {
    if (!CURRENT) return;
    CURRENT.nog_statements = [$('f-nog-1').value, $('f-nog-2').value];
    markDirty();
  });
}

async function save() {
  if (!CURRENT) return;
  setStatus('Sparar…', 'dirty');
  const fields = {
    question_text: CURRENT.question_text,
    options: CURRENT.options,
    correct_answer: CURRENT.correct_answer,
    section_type: CURRENT.section_type,
    question_type: CURRENT.question_type,
    question_number: CURRENT.question_number,
  };
  // only touch nog_statements for questions that actually have it, so saving
  // an unrelated question never adds a stray null field to it
  if (CURRENT.nog_statements) fields.nog_statements = CURRENT.nog_statements;
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: CURRENT.id, fields }),
    });
    const body = await res.json();
    if (!body.ok) throw new Error(body.error || 'save failed');

    // keep the in-memory copies in sync so filters/search stay accurate
    const idxAll = ALL_QUESTIONS.findIndex((q) => q.id === CURRENT.id);
    if (idxAll !== -1) ALL_QUESTIONS[idxAll] = body.question;
    const idxFiltered = FILTERED.findIndex((q) => q.id === CURRENT.id);
    if (idxFiltered !== -1) FILTERED[idxFiltered] = body.question;

    DIRTY = false;
    setStatus('Sparat ✓', 'ok');
  } catch (e) {
    setStatus('Fel: ' + e.message, 'err');
  }
}

function goto(delta) {
  if (!confirmDiscardIfDirty()) return;
  CURSOR = Math.min(Math.max(CURSOR + delta, 0), FILTERED.length - 1);
  renderCurrent();
}

function init() {
  bindFieldWatchers();

  $('filter-exam').addEventListener('change', () => {
    updateProvpassOptions();
    applyFilters();
  });
  $('filter-provpass').addEventListener('change', () => applyFilters());
  $('filter-type').addEventListener('change', () => applyFilters());
  $('filter-search').addEventListener('input', () => applyFilters());

  $('prev').addEventListener('click', () => goto(-1));
  $('next').addEventListener('click', () => goto(1));
  $('jump').addEventListener('change', () => {
    if (!confirmDiscardIfDirty()) return;
    const n = Number($('jump').value);
    if (n >= 1 && n <= FILTERED.length) {
      CURSOR = n - 1;
      renderCurrent();
    }
  });
  $('add-option').addEventListener('click', () => {
    if (!CURRENT) return;
    const used = (CURRENT.options || []).map((o) => parseOption(o).label);
    const nextLabel = [...OPTION_LETTERS].find((l) => !used.includes(l)) || '?';
    CURRENT.options = [...(CURRENT.options || []), formatOption(CURRENT, nextLabel, '', null)];
    markDirty();
    renderOptions();
  });
  $('save').addEventListener('click', save);

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        save();
      }
      return;
    }
    if (e.key === 'ArrowLeft') goto(-1);
    if (e.key === 'ArrowRight') goto(1);
  });

  window.addEventListener('beforeunload', (e) => {
    if (DIRTY) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  loadData();
}

function loadJson() {}

init();

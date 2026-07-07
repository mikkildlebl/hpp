-- Högskoleprovet practice app schema.
-- Run once in the Supabase SQL Editor after creating the project.
-- Content is read-only from the client (anon key); all writes happen
-- via scripts/import_data.py using the service_role key, which bypasses RLS.

create table public.passages (
  id text primary key,              -- hex filename stem, e.g. 'f77cd3795b1946eb'
  content text not null,
  created_at timestamptz not null default now()
);

create table public.questions (
  id text primary key,              -- hex id from source JSON, e.g. '9da986bd8b60'
  source_exam text not null,
  provpass smallint not null,
  variant text,
  section_type text not null check (section_type in ('verbal', 'kvant')),
  question_type text not null check (question_type in
    ('ORD', 'LAS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK')),
  question_number smallint not null,
  question_text text not null,
  options jsonb not null default '[]',       -- parsed [{"label": "A", "text": "..."}]
  options_raw jsonb not null default '[]',   -- untouched original option strings
  correct_answer text not null,
  passage_id text references public.passages (id) on delete set null,
  diagram_path text,                          -- storage object path in hp-diagrams bucket
  graph_question boolean not null default false,
  nog_statements jsonb,
  all_sources jsonb not null default '[]',
  needs_review boolean not null default false,
  excluded_incomplete boolean not null default false,
  possibly_truncated boolean not null default false,  -- LAS/ELF rows whose option text is cut mid-sentence in the source data
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index questions_type_idx on public.questions (question_type);
create index questions_section_idx on public.questions (section_type);
create index questions_passage_idx on public.questions (passage_id);

create table public.prefix_suffix (
  id text primary key,               -- e.g. 'p-a', 's-ism'
  type text not null check (type in ('prefix', 'suffix')),
  word text not null,
  meaning text not null,
  examples text not null
);

alter table public.passages enable row level security;
alter table public.questions enable row level security;
alter table public.prefix_suffix enable row level security;

create policy "public read" on public.passages for select using (true);
create policy "public read" on public.questions for select using (true);
create policy "public read" on public.prefix_suffix for select using (true);
-- deliberately no insert/update/delete policies for anon/authenticated roles.

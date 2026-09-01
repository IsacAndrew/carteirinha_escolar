create table if not exists alunos (
  id uuid primary key,
  nome text not null default '',
  ra text default '',
  turma text default '',
  foto text default '',
  modelo_id uuid,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
create table if not exists modelos (
  id uuid primary key,
  nome text not null,
  padrao boolean not null default false,
  aluno_exclusivo_id uuid,
  frente jsonb not null default '[]'::jsonb,
  verso jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);
create table if not exists overrides (
  id uuid primary key,
  aluno_id uuid not null,
  modelo_id uuid not null,
  frente jsonb,
  verso jsonb,
  unique(aluno_id, modelo_id)
);


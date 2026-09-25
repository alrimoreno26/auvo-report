-- Tabla de reportes: cada fila guarda el JSON completo generado por scripts/extract-report.mjs
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  company text not null,
  period_start date not null,
  period_end date not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists reports_period_idx on public.reports (period_end desc);

-- Solo usuarios autenticados pueden leer; nadie puede escribir desde el cliente
-- (los reportes se cargan desde el SQL Editor o con la service role key).
alter table public.reports enable row level security;

drop policy if exists "reports readable by authenticated users" on public.reports;
create policy "reports readable by authenticated users"
  on public.reports for select
  to authenticated
  using (true);

-- Historial para comparar períodos: clave de empresa en los reportes + tareas de cada carga.

-- 1. Clave normalizada de empresa ("Asesoría Técnica Global" → "asesoria-tecnica-global"),
--    para encontrar el reporte anterior de la misma empresa aunque se escriba con otras mayúsculas/acentos.
create extension if not exists unaccent with schema extensions;

alter table public.reports add column if not exists company_key text;

update public.reports
set company_key = lower(trim(both '-' from regexp_replace(extensions.unaccent(company), '[^a-zA-Z0-9]+', '-', 'g')))
where company_key is null;

alter table public.reports alter column company_key set not null;
create index if not exists reports_company_period_idx on public.reports (company_key, period_start desc);

-- 2. Tareas normalizadas de cada reporte (una fila por tarea del Excel)
create table if not exists public.report_tasks (
  report_id uuid not null references public.reports (id) on delete cascade,
  codigo text not null,
  fecha date,
  responsable text,
  cliente text,
  cadena text,
  tipo text,
  prioridad text,
  finalizada boolean not null default false,
  -- Todos los campos preparados por el generador (fechas en ms, minutos, distancias…)
  data jsonb not null,
  primary key (report_id, codigo)
);

create index if not exists report_tasks_fecha_idx on public.report_tasks (fecha);

alter table public.report_tasks enable row level security;

drop policy if exists "report_tasks readable by authenticated users" on public.report_tasks;
create policy "report_tasks readable by authenticated users"
  on public.report_tasks for select
  to authenticated
  using (true);

drop policy if exists "report_tasks writable by admins" on public.report_tasks;
create policy "report_tasks writable by admins"
  on public.report_tasks for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Los administradores (app_metadata.role = 'admin') pueden publicar y reemplazar reportes
-- desde la pantalla "Nuevo reporte". app_metadata solo lo puede modificar el servidor.
drop policy if exists "reports insertable by admins" on public.reports;
create policy "reports insertable by admins"
  on public.reports for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "reports updatable by admins" on public.reports;
create policy "reports updatable by admins"
  on public.reports for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "reports deletable by admins" on public.reports;
create policy "reports deletable by admins"
  on public.reports for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

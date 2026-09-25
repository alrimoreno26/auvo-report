# auvo-report

Visor de reportes de Customer Success (React + TypeScript + Vite), con login vía Supabase Auth.

## Scripts

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de producción en `dist/`
- `npm run preview`: sirve el build localmente
- `npm run extract -- <reporte.html>`: convierte un reporte HTML en `data/<nombre>.json` + `data/<nombre>.sql`

## Deploy en Vercel

1. En https://vercel.com → **Add New → Project** → importar el repo `alrimoreno26/auvo-report`.
   Vercel detecta Vite; la configuración está en `vercel.json` (build `npm run build`, salida `dist`,
   y rewrite de todas las rutas a `index.html` para el router).
2. En **Settings → Environment Variables** agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Production y Preview). Las variables se leen en el build: tras cambiarlas, hacer *Redeploy*.
3. Cada push a `main` despliega a producción; cada rama/PR genera un preview.

También se puede desplegar desde la terminal con `npx vercel` (preview) o `npx vercel --prod`.

En Supabase → Authentication → URL Configuration, poner la URL de Vercel como *Site URL*.

## Configuración de Supabase

1. Crear un proyecto en https://supabase.com.
2. SQL Editor → ejecutar, en orden, `supabase/migrations/0001_reports.sql` y `0002_reports_admin_write.sql`.
3. Authentication → Sign In / Providers → **desactivar "Allow new users to sign up"** y crear los usuarios desde
   Authentication → Users → *Add user*.
4. Copiar `.env.example` a `.env.local` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API). La anon key es pública; los datos quedan protegidos por RLS.

## Usuarios y administradores

La pantalla **Usuarios** (`/usuarios`) solo aparece para administradores: lista los usuarios (activos / pendientes)
y permite crearlos con rol Lector o Administrador. Al crear un usuario se le envía un **correo de acceso** (Resend)
con sus datos y un enlace de un solo uso a `/crear-contrasena`, donde define su propia contraseña.
Si el enlace vence, **Reenviar acceso** envía uno nuevo. Si el correo no se puede enviar, la app muestra el enlace
para compartirlo a mano.

Desde el menú **⋯** de cada fila también se puede **deshabilitar** a un usuario (no puede iniciar sesión; la cuenta
y el rol se conservan y se puede **habilitar** de nuevo) o **eliminarlo** definitivamente (hay que escribir su email
para confirmar). Nadie puede aplicar estas acciones sobre su propia cuenta, y no se puede dejar la plataforma sin
ningún administrador activo. Una sesión ya abierta de un usuario deshabilitado dura como máximo lo que el token
de acceso (1 h por defecto).

Todo pasa por la Edge Function `supabase/functions/admin-users` (`index.ts` + `email.ts`, la plantilla del correo),
que usa la service role key del lado del servidor.

1. **Resend:** crear una cuenta en https://resend.com, verificar el dominio del remitente (Domains → Add domain,
   cargar los registros DNS) y crear una API key.
2. **Secretos de la función** (Supabase → Edge Functions → Secrets):

   | Secreto | Ejemplo |
   | --- | --- |
   | `RESEND_API_KEY` | `re_...` |
   | `EMAIL_FROM` | `Auvo Report <accesos@tudominio.com>` |
   | `APP_URL` | `https://auvo-report.vercel.app` |
   | `LINK_EXPIRES_HOURS` | `24` |

3. **Vigencia del enlace:** Authentication → Sign In / Providers → Email → *Email OTP Expiration* = `86400` (24 h),
   y el mismo valor en horas en `LINK_EXPIRES_HOURS` (es lo que dice el correo).
4. **Desplegar la función** con sus dos archivos:
   - Dashboard: Edge Functions → `admin-users` → editar, agregar el archivo `email.ts` y reemplazar `index.ts`.
   - O con la CLI: `npx supabase functions deploy admin-users --no-verify-jwt --project-ref <id-del-proyecto>`.

   En la configuración de la función, **Verify JWT** debe quedar desactivado (la función valida la sesión y el rol).
5. **Primer administrador:** crearlo desde Authentication → Users → *Add user* y darle el rol en el SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
   where email = 'tu@email.com';
   ```

   Cerrar sesión y volver a entrar para que el rol se aplique.

Vista previa del correo: `node scripts/preview-email.mjs` (o `… resend`) genera `data/email-preview.html`.

## Generar un reporte desde el Excel

Los administradores ven **+ Nuevo reporte** en el listado (`/reportes/nuevo`):

1. Arrastrar el **Informe de Tareas** exportado de la plataforma (el export HTML `.xls`, o un `.xls`/`.xlsx` real).
2. Completar empresa, código de cuenta (opcional) y tolerancia de puntualidad (15 min por defecto).
3. **Generar vista previa** → revisar → **Publicar reporte**. Si ya existe uno de la misma empresa y período, se reemplaza.

El archivo se procesa en el navegador (`src/generator/`, port en TypeScript de `generar_reporte.py`); solo se guarda
el JSON resultante en la tabla `reports`.

Para probar sin datos reales: `node scripts/make-fixture.mjs` genera `data/fixtures/informe_tareas_prueba.xls`
(480 tareas sintéticas) y un `.expected.json` con los indicadores esperados.

## Cargar un reporte desde un HTML ya generado

```bash
npm run extract -- ruta/al/Reporte.html
```

Pegar el contenido de `data/<nombre>.sql` en el SQL Editor de Supabase (hace upsert por `slug`).
La carpeta `data/` está en `.gitignore`: contiene información de clientes y no debe subirse al repo.

## Modo local

Sin `.env.local`, `npm run dev` arranca en **modo local**: acepta cualquier login y lee los reportes de `data/*.json`.
Ese modo solo existe en desarrollo; el build de producción exige Supabase.

## Estructura

```
src/
  api/          acceso a datos (Supabase o data/ local)
  auth/         AuthProvider, useAuth, RequireAuth
  components/
    charts/     HBarChart, ColumnChart, WeeklyChart, AreaChart, Heatmap, StackBar
    layout/     AppBar, Hero, SectionNav, Section, ReportFooter
    ui/         Card, Grid, KpiCard, AlertItem, DataTable, Tooltip, RichText
  pages/        LoginPage, ReportsPage, ReportPage
  report/       ReportView + una sección por archivo
  types/        esquema del JSON del reporte
  generator/    lectura del Excel, cálculo de indicadores y armado del reporte
scripts/        extract-report.mjs, make-fixture.mjs, preview-email.mjs
supabase/       migraciones SQL
```

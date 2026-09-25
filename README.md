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
2. SQL Editor → ejecutar `supabase/migrations/0001_reports.sql`.
3. Authentication → Sign In / Providers → **desactivar "Allow new users to sign up"** y crear los usuarios desde
   Authentication → Users → *Add user*.
4. Copiar `.env.example` a `.env.local` y completar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API). La anon key es pública; los datos quedan protegidos por RLS.

## Cargar un reporte

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
scripts/        extract-report.mjs
supabase/       migraciones SQL
```

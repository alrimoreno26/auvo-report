import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAdmin } from './auth/RequireAdmin'
import { RequireAuth } from './auth/RequireAuth'
import { isLocalMode, isSupabaseConfigured } from './lib/supabase'
import { LoginPage } from './pages/LoginPage'
import { ReportPage } from './pages/ReportPage'
import { ReportsPage } from './pages/ReportsPage'
import { UsersPage } from './pages/UsersPage'

// El generador (y la librería de Excel) solo se descarga al abrir esta pantalla
const NewReportPage = lazy(() => import('./pages/NewReportPage').then((m) => ({ default: m.NewReportPage })))

export default function App() {
  if (!isSupabaseConfigured && !isLocalMode) {
    return (
      <div className="screen-center">
        Falta configurar <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
      </div>
    )
  }

  // BrowserRouter: vercel.json reescribe todas las rutas a index.html
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <ReportsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/reportes/nuevo"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <Suspense fallback={<div className="screen-center muted">Cargando…</div>}>
                    <NewReportPage />
                  </Suspense>
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route
            path="/reportes/:slug"
            element={
              <RequireAuth>
                <ReportPage />
              </RequireAuth>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RequireAuth>
                <RequireAdmin>
                  <UsersPage />
                </RequireAdmin>
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

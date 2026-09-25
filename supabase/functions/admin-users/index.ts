// Edge Function: administración de usuarios de Supabase Auth.
//   GET                                   → lista los usuarios
//   POST { action: 'create', email, name?, role }  → crea el usuario y le envía el correo de acceso
//   POST { action: 'resend', userId }              → reenvía el correo de acceso
// Solo la pueden usar usuarios con app_metadata.role = 'admin'.
//
// Secretos (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY      clave de https://resend.com
//   EMAIL_FROM          remitente verificado, p. ej. "Auvo Report <accesos@tudominio.com>"
//   APP_URL             URL pública de la app, p. ej. https://auvo-report.vercel.app
//   LINK_EXPIRES_HOURS  vigencia del enlace (debe coincidir con Auth → Email OTP Expiration). Por defecto 1.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase; nunca llegan al navegador.
import { createClient, type User } from 'npm:@supabase/supabase-js@2'
import { renderAccessEmail } from './email.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const toDto = (u: User) => ({
  id: u.id,
  email: u.email ?? '',
  name: (u.user_metadata?.name as string | undefined) ?? null,
  role: u.app_metadata?.role === 'admin' ? 'admin' : 'viewer',
  created_at: u.created_at,
  last_sign_in_at: u.last_sign_in_at ?? null,
})

/** Contraseña aleatoria que nadie conoce: la persona define la suya con el enlace */
function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  // Quién llama: se valida su token de sesión y su rol
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const { data: caller } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  if (!caller.user) return json({ error: 'No autenticado' }, 401)
  if (caller.user.app_metadata?.role !== 'admin') return json({ error: 'Solo administradores' }, 403)

  if (req.method === 'GET') {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return json({ error: error.message }, 500)
    return json(data.users.map(toDto))
  }

  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  let body: { action?: string; email?: string; name?: string; role?: string; userId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400)
  }

  const appUrl = (Deno.env.get('APP_URL') || req.headers.get('origin') || '').replace(/\/$/, '')
  if (!/^https?:\/\//.test(appUrl)) return json({ error: 'Falta configurar APP_URL en los secretos de la función' }, 500)
  const expiresInHours = Number(Deno.env.get('LINK_EXPIRES_HOURS') || 1)
  const invitedBy = (caller.user.user_metadata?.name as string | undefined) || caller.user.email || null

  /** Genera un enlace de un solo uso a /crear-contrasena y envía el correo. */
  async function sendAccess(user: User, kind: 'invite' | 'resend') {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: user.email! })
    if (error) throw new Error(`No se pudo generar el enlace: ${error.message}`)
    const params = new URLSearchParams({ token_hash: data.properties.hashed_token, type: 'recovery' })
    const link = `${appUrl}/crear-contrasena?${params}`

    const apiKey = Deno.env.get('RESEND_API_KEY')
    const from = Deno.env.get('EMAIL_FROM')
    if (!apiKey || !from) return { emailSent: false, link, emailError: 'Falta configurar RESEND_API_KEY y EMAIL_FROM' }

    const mail = renderAccessEmail({
      name: (user.user_metadata?.name as string | undefined) ?? null,
      email: user.email!,
      role: user.app_metadata?.role === 'admin' ? 'admin' : 'viewer',
      link,
      appUrl,
      invitedBy: kind === 'invite' ? invitedBy : null,
      expiresInHours,
      kind,
    })
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [user.email], subject: mail.subject, html: mail.html, text: mail.text }),
    })
    if (!res.ok) {
      const detail = await res.json().catch(() => null)
      // El enlace se devuelve para que el administrador pueda compartirlo a mano
      return { emailSent: false, link, emailError: detail?.message ?? `Resend respondió ${res.status}` }
    }
    return { emailSent: true }
  }

  try {
    if (body.action === 'resend') {
      if (!body.userId) return json({ error: 'Falta el usuario' }, 400)
      const { data, error } = await admin.auth.admin.getUserById(body.userId)
      if (error || !data.user) return json({ error: 'Usuario no encontrado' }, 404)
      return json({ user: toDto(data.user), ...(await sendAccess(data.user, 'resend')) })
    }

    // Alta (action: 'create'; también por defecto)
    const email = body.email?.trim().toLowerCase()
    const name = body.name?.trim() || undefined
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email inválido' }, 400)

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: randomPassword(),
      email_confirm: true,
      user_metadata: name ? { name } : {},
      app_metadata: body.role === 'admin' ? { role: 'admin' } : {},
    })
    if (error) {
      const exists = /already been registered|already exists/i.test(error.message)
      return json({ error: exists ? 'Ya existe un usuario con ese email' : error.message }, exists ? 409 : 400)
    }
    return json({ user: toDto(data.user), ...(await sendAccess(data.user, 'invite')) }, 201)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error inesperado' }, 500)
  }
})
